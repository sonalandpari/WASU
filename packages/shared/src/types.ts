export type ProjectEventType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_ACTIVE_FILE_CHANGED"
  | "MEMBER_PRESENCE_UPDATED"
  | "FILE_SAVED"
  | "BRANCH_CREATED"
  | "BRANCH_SWITCHED"
  | "FILES_STAGED"
  | "COMMIT_CREATED"
  | "CHANGES_PUSHED"
  | "ARCHITECTURE_UPDATED";

export interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  online: boolean;
  activeFile?: string;
  lastActive: string;
  cursorLine?: number;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  description: string;
  metadata?: {
    file?: string;
    branch?: string;
    stagedFiles?: string[];
    commitHash?: string;
    commitMessage?: string;
    diffSummary?: {
      added: number;
      deleted: number;
    };
    line?: number;
    discussionId?: string;
    nodeCount?: number;
    edgeCount?: number;
    count?: number; // for grouped file saves
  };
}

export interface DiffLine {
  type: "added" | "deleted" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface FileDiff {
  oldPath: string;
  newPath: string;
  lines: DiffLine[];
  stats: {
    added: number;
    deleted: number;
  };
}

export interface DiscussionComment {
  id: string;
  discussionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  projectId: string;
  title: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt: string;
  status: "open" | "resolved";
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  commitHash?: string;
  codeSnippet?: string;
  comments: DiscussionComment[];
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  path: string;
  module: string;
  type: "component" | "service" | "util" | "hook" | "type" | "store" | "controller" | "route" | "config";
  imports: string[];
  exports: string[];
  modified?: boolean;
  dependentCount?: number;
  lineCount?: number;
}

export interface ArchitectureGraph {
  nodes: {
    id: string;
    type?: string;
    data: ArchitectureNodeData;
    position: { x: number; y: number };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: Record<string, any>;
    label?: string;
  }[];
  summary: {
    totalFiles: number;
    totalModules: number;
    totalDependencies: number;
    lastUpdated: string;
  };
}

export interface ProjectReport {
  id: string;
  projectId: string;
  title: string;
  type: "technical" | "executive";
  generatedAt: string;
  author: string;
  summary: string;
  highlights: string[];
  metrics: {
    commits: number;
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    activeContributors: number;
  };
  changelog: {
    category: string;
    description: string;
  }[];
  architectureSummary?: {
    modules: string[];
    criticalDependencies: string[];
  };
}

// VS Code Extension <-> Webview Message Protocol
export type ExtensionToWebviewMessage =
  | { type: "INIT_STATE"; payload: WebviewInitialState }
  | { type: "EVENT_RECEIVED"; payload: ProjectEvent }
  | { type: "PRESENCE_UPDATED"; payload: UserPresence[] }
  | { type: "GRAPH_UPDATED"; payload: ArchitectureGraph }
  | { type: "DISCUSSIONS_UPDATED"; payload: Discussion[] }
  | { type: "CONNECTION_STATUS_CHANGED"; payload: { status: "connected" | "connecting" | "disconnected" | "reconnecting" } }
  | { type: "GIT_INFO_CHANGED"; payload: { branch: string; repositoryName: string } };

export type WebviewToExtensionMessage =
  | { type: "READY" }
  | { type: "OPEN_FILE"; payload: { path: string; line?: number } }
  | { type: "VIEW_DIFF"; payload: { commitHash?: string; file?: string } }
  | { type: "OPEN_DISCUSSION"; payload: { discussionId: string } }
  | { type: "CREATE_DISCUSSION"; payload: Partial<Discussion> }
  | { type: "REFRESH_GRAPH" }
  | { type: "REFRESH_ACTIVITY" }
  | { type: "EXPORT_REPORT"; payload: { format: "svg" | "jpg" | "pdf"; reportId: string } };

export interface WebviewInitialState {
  projectId: string;
  projectName: string;
  currentBranch: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  connectionStatus: "connected" | "connecting" | "disconnected" | "reconnecting";
  presence: UserPresence[];
  events: ProjectEvent[];
  discussions: Discussion[];
  graph: ArchitectureGraph | null;
}
