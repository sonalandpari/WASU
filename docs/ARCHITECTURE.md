# ContextFlow - System Architecture
Version: 1.0

## 1. Architecture overview

ContextFlow consists of:
1. VS Code Extension Host
2. React Webview
3. Node.js Backend
4. Shared TypeScript Contracts

The extension observes workspace and Git events. The backend stores project data and distributes realtime events. The Webview displays the activity feed, graph, and reports.

## 2. Technology stack

- Extension: TypeScript, VS Code Extension API
- Frontend: React, TypeScript, Vite, CSS or Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Realtime: Socket.IO
- Database: SQLite, Prisma
- Git: VS Code Git API, Git CLI fallback
- Architecture: TypeScript Compiler API
- Graph UI: React Flow
- Export: SVG, browser-based image rendering, PDF generation/print workflow
- Optional AI: Gemma through Ollama or a configured provider

## 3. Repository structure

```text
contextflow/
├── apps/
│   ├── extension/
│   │   └── src/
│   │       ├── commands/
│   │       ├── presence/
│   │       ├── workspace/
│   │       ├── git/
│   │       ├── navigation/
│   │       └── webview/
│   ├── webview/
│   │   └── src/
│   │       ├── components/
│   │       ├── activity/
│   │       ├── presence/
│   │       ├── diff/
│   │       ├── discussion/
│   │       ├── architecture/
│   │       └── reports/
│   └── backend/
│       └── src/
│           ├── routes/
│           ├── services/
│           ├── events/
│           ├── realtime/
│           ├── db/
│           └── server.ts
├── packages/
│   └── shared/
│       └── src/
│           ├── types.ts
│           ├── schemas.ts
│           └── events.ts
├── docs/
└── README.md
```

## 4. Data flows

### Activity

VS Code Event → Extension Event Collector → Shared Event Schema → Backend REST API → Database → Socket.IO Broadcast → Other Connected Extensions → React Webview Feed

### Presence

Active Editor Change → Extension Presence Manager → Socket.IO Presence Update → Project Room → Other Members' Webviews and Decorations

### Architecture

Workspace File Change → Debounced Scanner → AST Parsing → Dependency Resolver → Architecture Graph JSON → Backend Persistence → Realtime Graph Update → React Flow

### Deep-linking

Activity Card → Diff Viewer → Changed File and Line → VS Code Editor Navigation → Code Lens / Discussion Action → Original Discussion

### Export

Graph + Activity + Project Metadata → Executive or Technical View → Export Renderer → SVG / JPG / PDF

## 5. Shared data contracts

All team members must use shared types.

### Project event

```ts
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

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  actorId: string | null;
  actorName: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
}
```

### Presence

```ts
export interface MemberPresence {
  userId: string;
  projectId: string;
  userName: string;
  activeFilePath: string | null;
  lastActiveAt: string;
  connectionStatus: "ONLINE" | "OFFLINE";
}
```

### Commit

```ts
export interface CommitPayload {
  repositoryKey: string;
  commitHash: string;
  shortHash: string;
  message: string;
  authorName?: string;
  commitTimestamp?: string;
  linkedAt: string;
  changedPaths: string[];
}
```

### Discussion link

```ts
export interface DiscussionLink {
  id: string;
  projectId: string;
  messageId: string;
  repositoryKey: string;
  filePath: string;
  startLine?: number;
  endLine?: number;
  commitHash?: string;
  createdAt: string;
}
```

### Architecture graph

```ts
export interface ArchitectureGraph {
  nodes: Array<{
    id: string;
    label: string;
    kind: "file" | "module" | "package";
    path?: string;
    modifiedAt?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    kind: "imports";
  }>;
  generatedAt: string;
  scannerVersion: string;
}
```

## 6. Timestamp rules

Keep separate:
- `commitTimestamp`: timestamp from Git.
- `linkedAt`: time ContextFlow registers a commit.
- `occurredAt`: time the backend creates a timeline event.
- `lastActiveAt`: most recent presence update.

Timeline events are sorted by `occurredAt`. Git timestamps must not be overwritten by backend timestamps.

## 7. API endpoints

Projects:
- POST /projects
- GET /projects/:projectId
- POST /projects/:projectId/join

Activity:
- GET /projects/:projectId/events
- POST /projects/:projectId/events

Presence:
- GET /projects/:projectId/presence
- POST /projects/:projectId/presence

Discussions:
- GET /projects/:projectId/messages
- POST /projects/:projectId/messages
- POST /projects/:projectId/discussion-links
- GET /discussion-links/:id

Commits:
- POST /projects/:projectId/commits
- GET /projects/:projectId/commits/:commitHash

Architecture:
- POST /projects/:projectId/architecture
- GET /projects/:projectId/architecture/latest

Reports:
- GET /projects/:projectId/reports/data

Exports should primarily be rendered by the client from report data.

## 8. Socket.IO events

Client → Server:
- project.join
- presence.update
- activity.create

Server → Client:
- project.joined
- member.presence.updated
- activity.created
- message.created
- architecture.updated

Use project-scoped rooms. Persist important activity before broadcasting. On reconnect, fetch missed events from the backend.

## 9. Engineering rules

- Never trust client timestamps for authoritative event ordering.
- Backend generates `occurredAt`.
- Deduplicate events using stable identifiers.
- Validate project membership before broadcasting.
- Do not send complete source files for presence updates.
- Use relative workspace paths.
- Exclude secrets and generated files from scanning.
- Do not execute repository code.
- Do not modify Git history.
- Do not invent graph dependencies.
- Keep AI optional and separate from deterministic processing.
