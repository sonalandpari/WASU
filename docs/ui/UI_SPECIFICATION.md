# ContextFlow — UI/UX Specification & Handover Guide
**Role:** Person 2 (Designer + Frontend / UI Lead)  
**Deliverable:** Complete React + TypeScript VS Code Webview with Arctic Aurora Theme

---

## 1. Design System: Arctic Aurora
The interface uses a modern developer-tool aesthetic adhering strictly to the Arctic Aurora dark theme:

| Element | Color Hex | CSS Class / Token | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#0B0F14` | `bg-aurora-bg` | Main app background, editor contrast |
| **Secondary Background** | `#111820` | `bg-aurora-secondary` | Headers, active drawers, card accents |
| **Sidebar Background** | `#0E141B` | `bg-aurora-sidebar` | Left navigation and diff line gutter |
| **Card Surface** | `#151E28` | `bg-aurora-card` | Activity cards, discussion bubbles |
| **Card Hover** | `#1A2532` | `bg-aurora-cardHover` | Interactive hover highlights |
| **Border Default** | `#263442` | `border-aurora-border` | Subtle panel dividers |
| **Primary Accent** | `#69D6E8` | `text-aurora-primary` | Brand accents, active tabs, buttons |
| **Secondary Accent** | `#8B9CFF` | `text-aurora-secondaryAccent` | Branch indicators, module tags |
| **Success / Commit** | `#4ADE80` | `text-aurora-success` | Git commits, online presence dot |
| **Warning / Staging** | `#F6C177` | `text-aurora-warning` | Staged changes, reconnecting banner |
| **Error / Deleted** | `#F87171` | `text-aurora-error` | Deleted diff lines, error banners |
| **Primary Text** | `#E8F0F6` | `text-aurora-textPrimary` | High-contrast body text |
| **Secondary Text** | `#91A0AE` | `text-aurora-textSecondary` | Subheadings, timestamps, descriptions |

---

## 2. Implemented Screens & Modules

### Screen 1: Live Activity Feed (`apps/webview/src/activity/`)
- Chronological timeline for all project events (`MEMBER_JOINED`, `FILE_SAVED`, `COMMIT_CREATED`, `BRANCH_SWITCHED`, `ARCHITECTURE_UPDATED`).
- Consecutive file-save grouping to avoid feed spam (shows multiplier badge like `×4`).
- Real-time search by filename, commit message, and user.
- Multi-dimensional filtering by event type and team member.
- Quick deep-link action triggers (`Diff`, `Open in Editor`, `Discussion`).

### Screen 2: Team Presence (`apps/webview/src/presence/`)
- Connected member avatar cluster with live status rings.
- Dynamic tracking of teammate active files and last-active relative timestamps.
- Direct click action on teammate files to open the identical file in the user's editor.

### Screen 3: Code Discussions & Git Diff Viewer (`apps/webview/src/diff/` & `src/discussion/`)
- Git-style unified / split diff view with added/deleted line numbers and syntax styling.
- Interactive line selection linking code lines directly to discussion threads.
- Threaded conversation stream with author avatars and reply forms.
- "Create Discussion" modal linking directly to file paths, line ranges, and code snippets.
- "View in Editor" button sending message bridge events to VS Code.

### Screen 4: Architecture Graph (`apps/webview/src/architecture/`)
- Powered by `@xyflow/react` (React Flow) with custom Arctic Aurora themed nodes.
- **Technical View**: File-level nodes with live dependency edges, import/export counts, and modified-node pulsing animations.
- **Executive View**: Grouped cards categorized into functional architectural modules (e.g., UI Shell, State Management, Shared Contracts).
- Interactive **Node Inspector** drawer revealing imports, exports, and file jump buttons.

### Screen 5: Stakeholder Reports & Multi-Format Exporter (`apps/webview/src/reports/`)
- Technical Audit vs. Executive Overview toggle.
- Formatted metrics (commits, changed files, net additions, contributor count).
- Milestone deliverables summary and commit changelog.
- Client-side export handlers for **SVG**, **JPG**, and **PDF** (using `html2canvas` and `jspdf`).

---

## 3. Communication Bridge with VS Code Extension (`Person 4`)
The Webview connects to the VS Code Extension Host using `apps/webview/src/services/vscodeBridge.ts`.

### Incoming Messages (Extension -> Webview):
- `INIT_STATE`: Initializes state when Webview is opened.
- `EVENT_RECEIVED`: Real-time project events from Socket.IO.
- `PRESENCE_UPDATED`: Team presence changes and active file updates.
- `GRAPH_UPDATED`: Refreshed dependency graph from AST scanner (Person 3).
- `CONNECTION_STATUS_CHANGED`: Network state changes (`connected`, `reconnecting`, `disconnected`).

### Outgoing Messages (Webview -> Extension):
- `OPEN_FILE`: `{ path: string, line?: number }`
- `VIEW_DIFF`: `{ commitHash?: string, file?: string }`
- `OPEN_DISCUSSION`: `{ discussionId: string }`
- `CREATE_DISCUSSION`: `{ title, filePath, lineStart, lineEnd, codeSnippet }`
- `REFRESH_GRAPH`: Triggers Person 3's AST scanner.
- `REFRESH_ACTIVITY`: Triggers backend activity fetch.

---

## 4. How to Run Locally

### Standalone Web Browser (with live Dev Simulator):
```bash
npm run dev:webview
```
Open `http://localhost:5173`. Use the bottom **Dev Simulator Bar** to test file saves, commits, presence, and graph changes.

### Production Bundle (for VS Code Webview Provider):
```bash
npm run build:webview
```
Outputs bundled assets to `apps/webview/dist/index.html` and `apps/webview/dist/assets/`.
