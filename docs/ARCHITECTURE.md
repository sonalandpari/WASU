
# DevSync — Architecture

Status: Hackathon implementation baseline
Architecture style: VS Code extension + Webview frontend + Node backend
MVP target: Four teammates collaborating on one project

## 1. System Overview

DevSync is split into three runtime areas:

1. VS Code Extension Host
2. Webview UI
3. Backend

### VS Code Extension Host

Integrates with VS Code, identifies the workspace, handles extension commands, and invokes Git/VS Code actions.

### Webview UI

React interface for project chat, activity timeline, and architecture graph.

### Backend

Project/message/event persistence and realtime delivery.

The extension host and Webview communicate through VS Code's message bridge.

The Webview communicates with the backend over HTTP and Socket.IO.

Workspace scanning and VS Code commands should remain in the extension host or a trusted backend boundary.

The Webview should not directly access arbitrary local files.

## 2. Proposed Technology Stack

| Layer | Proposed Choice | Responsibility |
|---|---|---|
| Extension | TypeScript + VS Code Extension API | Activation, commands, workspace identity, Webview lifecycle |
| Webview | React + TypeScript + Vite | Chat, timeline, architecture view |
| Styling | CSS/Tailwind | Compact VS Code-compatible UI |
| Backend | Node.js + TypeScript + Express | API, validation, services |
| Realtime | Socket.IO | Project-scoped live updates |
| Database | SQLite | Hackathon persistence |
| ORM | Prisma | Database access and migrations |
| Git | VS Code Git API; Git CLI fallback | Commit metadata and diff navigation |
| Graph | React Flow | Architecture graph visualization |
| Scanner | TypeScript compiler API/source parsing | JS/TS import extraction |
| Optional AI | Gemma through provider adapter | Explain generated graph |

Package versions and exact APIs must be verified during implementation.

## 3. Component Responsibilities

### 3.1 VS Code Extension Host

Responsibilities:

- Activate DevSync and register commands/views.
- Identify the opened workspace/repository.
- Create and manage the Webview.
- Pass safe project context to the Webview.
- Access Git metadata through VS Code Git integration or a carefully scoped CLI fallback.
- Execute the VS Code action to open a commit diff.
- Send workspace scan requests or scan results through a defined message contract.
- Handle Webview messages and validate message types.

Must not:

- Expose secrets to Webview.
- Collect unrelated editor activity.
- Modify or merge code as part of the MVP.
- Trust arbitrary Webview messages without validation.

### 3.2 React Webview

Responsibilities:

- Render project selector/identity.
- Render chat and unified timeline.
- Render member join, commit, PR, and architecture events.
- Provide composer and event actions.
- Render architecture graph.
- Trigger export and optional AI explanation.
- Show loading, empty, disconnected, and error states.

The Webview is a UI surface.

It should not read the user's workspace directly or assume Node APIs are available.

### 3.3 Backend API

Responsibilities:

- Validate project, message, event, commit, and architecture requests.
- Persist chat messages and project events.
- Assign server-side event timestamps.
- Serve recent project timeline history.
- Broadcast project-scoped updates.
- Provide architecture graph storage or retrieval if graph persistence is used.
- Invoke optional AI provider through a backend adapter.

### 3.4 SQLite Persistence

Proposed minimal entities:

#### Project

- id
- name
- repositoryKey
- createdAt

#### Member

- id
- displayName
- createdAt

For the hackathon, member identity may be a simple locally configured identity.

Do not imply production authentication.

#### ProjectMember

- projectId
- memberId
- joinedAt
- optional lastSeenAt

#### Message

- id
- projectId
- memberId
- content
- createdAt

#### ProjectEvent

- id
- projectId
- type
- actorId
- payload
- occurredAt
- createdAt

#### CommitReference

- id
- projectId
- repositoryKey
- commitHash
- commitMessage
- authorName
- commitTimestamp
- linkedAt
- changedPaths

#### ArchitectureSnapshot

Optional:

- id
- projectId
- generatedAt
- repositoryRevision
- graphJson

This is a proposed logical schema.

The team may adapt it to Prisma/SQLite constraints while preserving event semantics.

## 4. Shared Contracts

