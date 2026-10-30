import { z } from "zod";

// ---------------------------------------------------------------------------
// Project & Membership Schemas
// ---------------------------------------------------------------------------

export const MemberRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  repositoryKey: z.string().min(1, "Repository key is required").max(200),
  description: z.string().max(500).optional(),
});

export const JoinProjectSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().min(1, "Username is required").max(100),
  role: MemberRoleSchema.optional().default("MEMBER"),
});

// ---------------------------------------------------------------------------
// Presence Schemas
// ---------------------------------------------------------------------------

export const ConnectionStatusSchema = z.enum(["ONLINE", "OFFLINE"]);

export const UpdatePresenceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  userName: z.string().min(1, "Username is required"),
  activeFilePath: z.string().nullable().optional(),
  connectionStatus: ConnectionStatusSchema.optional().default("ONLINE"),
  lastActiveAt: z.string().datetime().optional(),
});

// ---------------------------------------------------------------------------
// Event Schemas & Payloads
// ---------------------------------------------------------------------------

export const ProjectEventTypeSchema = z.enum([
  "MEMBER_JOINED",
  "MEMBER_LEFT",
  "MEMBER_ACTIVE_FILE_CHANGED",
  "MEMBER_PRESENCE_UPDATED",
  "FILE_SAVED",
  "BRANCH_CREATED",
  "BRANCH_SWITCHED",
  "FILES_STAGED",
  "COMMIT_CREATED",
  "COMMIT_LINKED",
  "CHANGES_PUSHED",
  "PULL_REQUEST_LINKED",
  "ARCHITECTURE_UPDATED",
  "ARCHITECTURE_NODE_MODIFIED",
]);

export const MemberJoinedPayloadSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  role: MemberRoleSchema.optional(),
  joinedAt: z.string().optional(),
});

export const MemberLeftPayloadSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  reason: z.string().optional(),
  leftAt: z.string().optional(),
});

export const MemberActiveFileChangedPayloadSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  previousFilePath: z.string().nullable().optional(),
  activeFilePath: z.string().nullable(),
  languageId: z.string().optional(),
});

export const MemberPresenceUpdatedPayloadSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  activeFilePath: z.string().nullable(),
  connectionStatus: ConnectionStatusSchema,
  lastActiveAt: z.string(),
});

export const FileSavedPayloadSchema = z.object({
  filePath: z.string().min(1),
  languageId: z.string().optional(),
  isDirty: z.boolean().optional(),
  changeCount: z.number().int().optional(),
});

export const BranchCreatedPayloadSchema = z.object({
  branchName: z.string().min(1),
  baseBranch: z.string().optional(),
  headCommit: z.string().optional(),
});

export const BranchSwitchedPayloadSchema = z.object({
  previousBranch: z.string().optional(),
  currentBranch: z.string().min(1),
});

export const FilesStagedPayloadSchema = z.object({
  stagedPaths: z.array(z.string()),
  stageAction: z.enum(["stage", "unstage"]).optional(),
});

export const CommitCreatedPayloadSchema = z.object({
  commitHash: z.string().min(4, "Full or short commit hash required"),
  shortHash: z.string().min(4),
  message: z.string().min(1),
  authorName: z.string().min(1),
  changedPaths: z.array(z.string()).default([]),
  commitTimestamp: z.string(),
});

export const CommitLinkedPayloadSchema = z.object({
  repositoryKey: z.string().min(1),
  commitHash: z.string().min(4),
  shortHash: z.string().min(4),
  message: z.string().min(1),
  authorName: z.string().optional(),
  commitTimestamp: z.string().optional(),
  linkedAt: z.string(),
  changedPaths: z.array(z.string()).default([]),
});

export const ChangesPushedPayloadSchema = z.object({
  branchName: z.string().min(1),
  commitHashes: z.array(z.string()),
  remoteName: z.string().optional(),
});

export const PullRequestLinkedPayloadSchema = z.object({
  prNumber: z.number().int().positive(),
  prTitle: z.string().min(1),
  prUrl: z.string().url(),
  sourceBranch: z.string().min(1),
  targetBranch: z.string().min(1),
  status: z.enum(["OPEN", "MERGED", "CLOSED"]).default("OPEN"),
});

export const ArchitectureUpdatedPayloadSchema = z.object({
  snapshotId: z.string().min(1),
  nodeCount: z.number().int().nonnegative(),
  edgeCount: z.number().int().nonnegative(),
  scannerVersion: z.string().min(1),
  summary: z.string().optional(),
});

export const ArchitectureNodeModifiedPayloadSchema = z.object({
  nodeId: z.string().min(1),
  nodePath: z.string().min(1),
  changeType: z.enum(["added", "modified", "deleted"]),
  previousEdges: z.array(z.string()).optional(),
  currentEdges: z.array(z.string()).optional(),
});

export const CreateTimelineEventSchema = z.object({
  id: z.string().optional(),
  type: ProjectEventTypeSchema,
  actorId: z.string().nullable().optional(),
  actorName: z.string().nullable().optional(),
  occurredAt: z.string().datetime().optional(), // Backend will enforce authoritative time if not supplied or for deduplication
  payload: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// Discussion Schemas
// ---------------------------------------------------------------------------

export const CreateChatMessageSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  content: z.string().min(1, "Message content cannot be empty"),
  links: z
    .array(
      z.object({
        repositoryKey: z.string().min(1),
        filePath: z.string().min(1),
        startLine: z.number().int().positive().nullable().optional(),
        endLine: z.number().int().positive().nullable().optional(),
        commitHash: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export const CreateDiscussionLinkSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  repositoryKey: z.string().min(1, "Repository key is required"),
  filePath: z.string().min(1, "File path is required"),
  startLine: z.number().int().positive().nullable().optional(),
  endLine: z.number().int().positive().nullable().optional(),
  commitHash: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Commit Schemas
// ---------------------------------------------------------------------------

export const CreateCommitSchema = z.object({
  repositoryKey: z.string().min(1),
  commitHash: z.string().min(4, "Full commit hash required"),
  shortHash: z.string().min(4),
  message: z.string().min(1),
  authorName: z.string().optional(),
  commitTimestamp: z.string().optional(),
  linkedAt: z.string().optional(), // Server will generate if missing
  changedPaths: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Architecture Graph Schemas
// ---------------------------------------------------------------------------

export const ArchitectureNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["file", "module", "package"]),
  path: z.string().optional(),
  modifiedAt: z.string().optional(),
  isModified: z.boolean().optional(),
  moduleName: z.string().optional(),
});

export const ArchitectureEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  kind: z.literal("imports").default("imports"),
});

export const ArchitectureGraphSchema = z.object({
  nodes: z.array(ArchitectureNodeSchema),
  edges: z.array(ArchitectureEdgeSchema),
  generatedAt: z.string(),
  scannerVersion: z.string().default("1.0.0"),
});

export const SaveArchitectureSchema = z.object({
  graph: ArchitectureGraphSchema,
  scannerVersion: z.string().optional().default("1.0.0"),
  summary: z.string().optional(),
});

