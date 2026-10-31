# RERO ⚡
> **In-Editor Team Collaboration for VS Code**  
> Connect real-time team chat, live activity timelines, and Git commit tracking with 1-click native diffs — without ever leaving your code editor.

---

## 💡 Why RERO?

Developers lose significant focus switching between code editors, browser tabs, Slack/Discord channels, and GitHub pull requests.

**RERO embeds team communication directly into VS Code:**
- **Zero Context Switching:** Chat with teammates in the sidebar while keeping your code active in the editor.
- **Instant Code Reviews:** When a teammate commits code, a live card appears in your timeline. Clicking **"Diff"** opens VS Code's native side-by-side diff viewer (`vscode.diff`) in $<100\text{ms}$ — no browser required.
- **Automatic Project Context:** Automatically identifies who you are from local Git config, which repository and directory you are in, and generates a **1-click shareable Room Code** for teammates.
- **Local SQLite Persistence:** All discussions and activity cards survive reboots and disconnects.

---

## 🚀 Quick Download & Installation

The RERO extension is pre-packaged as a self-contained `.vsix` binary ready to install on any laptop running VS Code:

### Option A: Install via Terminal (Fastest)
From the repository root, run:

```bash
code --install-extension apps/extension/rero-1.0.0.vsix
```

*(On fish shell: `code --install-extension apps/extension/rero-1.0.0.vsix`)*

---

### Option B: Install via VS Code Graphical Interface
1. Send or copy `apps/extension/rero-1.0.0.vsix` (392 KB) to your laptop or teammates' laptops.
2. In VS Code, open the **Extensions view** (`Ctrl+Shift+X` on Windows/Linux or `Cmd+Shift+X` on macOS).
3. Click the **`...`** (Views and More Actions) menu in the top-right corner of the Extensions panel.
4. Select **"Install from VSIX..."** from the dropdown menu.
5. Browse and select `rero-1.0.0.vsix`.
6. Reload the window: press `Ctrl+Shift+P` $\to$ type **Developer: Reload Window** $\to$ press **Enter**.
7. Click the **RERO** icon on the left Activity Bar to open the collaboration sidebar!

---

## 👥 How to Run a Live Demo Across 2–3 Laptops

Follow these 3 simple steps to demo live collaboration:

### 1. Start the Real-Time Backend (Laptop 1)
On the primary laptop:

```bash
# Starts Express, Socket.IO on port 3001, and local SQLite DB
npm run dev --workspace=@contextflow/backend
```

### 2. Connect Teammates' Laptops (Laptop 2 & 3)
1. Install `rero-1.0.0.vsix` on Laptop 2 and 3 using the steps above.
2. Connect to the same Wi-Fi network and get Laptop 1's local IP (e.g. `192.168.1.45`), or create a quick tunnel on Laptop 1:
   ```bash
   npx localtunnel --port 3001
   ```
3. In VS Code on Laptop 2 & 3, open Settings (`Ctrl+,` or `settings.json`) and set:
   ```json
   {
     "rero.apiUrl": "http://192.168.1.45:3001"
   }
   ```
   *(Or set it to your tunnel URL).*

### 3. Collaborate in Real Time!
- **Chat:** Send a message in the bottom chat bar — it pops up instantly on both laptops!
- **Auto-Join Event:** When Laptop 2 opens the workspace, a `"Member Joined"` announcement broadcasts to everyone.
- **Git Commit Tracking:** Make any commit in your terminal:
  ```bash
  git commit -m "feat: testing live sync"
  ```
  Watch a commit card with the short hash, author, and clickable **"Diff"** button appear on all connected laptops in real time!

---

## 🖥️ Feature Tour

| Feature | Description |
|---|---|
| **Developer Context Bar** | Instant visibility of **Who Am I**, active directory path, git repository name (`sonalandpari/WASU`), and branch (`main`). |
| **1-Click Room Code** | Displays **`Room: WASU`** with a copy button so teammates can join the same live session instantly. |
| **In-Editor Team Chat** | Dedicated team chat docked at the bottom of the timeline with real-time Socket.IO broadcasts. |
| **Clickable Diff Viewer** | Click **"Diff"** on any timeline commit card to inspect side-by-side changes via native `vscode.diff`. |
| **Architecture Blueprint** | AST-based dependency graph displaying modular dependencies across the codebase. |
| **Intelligence Reports** | Generate and export executive and technical progress reports to PDF, SVG, or JPG. |

---

## 🛠️ Building & Packaging from Source

If you want to build or modify RERO locally:

```bash
# 1. Install root dependencies
npm install

# 2. Build all workspaces (shared contracts, webview UI, and extension)
npm run --workspace=packages/shared build
npm run --workspace=@contextflow/webview build
npm run --workspace=rero build

# 3. Run all automated tests (40/40 tests)
npm test --workspace=rero
npm test --workspace=@contextflow/webview
cd apps/backend && npm test -- --forceExit

# 4. Package a new .vsix binary
cd apps/extension
npx @vscode/vsce package --no-dependencies
```

---

## 📂 Repository Structure

```text
WASU/
├── apps/
│   ├── extension/          # VS Code Extension Host (Git detector, diff provider, VSIX package)
│   ├── webview/            # React + Vite frontend sidebar (Timeline, Chat, Architecture)
│   └── backend/            # Express, Socket.IO, Prisma ORM & SQLite database
├── packages/
│   ├── shared/             # TypeScript interfaces, event types, and API schemas
│   └── architecture-engine # AST scanner and dependency graph generator
├── docs/                   # Product requirements and technical integration guides
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](apps/extension/LICENSE).
