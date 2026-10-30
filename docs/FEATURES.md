# ContextFlow - Feature Specification
Version: 1.0

## FEATURE 01: Live Activity Feed

Purpose: provide a real-time view of important project and team activity.

### Event types

Presence:
- MEMBER_JOINED
- MEMBER_LEFT
- MEMBER_ACTIVE_FILE_CHANGED
- MEMBER_PRESENCE_UPDATED

Workspace:
- FILE_SAVED
- BRANCH_CREATED
- BRANCH_SWITCHED
- FILES_STAGED

Git:
- COMMIT_CREATED
- COMMIT_LINKED
- CHANGES_PUSHED
- PULL_REQUEST_LINKED

Architecture:
- ARCHITECTURE_UPDATED
- ARCHITECTURE_NODE_MODIFIED

### Event card information

Each activity card can display:
- Member avatar or initials
- Member name
- Event description
- File or branch information
- Event timestamp
- Related commit or discussion
- Navigation action

### Presence system

Each connected member reports:
- User ID
- Project ID
- Active file path
- Last active timestamp
- Connection status

Presence updates should be throttled and expire after a configurable timeout.

Do not transmit keystrokes or source-code contents for presence tracking.

### File gutter presence

Use VS Code decorations to indicate teammates associated with the currently active file. The initial implementation can show file-level presence. Exact remote cursor and selection synchronization is optional.

## FEATURE 02: 3-Tier Deep-Linking

Purpose: connect activity, diffs, source code, and discussions.

### Tier 1: Activity → Diff

Input:
- Activity ID
- Commit hash
- Repository identity

Action: open the corresponding diff.

Expected result: the user sees changed files and relevant commit information.

### Tier 2: Diff → Source

Input:
- File path
- Changed line or range
- Commit reference

Action: open the actual workspace file at the relevant location.

Expected result: reveal and highlight the corresponding line or range.

### Tier 3: Source → Discussion

Input:
- Discussion ID
- File path
- Optional line or range

Action: open the associated discussion in ContextFlow.

Expected result: show the original discussion and allow the user to return to the associated activity.

### Linking rules

- Use stable IDs.
- Store repository identity.
- Store full commit hashes.
- Store file paths relative to workspace root.
- Store line ranges when available.
- Do not fabricate mappings.
- Handle deleted or renamed files gracefully.

## FEATURE 03: Living Architecture Graph

Purpose: keep a visual dependency map synchronized with repository changes.

### Scanner

1. Discover supported files.
2. Parse source files.
3. Extract imports and exports.
4. Resolve relative paths.
5. Identify unresolved references.
6. Build nodes and edges.
7. Generate graph JSON.

### Excluded directories

- node_modules
- .git
- dist
- build
- coverage
- .next
- Other configured generated directories

### Graph UI

- Pan and zoom
- Select nodes
- View node details
- Show dependency edges
- Search nodes
- Highlight recently changed nodes
- Refresh graph
- Export SVG

### Live updates

When a relevant file changes:
- Debounce the event.
- Re-scan the affected file or dependency scope.
- Update graph data.
- Highlight affected nodes.
- Broadcast the update to connected project members.

A full scan should remain available as a fallback.

### Executive view

Group detailed files into understandable modules using actual paths, dependencies, or explicit user configuration.

Examples:
- Frontend
- Backend
- Authentication
- Database
- API
- Shared utilities

Do not present guessed business functionality as verified fact.

## FEATURE 04: Stakeholder Export

Purpose: create project reports for people who do not need technical-level detail.

### Executive report

Include:
- Project name
- Report generation date
- Executive summary
- Recent progress
- Important changes
- High-level architecture
- Plain-English changelog

### Technical report

Include:
- Project structure
- Dependency graph
- Modified files
- Related commits
- Recent activity
- Relevant technical details

### Export formats

- **SVG:** scalable vector graph export.
- **JPG:** render the selected graph or report view as an image.
- **PDF:** printable report with headings, summary, graph, and activity information.

Allow technical and executive views and report scope selection. Include a generation timestamp. Handle large graphs gracefully. Never include secrets or environment variables.
