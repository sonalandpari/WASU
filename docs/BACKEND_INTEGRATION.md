# ContextFlow Backend & Integration Guide
**Version:** 1.0  
**Author:** Person 1 (Backend Lead)  
**Target Audience:** Person 2 (UI / Webview Lead), Person 3 (Architecture / Graph Lead), Person 4 (Extension / Git Lead)

---

## 1. Quick Start & Server Setup

### Prerequisites
- Node.js >= 18 (Tested on Node v20 / v24)
- npm >= 9

### Environment Variables
Configure `apps/backend/.env`:
```ini
PORT=3001
DATABASE_URL="file:./contextflow.db"
PRESENCE_TIMEOUT_MS=60000
PRESENCE_CLEANUP_INTERVAL_MS=15000
```

### Installation & Run Commands
```bash
# 1. Install all dependencies across workspaces
npm install

# 2. Build the shared contracts package
npm run --workspace=packages/shared build

# 3. Generate Prisma client & push schema to SQLite
npx prisma generate --schema=apps/backend/prisma/schema.prisma
npx prisma db push --schema=apps/backend/prisma/schema.prisma

# 4. Run tests
npm test

# 5. Start development backend with auto-reload
npm run dev
# Or for production:
# npm run build && npm start
```

Default Endpoints:
- **HTTP REST Base URL:** `http://localhost:3001`
- **Socket.IO Realtime Endpoint:** `ws://localhost:3001`
- **Health Check:** `http://localhost:3001/health`

---

## 2. Shared Contracts (`packages/shared`)

All developers (`apps/extension`, `apps/webview`, `apps/backend`) should import types and validation schemas directly from `@contextflow/shared`:

```typescript
import {
  Project,
  ProjectMember,
  MemberPresence,
  TimelineEvent,
  ProjectEventType,
  ChatMessage,
  DiscussionLink,
  CommitPayload,
  ArchitectureGraph,
  ReportData,
  SOCKET_CLIENT_EVENTS,
  SOCKET_SERVER_EVENTS
} from "@contextflow/shared";
```

---

## 3. REST API Reference

