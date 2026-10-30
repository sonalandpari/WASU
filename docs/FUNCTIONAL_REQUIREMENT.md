
# DevSync — Functional Requirements

Status: Hackathon acceptance baseline

Requirement priorities:
P0 = must pass for MVP
P1 = important
P2 = stretch

## 1. Project and Member Context

### FR-01 — Open DevSync

Priority: P0

The extension shall provide a command or view that opens the DevSync Webview.

Acceptance:

- Command is registered and discoverable.
- Webview loads or displays a clear startup error.
- Extension does not crash if no workspace is open.

### FR-02 — Identify Project

Priority: P0

DevSync shall identify the current project using a stable repository/workspace key.

Acceptance:

- Project identity is shown in the UI.
- A missing Git repository produces a clear fallback or message.
- Project key is consistently used by API and realtime calls.

### FR-03 — Join Project

Priority: P0

A member shall be able to join a project.

Acceptance:

- Backend validates project and member fields.
- Membership is recorded.
- A MEMBER_JOINED event is created for a new join action.
- Reconnect does not create a false new join event.

## 2. Chat

### FR-04 — Send Message

Priority: P0

A member shall be able to submit a plain-text message.

Acceptance:

- Empty or whitespace-only messages are rejected.
- Valid messages are stored.
- Message includes author, project, content, and server timestamp.
- UI shows success or a clear failure.

### FR-05 — Load Recent Messages

Priority: P0

DevSync shall load recent project messages on open/reconnect.

Acceptance:

- Messages are scoped to the selected project.
- Results have deterministic ordering.
- Backend applies a reasonable limit.
- Empty history displays an empty state.

### FR-06 — Receive Messages in Realtime

Priority: P0

Connected members shall receive new messages without refreshing.

Acceptance:

- Socket event contains persisted message ID and project ID.
- Client appends or reconciles by ID.
- Duplicate delivery does not duplicate the visible message.

## 3. Timeline and Events

### FR-07 — Render Unified Timeline

Priority: P0

DevSync shall render chat messages and supported system events in one activity view.

Acceptance:

- Chat and system events are visually distinguishable.
- Timeline uses server occurredAt for event ordering.
- Ties are resolved deterministically.
- Unsupported event types do not crash the timeline.

### FR-08 — Create Member-Joined Event

Priority: P0

Backend shall create a MEMBER_JOINED event when a member joins.

Acceptance:

- Event includes project, member, and timestamp.
- Event persists and broadcasts.
- UI labels the event as a member join.
- Event is not generated solely because the socket reconnects.

### FR-09 — Create Supported Project Events

Priority: P0

Backend shall validate and persist supported project event types.

Acceptance:

- Allowed types are explicit.
- Payload validation is type-specific.
- Invalid type or payload is rejected.
- Event creation time is server-generated.

### FR-10 — Realtime Event Delivery

Priority: P0

Project events shall be broadcast only to the relevant project room.

Acceptance:

- Project ID is included.
- Unauthorized or invalid room joins are rejected.
- Client can reload recent events after reconnect.
- Duplicate event IDs are deduplicated by the UI.

## 4. Commit and Git Workflow

### FR-11 — Register Commit

Priority: P0

Extension shall submit a commit reference for the current repository/project.

Acceptance:

- Full commit hash and repository key are present.
- Commit message and changed paths are included when available.
- Git timestamp is separately represented.
- Backend creates a COMMIT_LINKED event.
- Duplicate commit registration is handled consistently.

### FR-12 — Display Commit Event

Priority: P0

Timeline shall display a commit card.

Acceptance:

- Card displays short hash and commit message.
- Card identifies the event as a commit.
- Timeline timestamp is labeled as DevSync event time.
- Git commit timestamp is separately labeled.
- Changed paths are shown when available.

### FR-13 — Open Commit Diff

Priority: P0

User shall be able to open a commit's changes from its event card.

Acceptance:

- Webview sends a typed action to extension host.
- Extension host validates repository and commit reference.
- VS Code opens the corresponding diff/commit view.
- Action is read-only.
- Failure is displayed without crashing the extension.

### FR-14 — Link Pull Request

Priority: P1

User shall be able to add a PR link to the project timeline.

Acceptance:

- URL is validated.
- PR event includes title/link and server event time.
- Click opens the supplied URL.
- MVP does not claim live PR status unless status integration exists.

