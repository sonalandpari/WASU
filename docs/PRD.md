# ContextFlow - Product Requirements Document
Version: 1.0

## 1. Product overview

ContextFlow is an open-source VS Code extension that connects team communication, code activity, architecture understanding, and stakeholder reporting in one workspace.

It reduces context loss when developers discuss work in external chat applications and then make changes in a repository.

## 2. Problem statement

Development teams often communicate in external chat applications, track changes through Git, inspect architecture through separate tools, and prepare project reports manually.

This creates several problems:
- Developers cannot easily connect a code change to its original discussion.
- Team members may miss important project activity.
- It is difficult to understand who is active in which file.
- Architecture diagrams become outdated.
- Managers struggle to understand technical progress.
- Finding the exact code associated with a discussion takes time.

## 3. Product goal

Provide a shared context layer inside VS Code that connects team presence, project activity, Git changes, source-code navigation, architecture dependencies, and stakeholder reporting.

## 4. Target users

- **Developers:** understand recent changes and navigate directly to relevant code.
- **Team leads:** monitor activity, identify affected modules, and understand the reason behind changes.
- **Project managers:** understand progress without reading technical diffs.
- **Open-source contributors:** gain visibility into project activity and architecture.

## 5. Core features

### Feature 01: Live Activity Feed

Display real-time events in a chronological project feed.

Events:
- Member joined or left
- File saved
- Active file changed
- Branch created or switched
- Files staged
- Commit created or linked
- Changes pushed
- Pull request linked (optional)

Presence:
- Show currently active team members.
- Show which file a member is currently editing.
- Display subtle teammate indicators in the editor gutter where supported by VS Code decorations.
- Remove stale presence after disconnection or timeout.

Activity should be lightweight. Repeated file-save events should be throttled or grouped.

### Feature 02: 3-Tier Deep-Linking

Connect activity, diffs, source code, and discussions.

- **Tier 1, Activity → Diff:** select an activity or commit card and open its Git-style diff.
- **Tier 2, Diff → Source:** select a changed line, open the original workspace file, and highlight the corresponding line or range.
- **Tier 3, Source → Discussion:** open the discussion associated with that code change and show its author and timestamp.

Preserve stable identifiers connecting activity, commit, changed file, changed line/range, and discussion.

When exact line mapping is unavailable, show the nearest reliable file-level context rather than inventing a line location.

### Feature 03: Living Architecture Graph

Generate a dependency graph from the repository.

Initial formats:
- TypeScript
- JavaScript
- TSX
- JSX

The scanner should discover supported files, extract imports and exports, resolve relative imports where possible, identify unresolved dependencies, exclude generated/dependency directories, and update affected graph data when files change.

Graph capabilities:
- File nodes
- Module/package grouping
- Import relationship edges
- Node details
- Search and navigation
- Modified-node highlighting
- Technical and executive views

The graph must be generated from actual repository data. AI must not invent dependencies.

### Feature 04: Stakeholder Export

Generate reports understandable to non-technical stakeholders.

Formats:
- SVG
- PDF
- JPG

Executive view:
- Simplify technical files into understandable modules.
- Show major application areas.
- Display recent progress and important changes.
- Generate a plain-English changelog.

Technical view:
- Show detailed file and dependency relationships.
- Include relevant commit and activity information.

Exports must use stored activity and actual graph data.

## 6. Functional priorities

### P0: Required
- VS Code extension activation and project identification
- Team joining and presence
- Realtime activity feed
- File-save and Git activity events
- Commit and diff navigation
- Architecture graph generation
- Graph updates after file changes
- SVG export
- Basic stakeholder report

### P1: Important
- File-level presence decorations
- Diff-line to source navigation
- Discussion links from Code Lens
- Executive architecture view
- PDF and JPG exports
- Plain-English changelog

### P2: Stretch
- Pull request events
- AI-assisted report summaries
- Broader language support
- Advanced filtering and analytics
- Cross-editor support

## 7. Non-functional requirements

- Lightweight extension behavior.
- No unnecessary source-code uploads.
- Realtime updates for connected members.
- Reliable reconnection and event recovery.
- No duplicate activity events.
- Safe handling of disconnected users.
- Read-only Git operations.
- No automatic modification of project files.
- Modular, maintainable code.
- Clear error and connection states.

## 8. Success criteria

The prototype should demonstrate:
1. Two or more developers joining the same project.
2. A member's presence appearing in the extension.
3. File and Git activity appearing in the feed.
4. A commit opening its diff.
5. A diff line opening the correct source location.
6. A source-code discussion link reopening its context.
7. An architecture graph being generated and updated.
8. A stakeholder report being exported successfully.

## 9. Out of scope

- Replacing GitHub or GitLab.
- Replacing Slack, Discord, or WhatsApp.
- Full project management functionality.
- Keystroke recording.
- Automatic code editing.
- Production-grade enterprise access management.
- Guaranteed support for every programming language in v1.