All API responses follow the standard envelope format:
```json
{
  "success": true,
  "data": { ... }
}
```
Errors return:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | PROJECT_NOT_FOUND | ...",
    "message": "Human readable error description",
    "details": [...]
  }
}
```

### 3.1 Projects

#### `POST /projects`
Creates a new workspace project.
- **Request Body:**
  ```json
  {
    "name": "WASU Core",
    "repositoryKey": "github.com/org/repo",
    "description": "Main application workspace"
  }
  ```
- **Response (201):** Returns the created `Project` object.

#### `GET /projects/:projectId`
Fetches project details and member counts.
- **Response (200):** `Project & { membersCount: number }`

#### `POST /projects/:projectId/join`
Registers or updates a team member in the project.
- **Request Body:**
  ```json
  {
    "userId": "usr_dev_123",
    "userName": "Alex",
    "role": "MEMBER" // "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  }
  ```
- **Response (200):** Returns `ProjectMember`.

---

### 3.2 Live Activity Feed

#### `GET /projects/:projectId/events`
Query parameters:
- `type`: Filter by event type (`FILE_SAVED`, `BRANCH_SWITCHED`, etc.)
- `actorId`: Filter by member ID
- `file`: Substring search on changed/active file path
- `branch`: Substring search on branch name
- `since`: ISO timestamp (returns events with `occurredAt > since`, used for catch-up)
- `limit`: Default `50`, max `200`
- **Response (200):** Array of `TimelineEvent[]` sorted newest first.

#### `POST /projects/:projectId/events`
Creates an activity event. The backend assigns the authoritative `occurredAt` timestamp and broadcasts `activity.created` to connected team members in the project room.
- **Request Body:**
  ```json
  {
    "id": "optional-uuid-for-deduplication",
    "type": "FILE_SAVED",
    "actorId": "usr_dev_123",
    "actorName": "Alex",
    "payload": {
      "filePath": "src/services/auth.ts",
      "languageId": "typescript",
      "changeCount": 4
    }
  }
  ```
- **Response (201):** `TimelineEvent`

---

### 3.3 Team Presence

#### `GET /projects/:projectId/presence`
Returns active team members who are currently online and have refreshed their heartbeat within the timeout window (default 60s).
- **Response (200):** `MemberPresence[]`

#### `POST /projects/:projectId/presence`
Refreshes heartbeat and active file.
- **Request Body:**
  ```json
  {
    "userId": "usr_dev_123",
    "userName": "Alex",
    "activeFilePath": "src/index.ts",
    "connectionStatus": "ONLINE"
  }
  ```
- **Response (200):** `MemberPresence`

---

### 3.4 Discussions & 3-Tier Deep-Linking

#### `GET /projects/:projectId/messages`
Retrieves chat messages and their linked code locations.
- **Query Params:** `limit`, `since`
- **Response (200):** `ChatMessage[]` with embedded `links: DiscussionLink[]`.

#### `POST /projects/:projectId/messages`
Creates a chat message and broadcasts `message.created`.
- **Request Body:**
  ```json
  {
    "userId": "usr_dev_123",
    "userName": "Alex",
    "content": "Let's refactor this function to handle errors properly.",
    "links": [
      {
        "repositoryKey": "github.com/org/repo",
        "filePath": "src/services/auth.ts",
        "startLine": 45,
        "endLine": 52,
        "commitHash": "9f8a3c2e1b4d..."
      }
    ]
  }
  ```
- **Response (201):** `ChatMessage`

#### `POST /projects/:projectId/discussion-links`
Attaches an existing message to a specific file, line range, and commit.
- **Request Body:**
  ```json
  {
    "messageId": "msg_uuid_123",
    "repositoryKey": "github.com/org/repo",
    "filePath": "src/services/auth.ts",
    "startLine": 45,
    "endLine": 52,
    "commitHash": "9f8a3c2e1b4d..."
  }
  ```
- **Response (201):** `DiscussionLink`

#### `GET /discussion-links/:id`
Used by VS Code Code Lens / editor commands to open the discussion attached to a file line or commit.
- **Response (200):** `DiscussionLink & { message: ChatMessage }`

---

### 3.5 Commits

#### `POST /projects/:projectId/commits`
Registers a Git commit. Prevents duplicate registrations on the same `(projectId, commitHash)`. Automatically creates a `COMMIT_LINKED` timeline event.
- **Request Body:**
  ```json
  {
    "repositoryKey": "github.com/org/repo",
    "commitHash": "9f8a3c2e1b4d7f5a6b0c2e3d4f5a6b7c8d9e0f1a",
    "shortHash": "9f8a3c2",
    "message": "feat: add user authentication",
    "authorName": "Alex",
    "commitTimestamp": "2026-10-31T03:00:00.000Z",
    "changedPaths": ["src/services/auth.ts", "src/models/user.ts"]
  }
  ```
- **Response (201):** `CommitPayload`

#### `GET /projects/:projectId/commits/:commitHash`
Fetches commit details and all discussion links associated with this commit.
- **Response (200):** `CommitPayload & { linkedDiscussions: DiscussionLink[] }`

---

### 3.6 Architecture Graph

#### `POST /projects/:projectId/architecture`
Saves a new scanned architecture snapshot, increments the version number, and broadcasts `architecture.updated` to all connected clients.
- **Request Body:**
  ```json
  {
    "graph": {
      "nodes": [
        { "id": "file-1", "label": "auth.ts", "kind": "file", "path": "src/services/auth.ts", "moduleName": "services" },
        { "id": "file-2", "label": "user.ts", "kind": "file", "path": "src/models/user.ts", "moduleName": "models" }
      ],
      "edges": [
        { "id": "edge-1", "source": "file-1", "target": "file-2", "kind": "imports" }
      ],
      "generatedAt": "2026-10-31T03:30:00.000Z",
      "scannerVersion": "1.0.0"
    },
    "summary": "Incremental AST scan after file save"
  }
  ```
- **Response (201):** `ArchitectureSnapshotRecord`

#### `GET /projects/:projectId/architecture/latest`
Fetches the latest architecture graph snapshot for initial rendering in React Flow.
- **Response (200):** `ArchitectureSnapshotRecord | null`

---

### 3.7 Stakeholder Reports

#### `GET /projects/:projectId/reports/data`
Returns a unified, factual data payload for Executive and Technical views, ready for SVG/JPG/PDF export.
- **Response (200):** `ReportData`:
  - `projectId`, `projectName`, `repositoryKey`, `generatedAt`
  - `summary`: total members, online members, commits, events, files, modules
  - `recentActivity`: latest timeline events
  - `commits`: recent commit payloads with changed files
  - `architecture`: latest architecture graph with nodes and edges
  - `modifiedModules`: modules grouped by directory with change counts
  - `discussions`: recent discussions with file and commit links

---

## 4. Socket.IO Realtime Reference

Connect to Socket.IO at `ws://localhost:3001`.

```typescript
import { io } from "socket.io-client";
import { SOCKET_CLIENT_EVENTS, SOCKET_SERVER_EVENTS } from "@contextflow/shared";

const socket = io("http://localhost:3001", {
  transports: ["websocket"]
});
```

### Client -> Server Events

1. **`project.join`**
   ```typescript
   socket.emit(SOCKET_CLIENT_EVENTS.PROJECT_JOIN, {
     projectId: "project-uuid",
     userId: "usr-123",
     userName: "Alex",
     lastEventOccurredAt: "2026-10-31T03:00:00.000Z" // Optional for reconnection catch-up
   }, (response) => {
     if (response.success) {
       console.log("Joined room! Online members:", response.data.onlineMembers);
       console.log("Catch-up events:", response.data.recentEvents);
     }
   });
   ```

2. **`presence.update`**
   Send periodically (heartbeat every 30s) or when the user switches files:
   ```typescript
   socket.emit(SOCKET_CLIENT_EVENTS.PRESENCE_UPDATE, {
     projectId: "project-uuid",
     userId: "usr-123",
     userName: "Alex",
     activeFilePath: "src/app.ts",
     connectionStatus: "ONLINE"
   });
   ```

3. **`activity.create`**
   ```typescript
   socket.emit(SOCKET_CLIENT_EVENTS.ACTIVITY_CREATE, {
     projectId: "project-uuid",
     type: "FILE_SAVED",
     actorId: "usr-123",
     actorName: "Alex",
     payload: { filePath: "src/app.ts" }
   });
   ```

4. **`message.create`**
   ```typescript
   socket.emit(SOCKET_CLIENT_EVENTS.MESSAGE_CREATE, {
     projectId: "project-uuid",
     userId: "usr-123",
     userName: "Alex",
     content: "Check line 42",
     links: [{ repositoryKey: "org/repo", filePath: "src/app.ts", startLine: 42, endLine: 42 }]
   });
   ```

### Server -> Client Events

1. **`project.joined`**
   Fired back to the joining socket with current online members and recent activity.
2. **`member.presence.updated`**
   Fired whenever a member joins, changes active file, switches offline, or expires.
3. **`activity.created`**
   Fired whenever an activity event occurs in the project.
4. **`message.created`**
   Fired when a discussion message is sent.
5. **`architecture.updated`**
   Fired when Person 3's AST scanner saves a new architecture snapshot.

---

## 5. Team Responsibilities & Integration Notes

### For Person 2 (Designer + Frontend / Webview):
- Connect to Socket.IO and emit `project.join` on Webview mount.
- Listen for `activity.created` to prepend new cards to the **Live Activity Feed**.
- Listen for `member.presence.updated` to update the **Presence Bar** / member badges.
- Load `GET /projects/:projectId/architecture/latest` for React Flow graph rendering, and listen for `architecture.updated` to update nodes and edges seamlessly.
- For **Reports Screen**, fetch `GET /projects/:projectId/reports/data` which provides all data needed for Executive View and SVG/JPG/PDF exports.

### For Person 3 (Architecture Engineer):
- Scan repository files, resolve dependencies, and construct `ArchitectureGraph`.
- Send graphs to the backend via `POST /projects/:projectId/architecture`.
- The backend will automatically version the snapshot, record an `ARCHITECTURE_UPDATED` timeline event, and broadcast `architecture.updated` to all connected frontends.

### For Person 4 (VS Code + Git Engineer):
- On extension activate, join the project room via `POST /projects/:projectId/join` or `project.join` socket event.
- When active editor changes, emit `presence.update` with `activeFilePath`.
- When files are saved, staged, branched, or pushed, call `POST /projects/:projectId/events` or emit `activity.create`.
- When commits are detected, call `POST /projects/:projectId/commits`.
- For Code Lens discussion links, call `GET /discussion-links/:id` to retrieve linked messages and open the discussion in the Webview panel.

