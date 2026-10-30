# ContextFlow - UI/UX Design Specification
Version: 1.0

## 1. Design direction

Create a modern developer tool that feels native to VS Code.

- Dark-first interface.
- Clean, compact layout.
- Clear typography and information hierarchy.
- Subtle activity animations.
- Minimal visual clutter.
- Consistent with VS Code dark themes.
- Avoid making the product look like a generic messaging app.

## 2. Main navigation

Four primary sections:
1. Activity
2. Architecture
3. Discussions
4. Reports

Project header:
- Project name
- Current branch
- Connected members
- Connection status
- Project settings

## 3. Activity screen

Display a chronological feed containing:
- Member joined events
- File-save events
- Branch events
- Staging events
- Commit events
- Push events
- Architecture updates

Each event card has:
- Member avatar
- Member name
- Action description
- File or branch details
- Timestamp
- Relevant action button

Include filters, search, empty state, loading state, and disconnected state. Group repetitive file-save events where possible.

## 4. Presence UI

Show connected members, their active file, and connection status. Use subtle indicators in the file gutter when teammates are active in that file. Presence should not overwhelm the editor or feed.

## 5. Deep-linking UI

Activity card actions:
- View Diff
- View File
- Open Discussion

Diff screen:
- Changed files
- Added and removed lines
- File navigation
- Selectable changed lines

Source editor:
- Open exact file
- Highlight target line or range
- Show Code Lens or action to open related discussion

Discussion panel:
- Original message or thread
- Author
- Timestamp
- Related file and commit
- Return to activity action

## 6. Architecture screen

Components:
- Graph canvas
- Search bar
- Zoom controls
- Selected node details panel
- Refresh button
- Technical / Executive toggle
- Export button

Technical view: file-level nodes and import edges.

Executive view: group related files into understandable modules and show simplified relationships.

Modified nodes should have a subtle glow or pulse. Do not animate every node continuously.

## 7. Reports screen

Allow users to select Technical or Executive report, choose report scope, preview the report, and export SVG, JPG, or PDF.

Report preview:
- Project name
- Generated date
- Summary
- Architecture overview
- Recent activity
- Plain-English changelog

## 8. Required UI states

- Initial empty state
- Loading state
- No project connected
- No teammates online
- Backend disconnected
- Reconnecting
- No Git repository
- No architecture data
- Scanner error
- Export in progress
- Export completed
- Export failed

## 9. Component suggestions

- ProjectHeader
- MainNavigation
- ActivityTimeline
- ActivityCard
- MemberJoinedEvent
- FileSavedEvent
- BranchEvent
- CommitEvent
- PushEvent
- PresenceList
- PresenceBadge
- DiffViewer
- ChangedFileList
- DiscussionPanel
- CodeContextCard
- ArchitectureGraph
- ArchitectureToolbar
- ArchitectureNodeDetails
- ExecutiveView
- ReportPreview
- ExportDialog
- ConnectionStatus
- EmptyState
- ErrorState
- LoadingState
