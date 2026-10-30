import {
  ArchitectureGraph,
  ChatMessage,
  ConnectionStatus,
  DiscussionLink,
  MemberPresence,
  MemberRole,
  ProjectEventType,
  TimelineEvent,
} from "./types";

// ---------------------------------------------------------------------------
// Socket Event Names Constants
// ---------------------------------------------------------------------------

export const SOCKET_CLIENT_EVENTS = {
  PROJECT_JOIN: "project.join",
  PRESENCE_UPDATE: "presence.update",
  ACTIVITY_CREATE: "activity.create",
  MESSAGE_CREATE: "message.create",
} as const;

export const SOCKET_SERVER_EVENTS = {
  PROJECT_JOINED: "project.joined",
  PRESENCE_UPDATED: "member.presence.updated",
  ACTIVITY_CREATED: "activity.created",
  MESSAGE_CREATED: "message.created",
  ARCHITECTURE_UPDATED: "architecture.updated",
  ERROR: "error",
} as const;

// ---------------------------------------------------------------------------
// Socket Event Payloads
// ---------------------------------------------------------------------------

export interface SocketProjectJoinPayload {
  projectId: string;
  userId: string;
  userName: string;
  role?: MemberRole;
  lastEventOccurredAt?: string; // For reconnection catch-up
}

export interface SocketPresenceUpdatePayload {
  projectId: string;
  userId: string;
  userName: string;
  activeFilePath: string | null;
  connectionStatus?: ConnectionStatus;
}

export interface SocketActivityCreatePayload {
  projectId: string;
  type: ProjectEventType;
  actorId?: string | null;
  actorName?: string | null;
  payload: Record<string, unknown>;
}

export interface SocketMessageCreatePayload {
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  links?: Array<{
    repositoryKey: string;
    filePath: string;
    startLine?: number | null;
    endLine?: number | null;
    commitHash?: string | null;
  }>;
}

export interface SocketProjectJoinedData {
  projectId: string;
  userId: string;
  onlineMembers: MemberPresence[];
  recentEvents: TimelineEvent[];
}

export interface SocketArchitectureUpdatedData {
  snapshotId: string;
  version: number;
  graph: ArchitectureGraph;
  summary?: string;
  generatedAt: string;
}

export interface SocketErrorData {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Socket.IO Strongly-Typed Signatures
// ---------------------------------------------------------------------------

export interface ClientToServerEvents {
  "project.join": (
    payload: SocketProjectJoinPayload,
    callback?: (response: { success: boolean; data?: SocketProjectJoinedData; error?: string }) => void
  ) => void;
  "presence.update": (
    payload: SocketPresenceUpdatePayload,
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;
  "activity.create": (
    payload: SocketActivityCreatePayload,
    callback?: (response: { success: boolean; data?: TimelineEvent; error?: string }) => void
  ) => void;
  "message.create": (
    payload: SocketMessageCreatePayload,
    callback?: (response: { success: boolean; data?: ChatMessage; error?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  "project.joined": (data: SocketProjectJoinedData) => void;
  "member.presence.updated": (data: MemberPresence) => void;
  "activity.created": (data: TimelineEvent) => void;
  "message.created": (data: ChatMessage) => void;
  "architecture.updated": (data: SocketArchitectureUpdatedData) => void;
  error: (data: SocketErrorData) => void;
}

