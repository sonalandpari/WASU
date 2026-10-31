/**
 * ContextFlow Shared TypeScript Contracts
 * All team members (Extension, Webview, Scanner, Backend) must adhere to these contracts.
 */

// ---------------------------------------------------------------------------
// Project & Membership
// ---------------------------------------------------------------------------

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Project {
  id: string;
  name: string;
  repositoryKey: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  role: MemberRole;
  joinedAt: string;
  lastActiveAt: string;
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

export type ConnectionStatus = "ONLINE" | "OFFLINE";

export interface MemberPresence {
  userId: string;
  projectId: string;
  userName: string;
  activeFilePath: string | null;
  lastActiveAt: string;
  connectionStatus: ConnectionStatus;
}

// ---------------------------------------------------------------------------
// Project Event Types & Payloads
// ---------------------------------------------------------------------------

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
  | "COMMIT_LINKED"
  | "CHANGES_PUSHED"
  | "PULL_REQUEST_LINKED"
  | "ARCHITECTURE_UPDATED"
  | "ARCHITECTURE_NODE_MODIFIED";

export interface MemberJoinedPayload {
  userId: string;
  userName: string;
  role?: MemberRole;
  joinedAt?: string;
}

export interface MemberLeftPayload {
  userId: string;
  userName: string;
  reason?: string;
  leftAt?: string;
}

export interface MemberActiveFileChangedPayload {
  userId: string;
  userName: string;
  previousFilePath?: string | null;
  activeFilePath: string | null;
  languageId?: string;
}

export interface MemberPresenceUpdatedPayload {
  userId: string;
  userName: string;
  activeFilePath: string | null;
  connectionStatus: ConnectionStatus;
  lastActiveAt: string;
}

export interface FileSavedPayload {
  filePath: string;
  fileExtension?: string;
  byteSize?: number;
  linesCount?: number;
}

export interface BranchCreatedPayload {
  branchName: string;
  baseBranch?: string;
}

export interface BranchSwitchedPayload {
  previousBranch?: string;
  currentBranch: string;
}

export interface FilesStagedPayload {
  stagedPaths: string[];
  count: number;
}

export interface CommitCreatedPayload {
  commitHash: string;
  shortHash: string;
  message: string;
  authorName?: string;
  commitTimestamp?: string;
  changedPaths: string[];
}

export interface CommitLinkedPayload {
  commitHash: string;
  shortHash: string;
  message: string;
  authorName?: string;
  commitTimestamp?: string;
  linkedAt: string;
  changedPaths: string[];
}

export interface ChangesPushedPayload {
  branchName: string;
  commitHash?: string;
  commitsCount?: number;
  remote?: string;
}

export interface PullRequestLinkedPayload {
  prNumber: number;
  title: string;
  url?: string;
  sourceBranch?: string;
  targetBranch?: string;
}

export interface ArchitectureUpdatedPayload {
  snapshotId?: string;
  version?: number;
  nodeCount: number;
  edgeCount: number;
  generatedAt: string;
  scannerVersion: string;
}

export interface ArchitectureNodeModifiedPayload {
  nodeId: string;
  nodePath: string;
  modifiedAt: string;
  moduleName?: string;
}

export type TimelineEventPayload =
  | MemberJoinedPayload
  | MemberLeftPayload
  | MemberActiveFileChangedPayload
  | MemberPresenceUpdatedPayload
  | FileSavedPayload
  | BranchCreatedPayload
  | BranchSwitchedPayload
  | FilesStagedPayload
  | CommitCreatedPayload
  | CommitLinkedPayload
  | ChangesPushedPayload
  | PullRequestLinkedPayload
  | ArchitectureUpdatedPayload
  | ArchitectureNodeModifiedPayload
  | Record<string, unknown>;

export interface TimelineEvent<T = TimelineEventPayload> {
  id: string;
  projectId: string;
  type: ProjectEventType;
  actorId: string | null;
  actorName: string | null;
  occurredAt: string;
  payload: T;
}

// ---------------------------------------------------------------------------
// Discussions & Deep-Linking
// ---------------------------------------------------------------------------

export interface DiscussionLink {
  id: string;
  projectId: string;
  messageId: string;
  repositoryKey: string;
  filePath: string;
  startLine?: number | null;
  endLine?: number | null;
  commitHash?: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  links?: DiscussionLink[];
}

// ---------------------------------------------------------------------------
// Git Commit
// ---------------------------------------------------------------------------

export interface CommitPayload {
  id?: string;
  projectId?: string;
  repositoryKey: string;
  commitHash: string;
  shortHash: string;
  message: string;
  authorName?: string;
  commitTimestamp?: string;
  linkedAt: string;
  changedPaths: string[];
}

// ---------------------------------------------------------------------------
// Architecture Graph
// ---------------------------------------------------------------------------

export type ArchitectureNodeKind = "file" | "module" | "package";
export type NodeKind = ArchitectureNodeKind;

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: ArchitectureNodeKind;
  path?: string;
  moduleGroup?: string;
  moduleName?: string;
  modifiedAt?: string;
  isModified?: boolean;
  metrics?: {
    inDegree?: number;
    outDegree?: number;
    linesOfCode?: number;
  };
  data?: Record<string, unknown>;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  kind: "imports";
  specifiers?: string[];
  isDynamic?: boolean;
  isTypeOnly?: boolean;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  generatedAt: string;
  scannerVersion: string;
  unresolvedImports?: Array<{
    sourceFile: string;
    rawSpecifier: string;
  }>;
}

export interface IncrementalUpdateResult {
  graph: ArchitectureGraph;
  changedNodeIds: string[];
  removedNodeIds: string[];
  addedNodeIds: string[];
}

export interface ArchitectureSnapshotRecord {
  id: string;
  projectId: string;
  version: number;
  graph: ArchitectureGraph;
  generatedAt: string;
  scannerVersion: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Stakeholder Reports
// ---------------------------------------------------------------------------

export interface ReportModuleSummary {
  name: string;
  fileCount: number;
  recentChangesCount: number;
  files: string[];
}

export interface ReportDiscussionReference {
  message: ChatMessage;
  links: DiscussionLink[];
}

export interface ReportSummaryStats {
  totalMembers: number;
  activeMembersOnline: number;
  totalCommits: number;
  totalEvents: number;
  totalFiles: number;
  totalModules: number;
}

export interface ReportData {
  projectId: string;
  projectName: string;
  repositoryKey: string;
  generatedAt: string;
  summary: ReportSummaryStats;
  recentActivity: TimelineEvent[];
  commits: CommitPayload[];
  architecture: ArchitectureGraph | null;
  modifiedModules: ReportModuleSummary[];
  discussions: ReportDiscussionReference[];
}

// ---------------------------------------------------------------------------
// API Response Envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Webview UI & Presentation Contracts
// ---------------------------------------------------------------------------

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
    count?: number;
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
  | { type: "GRAPH_UPDATED"; payload: any }
  | { type: "DISCUSSIONS_UPDATED"; payload: Discussion[] }
  | { type: "CONNECTION_STATUS_CHANGED"; payload: { status: "connected" | "connecting" | "disconnected" | "reconnecting" } }
  | { type: "GIT_INFO_CHANGED"; payload: { branch: string; repositoryName: string } };

export type WebviewToExtensionMessage =
  | { type: "READY" }
  | { type: "OPEN_FILE"; payload: { path: string; line?: number } }
  | { type: "VIEW_DIFF"; payload: { commitHash?: string; file?: string } }
  | { type: "OPEN_COMMIT_DIFF"; payload: { commitHash?: string; changedPath?: string; file?: string } }
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
  graph: any | null;
}
