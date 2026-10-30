import http from "http";
import { AddressInfo } from "net";
import { io as ClientSocket, Socket as ClientSocketType } from "socket.io-client";
import { createApp } from "../src/app";
import { SocketServer } from "../src/realtime/socketServer";
import { prisma } from "../src/db/prisma";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@contextflow/shared";

describe("Socket.IO Realtime & Room Isolation", () => {
  let server: http.Server;
  let serverUrl: string;
  let projectAId: string;
  let projectBId: string;

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    SocketServer.init(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as AddressInfo;
        serverUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await SocketServer.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(async () => {
    const pA = await prisma.project.create({
      data: { name: "Project Alpha", repositoryKey: "repo/alpha" },
    });
    projectAId = pA.id;

    const pB = await prisma.project.create({
      data: { name: "Project Beta", repositoryKey: "repo/beta" },
    });
    projectBId = pB.id;
  });

  it("handles project.join and emits project.joined with initial data", (done) => {
    const client = ClientSocket(serverUrl, { transports: ["websocket"] });

    client.on("connect", () => {
      client.emit(
        SOCKET_CLIENT_EVENTS.PROJECT_JOIN,
        {
          projectId: projectAId,
          userId: "user-socket-1",
          userName: "Socket Sam",
        },
        (res: any) => {
          expect(res.success).toBe(true);
          expect(res.data.projectId).toBe(projectAId);
          expect(res.data.onlineMembers.length).toBeGreaterThan(0);
          client.disconnect();
          done();
        }
      );
    });
  });

  it("enforces project room isolation and broadcasts activity only to members of that project", (done) => {
    const clientA = ClientSocket(serverUrl, { transports: ["websocket"] });
    const clientB = ClientSocket(serverUrl, { transports: ["websocket"] });

    let clientBReceivedEvent = false;

    // Client B joins Project Beta
    clientB.on("connect", () => {
      clientB.emit(SOCKET_CLIENT_EVENTS.PROJECT_JOIN, {
        projectId: projectBId,
        userId: "user-b",
        userName: "Beta Member",
      });
    });

    // Client B should NEVER receive activity from Project Alpha
    clientB.on(SOCKET_SERVER_EVENTS.ACTIVITY_CREATED as any, (event: any) => {
      if (event.projectId === projectAId) {
        clientBReceivedEvent = true;
      }
    });

    // Client A joins Project Alpha
    clientA.on("connect", () => {
      clientA.emit(SOCKET_CLIENT_EVENTS.PROJECT_JOIN, {
        projectId: projectAId,
        userId: "user-a",
        userName: "Alpha Member",
      });

      // After joining, Client A emits an activity event
      clientA.emit(SOCKET_CLIENT_EVENTS.ACTIVITY_CREATE, {
        projectId: projectAId,
        type: "FILE_SAVED",
        actorId: "user-a",
        actorName: "Alpha Member",
        payload: { filePath: "src/alpha.ts" },
      });
    });

    // Client A listens for the broadcast
    clientA.on(SOCKET_SERVER_EVENTS.ACTIVITY_CREATED as any, (event: any) => {
      expect(event.projectId).toBe(projectAId);
      expect(event.type).toBe("FILE_SAVED");
      expect(event.payload.filePath).toBe("src/alpha.ts");

      // Verify Client B never got it
      setTimeout(() => {
        expect(clientBReceivedEvent).toBe(false);
        clientA.disconnect();
        clientB.disconnect();
        done();
      }, 100);
    });
  });

  it("broadcasts presence updates to the project room", (done) => {
    const client1 = ClientSocket(serverUrl, { transports: ["websocket"] });
    const client2 = ClientSocket(serverUrl, { transports: ["websocket"] });

    client1.on("connect", () => {
      client1.emit(SOCKET_CLIENT_EVENTS.PROJECT_JOIN, {
        projectId: projectAId,
        userId: "user-1",
        userName: "User One",
      });
    });

    client2.on("connect", () => {
      client2.emit(SOCKET_CLIENT_EVENTS.PROJECT_JOIN, {
        projectId: projectAId,
        userId: "user-2",
        userName: "User Two",
      });

      // Client 2 updates presence
      client2.emit(SOCKET_CLIENT_EVENTS.PRESENCE_UPDATE, {
        projectId: projectAId,
        userId: "user-2",
        userName: "User Two",
        activeFilePath: "src/active.ts",
      });
    });

    // Client 1 should receive presence update for Client 2
    client1.on(SOCKET_SERVER_EVENTS.PRESENCE_UPDATED as any, (data: any) => {
      if (data.userId === "user-2" && data.activeFilePath === "src/active.ts") {
        expect(data.connectionStatus).toBe("ONLINE");
        client1.disconnect();
        client2.disconnect();
        done();
      }
    });
  });

  it("retrieves missed events when reconnecting with lastEventOccurredAt", async () => {
    // Insert 2 events in the past
    const pastTime = new Date(Date.now() - 60000).toISOString();

    await prisma.timelineEvent.create({
      data: {
        projectId: projectAId,
        type: "FILE_SAVED",
        occurredAt: new Date(Date.now() - 30000),
        payloadJson: JSON.stringify({ filePath: "src/missed.ts" }),
      },
    });

    const client = ClientSocket(serverUrl, { transports: ["websocket"] });

    await new Promise<void>((resolve) => {
      client.on("connect", () => {
        client.emit(
          SOCKET_CLIENT_EVENTS.PROJECT_JOIN,
          {
            projectId: projectAId,
            userId: "reconnecting-user",
            userName: "Reconnected User",
            lastEventOccurredAt: pastTime,
          },
          (res: any) => {
            expect(res.success).toBe(true);
            expect(res.data.recentEvents.length).toBeGreaterThanOrEqual(1);
            expect(res.data.recentEvents[0].payload.filePath).toBe("src/missed.ts");
            client.disconnect();
            resolve();
          }
        );
      });
    });
  });
});

