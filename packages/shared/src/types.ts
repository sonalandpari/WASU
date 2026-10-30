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
  languageId?: string;
  isDirty?: boolean;
  changeCount?: number;
}

export interface BranchCreatedPayload {
  branchName: string;
  baseBranch?: string;
  headCommit?: string;
}

export interface BranchSwitchedPayload {
  previousBranch?: string;
  currentBranch: string;
}

export interface FilesStagedPayload {
  stagedPaths: string[];
  stageAction?: "stage" | "unstage";
}

export interface CommitCreatedPayload {
  commitHash: string;
  shortHash: string;
  message: string;
  authorName: string;
  changedPaths: string[];
  commitTimestamp: string;
}

export interface CommitLinkedPayload {
  repositoryKey: string;
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
  commitHashes: string[];
  remoteName?: string;
}

export interface PullRequestLinkedPayload {
  prNumber: number;
  prTitle: string;
  prUrl: string;
  sourceBranch: string;
  targetBranch: string;
  status: "OPEN" | "MERGED" | "CLOSED";
}

export interface ArchitectureUpdatedPayload {
  snapshotId: string;
  nodeCount: number;
  edgeCount: number;
  scannerVersion: string;
  summary?: string;
}

export interface ArchitectureNodeModifiedPayload {
  nodeId: string;
  nodePath: string;
  changeType: "added" | "modified" | "deleted";
  previousEdges?: string[];
  currentEdges?: string[];
}

export interface EventPayloadMap {
  MEMBER_JOINED: MemberJoinedPayload;
  MEMBER_LEFT: MemberLeftPayload;
  MEMBER_ACTIVE_FILE_CHANGED: MemberActiveFileChangedPayload;
  MEMBER_PRESENCE_UPDATED: MemberPresenceUpdatedPayload;
  FILE_SAVED: FileSavedPayload;
  BRANCH_CREATED: BranchCreatedPayload;
  BRANCH_SWITCHED: BranchSwitchedPayload;
  FILES_STAGED: FilesStagedPayload;
  COMMIT_CREATED: CommitCreatedPayload;
  COMMIT_LINKED: CommitLinkedPayload;
  CHANGES_PUSHED: ChangesPushedPayload;
  PULL_REQUEST_LINKED: PullRequestLinkedPayload;
  ARCHITECTURE_UPDATED: ArchitectureUpdatedPayload;
  ARCHITECTURE_NODE_MODIFIED: ArchitectureNodeModifiedPayload;
}

export interface TimelineEvent<T = Record<string, unknown>> {
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

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: ArchitectureNodeKind;
  path?: string;
  modifiedAt?: string;
  isModified?: boolean;
  moduleName?: string;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  kind: "imports";
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  generatedAt: string;
  scannerVersion: string;
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

