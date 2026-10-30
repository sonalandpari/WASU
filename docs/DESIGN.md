
# DevSync — Design Document

Status: Hackathon MVP design baseline
Surface: VS Code extension with React Webview
Design goal: Keep collaboration context close to the code, with minimal navigation and clear chronology.

## 1. Experience Principles

1. Feels like part of VS Code: use compact spacing and theme-aware colors.
2. Conversation and events are distinct: chat is authored by people; system activity is structured and labeled.
3. Chronology is explicit: event time, Git time, and link time must not be visually conflated.
4. Actions are close to context: commit cards expose View Changes; architecture view exposes export.
5. No AI dependency: AI explanation is an optional action, not a required screen or setup step.

## 2. Information Architecture

Main extension view:

### Project Header

- Project/repository name
- Connection state
- Current project/member context

### Tabs

- Activity — chat + event timeline
- Architecture — graph, scan, export, optional explain

### Activity View

- Timeline
- Message composer

### Architecture View

- Generate map action
- Graph canvas
- Node details
- Export action
- Optional AI explanation panel

## 3. Activity View Layout

```text
┌──────────────────────────────────────────┐
│ DevSync   [project/repo]   ● Connected │
├──────────────────────────────────────────┤
│ [Activity] [Architecture]              │
├──────────────────────────────────────────┤
│ Activity timeline                      │
│                                        │
│ 10:04  ── Alex joined the project      │
│                                        │
│ 10:06  Alex                            │
│        "I'll update the event service"  │
│                                        │
│ 10:09  COMMIT · a1b2c3d                │
│        "Add event service"              │
│        Git time: ...                    │
│        Linked in DevSync: ...           │
│        [View changes]                  │
│                                        │
├──────────────────────────────────────────┤
│ [Write a message................] [Send]│
└──────────────────────────────────────────┘
```

This is a conceptual wireframe, not a pixel-perfect specification.

## 4. Timeline Item Types

### Chat Message

- Author name/avatar placeholder
- Message text
- Message timestamp
- No system-event badge

### Member Joined

- System event icon
- Member joined label
- Member display name
- Event timestamp
- Distinct background/border from chat

### Commit Linked

- Commit icon and event label
- Short hash
- Commit message
- Author if available
- Git timestamp with explicit label
- DevSync linked/event timestamp
- Changed file count or paths if available
- View Changes action

### PR Linked

- PR icon and label
- Title
- URL/open action
- Linked event time
- MVP does not display live review status unless actually integrated

## 5. Timestamp Design

The product's key UX promise is context clarity.

Use separate labels:

- Timeline: Added to DevSync or event time — backend occurredAt
- Git commit time: commit timestamp sourced from Git
- Linked: when DevSync registered the commit link

Do not display a bare time that hides which timestamp it represents.

If the card is compact, show the timeline time prominently and put Git time/link time in metadata or a detail popover.

If timestamps differ materially, do not hide the difference.

## 6. Architecture View

```text
┌──────────────────────────────────────────┐
│ DevSync   [project/repo]               │
├──────────────────────────────────────────┤
│ [Activity] [Architecture]              │
├──────────────────────────────────────────┤
│ [Generate map] [Export SVG] [Explain*] │
│ *Explain appears only when configured   │
├──────────────────────────────────────────┤
│                                          │
│        ┌─────────┐      ┌─────────┐      │
│        │ app.tsx │ ───▶ │ routes  │      │
│        └─────────┘      └─────────┘      │
│             │                            │
│             ▼                            │
│        ┌─────────┐                       │
│        │ service │                       │
│        └─────────┘                       │
│                                          │
├──────────────────────────────────────────┤
│ Selected node: routes                    │
│ Path: src/routes/...                     │
└──────────────────────────────────────────┘
```

The graph above is illustrative only.

Actual nodes and edges must come from the scanner.

### Architecture Interactions

- Generate map: scan supported repository files and render graph.
- Select node: show label, kind, and path.
- Pan/zoom: use graph library supported interactions.
- Export SVG: save/share current graph representation.
- Explain: optional AI explanation of generated graph; show provider errors inline.

### Empty/Error States

No scan yet:

"Generate an architecture map to explore this repository."

No supported files:

"No supported JS/TS modules found."

Scan failed:

Show error and retry.

AI unavailable:

"Architecture map is available. Explanation provider is not configured."

Export failed:

Keep graph visible and show failure message.

## 7. Visual Direction

- Respect VS Code light/dark theme tokens where practical.
- Use neutral surfaces; reserve strong color for event types and connection/error status.
- Keep chat message styling compact.
- Use icons for event type, but pair icons with labels for accessibility.
- Do not rely on color alone to distinguish chat, commits, joins, and errors.
- Avoid large dashboards, complex navigation, and settings pages in the MVP.

## 8. Interaction Behavior

| Interaction | Expected Result |
|---|---|
| Open DevSync | Activity view opens; project context is visible |
| Join project | Join event is created and appears in timeline |
| Send message | Message validates, persists, and appears |
| Receive event | Timeline updates without refresh |
| Click View Changes | Extension host opens commit diff |
| Open Architecture | Architecture view appears |
| Generate map | Scanner runs and graph renders |
| Select graph node | Node details show source path |
| Export SVG | Exported graph file is produced |
| Click Explain | If configured, request AI explanation; otherwise unavailable |

## 9. Accessibility and Usability

- Buttons have accessible labels.
- Event types are readable as text, not icon-only.
- Keyboard navigation should work for main controls.
- Focus should remain visible.
- Loading and error states should be clearly visible.
- Graph navigation may be limited by the selected library.
- Provide node details in a textual list if graph accessibility is insufficient and time permits.

## 10. Demo-Ready Content

Use a small, known repository with:

- Four member identities or demo accounts
- Several chat messages
- At least one member-joined event
- Two or three commits with changed files
- A JS/TS folder structure that produces a readable graph

Do not fabricate live activity in the final demo without labeling it as demo data.

If prerecorded or seeded data is used, disclose it in the presentation.
