import { io, Socket } from 'socket.io-client';
import { ProjectEvent, UserPresence, ArchitectureGraph, Discussion } from '@contextflow/shared';
import { useAppStore } from '../store/useAppStore';

class SocketService {
  private socket: Socket | null = null;
  private currentUrl: string = '';
  private currentProjectId: string = '';

  public connect(url: string = 'http://localhost:4000', projectId: string = 'contextflow-demo') {
    if (this.socket && this.currentUrl === url && this.currentProjectId === projectId) {
      return;
    }

    this.disconnect();
    this.currentUrl = url;
    this.currentProjectId = projectId;

    const store = useAppStore.getState();
    store.setConnectionStatus('connecting');

    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        useAppStore.getState().setConnectionStatus('connected');
        this.socket?.emit('join_project', {
          projectId,
          user: store.currentUser,
        });
      });

      this.socket.on('connect_error', () => {
        useAppStore.getState().setConnectionStatus('disconnected');
      });

      this.socket.on('reconnect_attempt', () => {
        useAppStore.getState().setConnectionStatus('reconnecting');
      });

      this.socket.on('reconnect_failed', () => {
        useAppStore.getState().setConnectionStatus('disconnected');
      });

      this.socket.on('disconnect', (reason) => {
        if (reason === 'io client disconnect') {
          useAppStore.getState().setConnectionStatus('disconnected');
        } else {
          useAppStore.getState().setConnectionStatus('reconnecting');
        }
      });

      // Synchronized Project Events
      this.socket.on('project_event', (event: ProjectEvent) => {
        useAppStore.getState().addEvent(event);
      });

      // Synchronized Team Presence
      this.socket.on('presence_update', (presences: UserPresence[]) => {
        useAppStore.getState().setPresence(presences);
      });

      // Synchronized Architecture Updates
      this.socket.on('architecture_update', (graph: ArchitectureGraph) => {
        useAppStore.getState().setGraph(graph);
      });

      // Synchronized Discussion Updates
      this.socket.on('discussion_created', (discussion: Discussion) => {
        useAppStore.getState().addDiscussion(discussion);
      });

      this.socket.on('comment_added', ({ discussionId, comment }: { discussionId: string; comment: any }) => {
        useAppStore.getState().addComment(discussionId, comment);
      });
    } catch (err) {
      console.warn('Failed to initialize Socket.IO client:', err);
      useAppStore.getState().setConnectionStatus('disconnected');
    }
  }

  public emitPresence(activeFile?: string, cursorLine?: number) {
    if (!this.socket?.connected) return;
    const store = useAppStore.getState();
    this.socket.emit('update_presence', {
      projectId: this.currentProjectId,
      userId: store.currentUser.id,
      activeFile,
      cursorLine,
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
