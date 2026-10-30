
# DevSync — Feature Specification

Status: Hackathon MVP baseline

Priority definitions:
P0 = demo-critical
P1 = important if time permits
P2 = stretch

## Feature Overview

| ID | Feature | Priority |
|---|---|---|
| F01 | Project chat | P0 |
| F02 | Member-joined timeline event | P0 |
| F03 | Unified chat/activity timeline | P0 |
| F04 | Commit event | P0 |
| F05 | Commit change navigation | P0 |
| F06 | Realtime updates | P0 |
| F07 | Architecture scanner and graph | P0 |
| F08 | Architecture map UI | P0 |
| F09 | Architecture export SVG | P0 |
| F10 | Pull-request link event | P1 |
| F11 | Gemma architecture explanation | P1 |
| F12 | PNG export | P2 |

## F01 — Project Chat

User story:

As a project teammate, I want to send and read messages in the shared project space so that discussion is available alongside project activity.

### Behavior

- Messages belong to a project.
- Each message includes author identity, content, and server-created timestamp.
- Messages appear in the timeline.
- New messages are broadcast to project members in realtime.
- Empty messages are rejected.
- MVP supports plain text only.

### Acceptance Criteria

- A valid message is persisted and appears in the sender's timeline.
- Other connected project members receive it without refreshing.
- Invalid or empty message content is rejected with a visible error.
- A backend restart does not erase persisted messages if SQLite persistence is configured.

## F02 — Member-Joined Event

User story:

As a teammate, I want to see when a member joins the project conversation so that I understand their participation point.

### Behavior

- Joining a project creates a MEMBER_JOINED event.
- Event includes member identity and server-generated event timestamp.
- Event is visually distinct from a chat message.
- MVP does not require hiding earlier messages or enforcing per-user history visibility.

### Acceptance Criteria

- A join creates one event for the join action.
- Event is stored and broadcast to project members.
- Timeline identifies the joining member and event time.
- Rejoining behavior is documented and does not silently create duplicate events from a reconnect unless the user explicitly joins again.

## F03 — Unified Timeline

User story:

As a developer, I want chat and project events in one chronological view so that I can understand the sequence of discussion and code activity.

### Behavior

- Timeline can contain chat messages and system events.
- System events use a distinct visual style and event type.
- Timeline sorts by occurredAt, the server event time.
- Git timestamps are displayed as metadata, not used as the sole timeline sort key.
- Pagination or a recent-event limit may be used if needed.

### Acceptance Criteria

- Chat and event records render in the same timeline.
- Each item clearly indicates whether it is a message or system event.
- Timeline order is stable for equal timestamps using a deterministic tie-breaker.
- Event cards do not imply that Git author time equals DevSync detection time.

## F04 — Commit Event

User story:

As a teammate, I want commits represented in the project timeline so that I can see code activity in the same context as discussion.

### Behavior

- Commit event references repository identity and full commit hash.
- It includes author/committer metadata where available, commit message, changed paths, and timestamps.
- The system records:
  - commitTimestamp: Git commit time.
  - linkedAt: when DevSync recorded or linked the commit.
  - occurredAt: server event timestamp used for timeline ordering.
- A commit may be manually linked for the hackathon if automatic detection is unreliable.

### Acceptance Criteria

- Commit hash and repository identity are persisted.
- Event card shows a short hash and commit message.
- Git timestamp and DevSync event time are distinguishable.
- Re-linking the same repository and commit hash does not create an accidental duplicate.

## F05 — Open Commit Changes

User story:

As a developer, I want to open the changes for a commit from its timeline event so that I can inspect the exact code update.

### Behavior

- Commit event provides View Changes.
- Extension asks VS Code Git integration to open a diff/commit view.
- If the preferred command/API is unavailable, show a fallback link or clear message.
- The action must not modify files or perform a merge.

### Acceptance Criteria

- Selecting the action opens the intended commit changes for a valid repository/commit.
- Invalid or unavailable commit information produces a clear error.
- The action is read-only.

## F06 — Realtime Updates

User story:

As a teammate, I want new chat and project events to arrive live so that the timeline reflects team activity without manual refresh.

