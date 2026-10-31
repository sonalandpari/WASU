import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SOCKET_CLIENT_EVENTS,
  SOCKET_SERVER_EVENTS,
} from "@contextflow/shared";
import { PresenceService } from "../services/presenceService";
import { ActivityService } from "../services/activityService";
import { DiscussionService } from "../services/discussionService";
import { ProjectService } from "../services/projectService";
import { prisma } from "../db/prisma";

interface SocketSession {
  projectId?: string;
  userId?: string;
  userName?: string;
}

export class SocketServer {
  private static io: Server<ClientToServerEvents, ServerToClientEvents>;
  private static socketSessions = new Map<string, SocketSession>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  public static init(httpServer: HttpServer): Server<ClientToServerEvents, ServerToClientEvents> {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingTimeout: 20000,
      pingInterval: 10000,
    });

    this.io.on("connection", (socket: Socket) => {
      this.handleConnection(socket);
    });

    // Start background stale-presence cleanup sweep
    const intervalMs = parseInt(process.env.PRESENCE_CLEANUP_INTERVAL_MS || "15000", 10);
    this.cleanupInterval = setInterval(async () => {
      try {
        const expired = await PresenceService.expireStalePresence();
        for (const member of expired) {
          const room = `project:${member.projectId}`;
          this.io.to(room).emit(SOCKET_SERVER_EVENTS.PRESENCE_UPDATED, member);
        }
      } catch (err) {
        console.error("Error during stale presence sweep:", err);
      }
    }, intervalMs);

    return this.io;
  }

  public static getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
    if (!this.io) {
      throw new Error("Socket.IO server has not been initialized!");
    }
    return this.io;
  }

  public static close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    return new Promise((resolve) => {
      if (this.io) {
        this.io.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private static handleConnection(socket: Socket) {
    const session: SocketSession = {};
    this.socketSessions.set(socket.id, session);

    // -------------------------------------------------------------------------
    // 1. project.join
    // -------------------------------------------------------------------------
    socket.on(SOCKET_CLIENT_EVENTS.PROJECT_JOIN, async (payload, callback) => {
      try {
        const { projectId, userId, userName, lastEventOccurredAt } = payload;
        if (!projectId || !userId) {
          socket.emit(SOCKET_SERVER_EVENTS.ERROR, {
            code: "BAD_REQUEST",
            message: "projectId and userId are required to join",
          });
          if (callback) callback({ success: false, error: "projectId and userId are required" });
          return;
        }

        const room = `project:${projectId}`;
        socket.join(room);

        session.projectId = projectId;
        session.userId = userId;
        session.userName = userName;

        // Ensure project membership record exists
        const member = await ProjectService.joinProject(projectId, {
          userId,
          userName,
          role: payload.role,
        });

        // Update presence to ONLINE
        const presence = await PresenceService.updatePresence(projectId, {
          userId,
          userName,
          connectionStatus: "ONLINE",
        });

        // Notify other room members of presence update
        socket.to(room).emit(SOCKET_SERVER_EVENTS.PRESENCE_UPDATED, presence);

        // Record and broadcast MEMBER_JOINED activity event for new joins (not reconnects)
        if (!lastEventOccurredAt) {
          const joinEvent = await ActivityService.createEvent(projectId, {
            type: "MEMBER_JOINED",
            actorId: userId,
            actorName: userName,
            payload: {
              userId,
              userName,
              role: member.role,
              joinedAt: member.joinedAt,
            },
          });
          socket.to(room).emit(SOCKET_SERVER_EVENTS.ACTIVITY_CREATED, joinEvent);
        }

        // Fetch current online members and recent activity
        const onlineMembers = await PresenceService.getActivePresence(projectId);
        const recentEvents = await ActivityService.getEvents(projectId, {
          since: lastEventOccurredAt,
          limit: 50,
        });

        const joinData = {
          projectId,
          userId,
          onlineMembers,
          recentEvents,
        };

        socket.emit(SOCKET_SERVER_EVENTS.PROJECT_JOINED, joinData);
        if (callback) callback({ success: true, data: joinData });
      } catch (err: any) {
        console.error("Error in project.join:", err);
        socket.emit(SOCKET_SERVER_EVENTS.ERROR, {
          code: "JOIN_FAILED",
          message: err.message || "Failed to join project room",
        });
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // -------------------------------------------------------------------------
    // 2. presence.update
    // -------------------------------------------------------------------------
    socket.on(SOCKET_CLIENT_EVENTS.PRESENCE_UPDATE, async (payload, callback) => {
      try {
        const { projectId, userId, userName, activeFilePath, connectionStatus } = payload;
        if (!projectId || !userId) {
          if (callback) callback({ success: false, error: "projectId and userId are required" });
          return;
        }

        const updated = await PresenceService.updatePresence(projectId, {
          userId,
          userName,
          activeFilePath,
          connectionStatus: connectionStatus || "ONLINE",
        });

        const room = `project:${projectId}`;
        // Broadcast presence update to all members in the project room
        this.io.to(room).emit(SOCKET_SERVER_EVENTS.PRESENCE_UPDATED, updated);

        if (callback) callback({ success: true });
      } catch (err: any) {
        console.error("Error in presence.update:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // -------------------------------------------------------------------------
    // 3. activity.create
    // -------------------------------------------------------------------------
    socket.on(SOCKET_CLIENT_EVENTS.ACTIVITY_CREATE, async (payload, callback) => {
      try {
        const { projectId, type, actorId, actorName, payload: eventPayload } = payload;
        if (!projectId || !type) {
          if (callback) callback({ success: false, error: "projectId and type are required" });
          return;
        }

        // Persist event with authoritative backend timestamp
        const event = await ActivityService.createEvent(projectId, {
          type,
          actorId,
          actorName,
          payload: eventPayload,
        });

        const room = `project:${projectId}`;
        // Broadcast to all members in the project room
        this.io.to(room).emit(SOCKET_SERVER_EVENTS.ACTIVITY_CREATED, event);

        if (callback) callback({ success: true, data: event });
      } catch (err: any) {
        console.error("Error in activity.create:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // -------------------------------------------------------------------------
    // 4. message.create
    // -------------------------------------------------------------------------
    socket.on(SOCKET_CLIENT_EVENTS.MESSAGE_CREATE, async (payload, callback) => {
      try {
        const { projectId, userId, userName, content, links } = payload;
        if (!projectId || !userId || !content) {
          if (callback) callback({ success: false, error: "Missing message payload fields" });
          return;
        }

        const message = await DiscussionService.createMessage(projectId, {
          userId,
          userName,
          content,
          links,
        });

        const room = `project:${projectId}`;
        this.io.to(room).emit(SOCKET_SERVER_EVENTS.MESSAGE_CREATED, message);

        if (callback) callback({ success: true, data: message });
      } catch (err: any) {
        console.error("Error in message.create:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // -------------------------------------------------------------------------
    // 5. disconnect
    // -------------------------------------------------------------------------
    socket.on("disconnect", async () => {
      const sess = this.socketSessions.get(socket.id);
      this.socketSessions.delete(socket.id);

      if (sess && sess.projectId && sess.userId) {
        try {
          const offlinePresence = await PresenceService.markOffline(sess.projectId, sess.userId);
          if (offlinePresence) {
            const room = `project:${sess.projectId}`;
            this.io.to(room).emit(SOCKET_SERVER_EVENTS.PRESENCE_UPDATED, offlinePresence);
          }
        } catch (err) {
          console.error("Error handling socket disconnect:", err);
        }
      }
    });
  }
}

