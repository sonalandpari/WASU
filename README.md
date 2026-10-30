# ContextFlow

ContextFlow is an open-source VS Code extension that connects developer conversations with code changes, project architecture, and stakeholder reporting.

## Core features

1. **Live Activity Feed:** real-time team presence and events such as file saves, branch changes, staging, commits, and pushes.
2. **3-Tier Deep-Linking:** Activity → Git-style diff → exact source location → original discussion.
3. **Living Architecture Graph:** AST-based dependency visualization that updates as the workspace changes.
4. **Stakeholder Export:** technical and executive reports exported as SVG, JPG, or PDF.

## Product principles

- Connect conversation, code changes, and project understanding.
- Keep core functionality deterministic; AI is optional.
- Do not capture keystrokes or unnecessary source contents.
- Do not modify source files or Git history.
- Scan only the selected workspace.
- Never invent dependency edges or line mappings.

## Proposed stack

- Extension: TypeScript, VS Code Extension API
- Webview: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Realtime: Socket.IO
- Database: SQLite, Prisma
- Git: VS Code Git API, Git CLI fallback
- Parsing: TypeScript Compiler API
- Graph: React Flow (`@xyflow/react`)
- Export: SVG rendering, JPG image rendering, PDF generation/print workflow
- Optional AI: Gemma through Ollama or a configured provider

## Repository structure

```text
contextflow/
├── apps/
│   ├── extension/
│   ├── webview/
│   └── backend/
├── packages/
│   └── shared/
├── docs/
│   ├── PRD.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── FUNCTIONAL_REQUIREMENTS.md
│   ├── TEAM_WORK_SPLIT.md
│   └── AI_AGENT_PROMPTS.md
└── README.md
```

## MVP demonstration

1. Two VS Code instances join the same project.
2. Presence and workspace activity appear in the feed.
3. A commit appears and opens its diff.
4. A changed diff line opens the corresponding source location.
5. A linked discussion opens from the source location.
6. The architecture graph updates after a file change.
7. The user switches to Executive View and exports a report.