Define shared types in a package or file imported by backend, extension, and Webview.

Do this before parallel implementation.

```typescript
export type ProjectEventType =
  | "MEMBER_JOINED"
  | "COMMIT_LINKED"
  | "PR_LINKED"
  | "ARCHITECTURE_UPDATED";

export interface ChatMessage {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  type: ProjectEventType;
  actorId: string | null;
  actorName: string | null;
  occurredAt: string;
  payload: Record<string, unknown>;
}

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

export interface ArchitectureGraph {
  nodes: Array<{
    id: string;
    label: string;
    kind: "file" | "module" | "package";
    path?: string;
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

### Contract Notes

- All timestamps are ISO 8601 strings with timezone information.
- occurredAt is assigned by the backend when the event is created.
- commitTimestamp is sourced from Git and is separate.
- linkedAt records when DevSync registered the link.
- payload must be validated by event type.
- Keep types shared; avoid copying slightly different interfaces into each app.

## 5. Data Flow

### 5.1 Chat Message

1. Webview sends POST /projects/:projectId/messages.
2. Backend validates project, author, and non-empty content.
3. Backend creates message with server timestamp.
4. Backend persists message.
5. Backend emits message.created to the project Socket.IO room.
6. Webview appends the message or reconciles it by ID.

### 5.2 Member Joins

1. Extension or UI requests project join.
2. Backend registers project membership.
3. Backend creates MEMBER_JOINED event.
4. Backend assigns occurredAt.
5. Backend persists event and emits event.created.
6. Timeline renders the event as a system card.

### 5.3 Commit Link and Diff

1. Extension reads commit metadata from VS Code Git integration or Git CLI.
2. Extension sends a commit reference to backend.
3. Backend validates repository/project association and event payload.
4. Backend persists commit reference and COMMIT_LINKED event.
5. Timeline displays commit card with clearly labeled timestamps.
6. User clicks View Changes.
7. Webview sends a typed message to extension host.
8. Extension host invokes the supported VS Code Git diff action.
9. If unavailable, extension shows a fallback error or repository/commit URL when one exists.

Important:

A commit's Git timestamp may be earlier or later than when DevSync detects or links it.

The timeline should use server occurredAt.

The card separately labels Git commit time and DevSync link time.

Never silently collapse these into one timestamp.

### 5.4 Architecture Scan

1. User requests Generate Map.
2. Extension host identifies workspace and starts a bounded scan.
3. Scanner reads supported source files and extracts imports.
4. Scanner produces ArchitectureGraph.
5. Graph is sent to Webview.
6. UI renders nodes and edges.
7. User exports graph to SVG.
8. Optional backend AI request receives graph JSON and returns explanation text.

The graph is deterministic evidence from the repository.

AI is not part of graph extraction.

## 6. API Sketch

These routes are a proposed MVP contract.

### Projects

- POST /projects
- GET /projects/:projectId
- POST /projects/:projectId/join

### Messages

- GET /projects/:projectId/messages
- POST /projects/:projectId/messages

Example request:

```json
{
  "authorId": "member-id",
  "content": "I updated the event service."
}
```

### Events

- GET /projects/:projectId/events
- POST /projects/:projectId/events

Only explicitly supported event types should be accepted.

### Commits

- POST /projects/:projectId/commits
- GET /projects/:projectId/commits/:commitHash

### Architecture

- POST /projects/:projectId/architecture
- GET /projects/:projectId/architecture/latest
- POST /projects/:projectId/architecture/explain

For the hackathon, architecture scanning may remain in the extension.

The graph only needs backend storage if shared persistence or AI explanation requires it.

## 7. Realtime Events

Socket.IO rooms should be project-scoped.

Proposed event names:

- project.joined
- message.created
- event.created
- architecture.updated

Rules:

- Validate project membership before joining a room.
- Broadcast only to the corresponding project room.
- Include persisted record IDs so clients can deduplicate.
- On reconnect, fetch recent persisted data.
- Avoid emitting duplicate join events for transport reconnects.

## 8. Architecture Scanner

MVP scanner is limited to JavaScript/TypeScript repositories.

Suggested extraction:

- Discover files under selected workspace.
- Exclude generated/vendor folders such as node_modules, .git, dist, and build output.
- Read JS/TS import/export declarations.
- Resolve relative imports when possible.
- Represent unresolved imports as skipped or external metadata.
- Create nodes from supported source files or module groups.
- Create imports edges from source evidence.
- Store source paths for node selection.
- Keep scanning bounded by file count/time and report exclusions.

Do not claim runtime call graphs, complete dependency graphs, or support for all languages.

## 9. Git Integration

Preferred:

Use the VS Code Git extension API if available and stable for the selected environment.

Fallback:

Invoke Git CLI using the workspace repository path and known commands.

Minimum metadata:

- repository identity/path key
- full commit hash
- short hash
- commit message
- author name
- Git timestamp
- changed file paths
- DevSync link timestamp

### Diff Navigation

- Use a supported VS Code Git command/API.
- Verify command identifiers against the installed Git extension.
- Keep action read-only.
- Test with a real commit in the team's demo repository.

## 10. Optional Gemma Provider

### Provider Contract

```typescript
export interface ArchitectureExplainer {
  explain(graph: ArchitectureGraph): Promise<string>;
}
```

### Local Option

- Ollama running locally with a Gemma model.
- Backend calls the local Ollama API.
- Local model availability and machine performance are not guaranteed.

### Hosted Option

- Configured hosted provider exposing Gemma.
- API key stored in backend environment/config.
- Never place key in Webview or source control.
- Verify provider model name, endpoint, and access before demo.

### Fallback

- If no provider is configured, hide or disable Explain.
- If provider fails, display a non-blocking error.
- Chat, events, Git links, graph generation, and SVG export remain available.

## 11. Proposed Repository Layout

```text
devsync/
├── apps/
│   ├── extension/
│   │   └── src/
│   │       ├── extension.ts
│   │       ├── commands/
│   │       ├── git/
│   │       ├── workspace/
│   │       └── webview/
│   ├── webview/
│   │   └── src/
│   │       ├── components/
│   │       ├── chat/
│   │       ├── timeline/
│   │       ├── architecture/
│   │       └── api/
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
│           └── schemas.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── FEATURES.md
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   └── PRD.md
├── README.md
└── LICENSE
```

This is a suggested structure.

A single-package repository is also acceptable if shared contracts remain clear.

## 12. Four-Person Ownership Proposal

### Contributor 1 — Backend and Execution Lead

Main ownership:

- Shared contracts
- Backend
- Data model
- Chat and events
- Realtime
- Integration decisions

Deliverable:

Working API, persistence, and timeline events.

### Contributor 2 — Webview and Presentation

Main ownership:

- React UI
- Chat/timeline components
- Composer
- Visual states
- PPT
- Demo video
- Submission materials

Deliverable:

Usable VS Code Webview and presentation.

### Contributor 3 — Architecture Map

Main ownership:

- Scanner
- Graph generation
- Graph view
- SVG export

Deliverable:

Working architecture map.

### Contributor 4 — Git, Integration, and Testing

Main ownership:

- Commit metadata
- Diff navigation
- Integration tests
- Smoke tests
- Cross-feature integration

Deliverable:

Commit-to-diff path and tested end-to-end demo.

Ownership is not rigid.

Pair where interfaces meet, but keep one clear owner per deliverable.

## 13. Integration Sequence

1. Agree on shared event/message/graph types and API paths.
2. Scaffold extension, Webview, and backend.
3. Deliver vertical slice: project join → join event → chat → timeline.
4. Integrate commit linking and diff action.
5. Integrate architecture graph and SVG export.
6. Integrate realtime and reconnect behavior.
7. Add optional Gemma only after core path works.
8. Run exact demo flow and freeze scope.

## 14. Security and Privacy Baseline

- Do not commit .env, API keys, tokens, or private credentials.
- Do not put AI credentials in extension frontend code.
- Validate all backend input and Webview messages.
- Do not collect unrelated editor activity or keystrokes.
- Do not ingest external chat transcripts for MVP.
- Treat repository paths and source text as potentially sensitive.
- Send only bounded graph context required for AI explanation.
- Use a public or synthetic demo repository if the team cannot safely share the real repository.