## 5. Architecture Map

### FR-15 — Scan Supported Source Files

Priority: P0

DevSync shall scan supported JS/TS source files in the current repository.

Acceptance:

- Generated/vendor directories are excluded.
- Supported imports are extracted.
- Scanner reports skipped/unresolved files or imports.
- Scan is bounded and does not freeze the UI indefinitely.

### FR-16 — Generate Graph

Priority: P0

Scanner shall generate graph nodes and dependency edges.

Acceptance:

- Every edge is supported by extracted import evidence.
- Nodes have stable IDs within the scan.
- Graph contains generation metadata.
- Same repository state and scanner configuration produce equivalent graph output.

### FR-17 — Render Graph

Priority: P0

Architecture view shall render graph data.

Acceptance:

- Valid graph displays nodes and edges.
- Empty graph has a useful message.
- Selecting a node shows label and source path.
- Rendering errors are handled visibly.

### FR-18 — Export SVG

Priority: P0

User shall export the current architecture graph to SVG.

Acceptance:

- Export action is available after graph generation.
- File represents the displayed graph.
- Export opens in a standard SVG viewer.
- Failure is reported without losing graph state.

### FR-19 — Explain Graph with Gemma

Priority: P1

If a provider is configured, DevSync shall request an explanation of the generated graph.

Acceptance:

- Only graph-derived context is sent.
- Provider credentials remain outside Webview/source control.
- Explanation is labeled AI-generated.
- Provider errors are non-blocking.
- Feature is unavailable when not configured.

### FR-20 — Optional PNG Export

Priority: P2

If implemented, user can export graph to PNG.

Acceptance:

- SVG export remains available.
- PNG conversion failure does not block the MVP.

## 6. Reliability and Privacy

### FR-21 — Backend Unavailable

Priority: P0

Extension shall display connection state and handle backend failures.

Acceptance:

- User sees an actionable error.
- UI does not pretend a message/event was saved if backend failed.
- Retry/reconnect is possible.

### FR-22 — Validate Webview Messages

Priority: P0

Extension host shall validate messages received from Webview.

Acceptance:

- Message type is checked.
- Required fields are checked.
- Unknown commands are ignored/rejected.
- Arbitrary command execution is not permitted.

### FR-23 — Validate Backend Input

Priority: P0

Backend shall validate API request bodies and event payloads.

Acceptance:

- Invalid data returns a clear client error.
- Payload size is bounded.
- Event type and schema are checked.
- Project scoping is enforced.

### FR-24 — Protect Secrets

Priority: P0

DevSync shall not commit or expose credentials.

Acceptance:

- .env is ignored by Git.
- Example config uses placeholders only.
- AI key is read by backend/provider configuration.
- No secret is embedded in Webview bundle.

### FR-25 — Avoid Unrelated Telemetry

Priority: P0

DevSync shall only collect data required for collaboration features.

Acceptance:

- No keystroke capture.
- No broad editor activity logging.
- No external chat transcript ingestion in MVP.
- Repository scan excludes configured generated/vendor paths.

## 7. Integration and Demo

### FR-26 — End-to-End Demo

Priority: P0

The team shall demonstrate the primary workflow on a known repository.

Acceptance:

- Extension opens.
- Project join event appears.
- Chat message is sent and received.
- Commit event appears.
- View Changes opens the commit diff.
- Architecture graph generates.
- SVG export works.

### FR-27 — Setup Documentation

Priority: P0

Repository shall document prerequisites and run steps.

Acceptance:

- Node/npm version expectations are stated.
- Extension, Webview, and backend startup commands are documented.
- Environment variables are listed without secrets.
- Known limitations are included.
- Team can follow setup from a clean checkout.

## 8. Definition of Done

A feature is done when:

- Its acceptance criteria pass.
- Its error/empty state is handled.
- Shared types/API contracts are updated.
- It is integrated into the demo path.
- No secrets or unrelated telemetry are introduced.
- README or relevant docs reflect changed setup/behavior.

## 9. Known MVP Limitations

- VS Code only.
- Small-team hackathon demo.
- JS/TS architecture scan only.
- No production authentication/authorization system.
- No guarantee of full commit/PR automation.
- No AI dependency for core workflows.
- No complete runtime architecture graph.
- SVG export is the baseline; PNG is optional.