### Behavior

- Socket.IO rooms are scoped to a project.
- Project members join the relevant room.
- Chat and event creation emits a corresponding update.
- Reconnect restores project subscription and fetches missed recent events.

### Acceptance Criteria

- Connected members receive new project messages/events.
- A disconnected client can reload recent persisted events after reconnect.
- Events from another project are not broadcast to the current project's room.

## F07 — Architecture Scanner and Graph

User story:

As a developer, I want DevSync to generate an architecture graph from repository structure and imports so that teammates can quickly understand how the project is organized.

### MVP Support

- JavaScript and TypeScript files.
- Common import/export syntax.
- Directory/file-based modules.
- Import edges extracted from source files.
- Basic package metadata where available.
- Scanner reports unsupported or skipped files instead of claiming complete coverage.

### Graph Model

Node:
- Module
- File
- Package
- Recognized project component

Edge:
- Import/dependency relationship

Node and edge IDs should be stable within a scan when possible.

### Acceptance Criteria

- Scan produces graph JSON.
- Nodes and edges correspond to extracted repository evidence.
- Unsupported files are skipped or marked, not guessed.
- Re-running scan on unchanged files produces equivalent graph content.

## F08 — Architecture Map UI

User story:

As a developer, I want to view the generated architecture graph inside DevSync so that I can explore the project structure.

### Behavior

- Architecture is a separate tab/view from chat.
- Graph nodes and edges are rendered using the selected graph library.
- Basic pan/zoom and node selection are supported if available.
- Selecting a node can display its name and source path.
- Empty and scan-error states are provided.

### Acceptance Criteria

- Valid graph JSON renders.
- Selecting a node shows identifying information.
- Empty graph does not crash the Webview.
- UI does not imply that graph edges are runtime calls unless that relationship is extracted.

## F09 — Architecture Export

User story:

As a teammate, I want to export the architecture map so that I can share it with someone outside the project discussion.

### MVP

- Export SVG.
- Include graph title/project label if available.
- Export represents the currently generated graph.

### Acceptance Criteria

- User can trigger export from Architecture view.
- Exported SVG opens in a standard browser/viewer.
- Export failure is reported without losing the current graph.
- PNG is not required for MVP.

## F10 — Pull-Request Link Event

Priority: P1

User story:

As a teammate, I want a PR link in the timeline so that I can navigate from project discussion to the review context.

### Behavior

- PR event stores URL, title, actor if known, and DevSync event time.
- Clicking the PR opens the supplied URL.
- MVP does not require PR API integration or review-status synchronization.

### Acceptance Criteria

- Valid URL is displayed as a PR event.
- Clicking opens the correct URL.
- Invalid URLs are rejected or shown as non-clickable text.

## F11 — Optional Gemma Explanation

Priority: P1

User story:

As a developer, I want an AI explanation of the architecture graph so that I can understand the generated structure faster.

### Behavior

- Input is the graph generated by the scanner.
- Provider adapter supports configured local Ollama or hosted provider.
- UI labels the explanation as AI-generated.
- AI does not add graph nodes/edges or assert unsupported facts.
- If provider is unavailable, user still sees the graph and a non-blocking explanation error.

### Acceptance Criteria

- Feature is disabled or unavailable without provider configuration.
- Secrets are not stored in the Webview or committed to source control.
- Request includes bounded graph context.
- Provider failure does not block chat, timeline, Git, or map rendering.

## F12 — PNG Export

Priority: P2

Stretch only.

Implement after SVG export is reliable.

If conversion adds dependency or integration risk, defer it.

## Shared Event Types

Recommended event types:

- MEMBER_JOINED
- COMMIT_LINKED
- PR_LINKED
- ARCHITECTURE_UPDATED

Chat messages are separate records but may be rendered in the same timeline.

## MVP Definition of Done

- P0 features are integrated.
- Main demo path works from extension startup through chat, join event, commit/diff, and architecture export.
- Error states are visible.
- No secrets are committed.
- README contains setup/run instructions and known limitations.
- AI and PNG export are clearly optional.
