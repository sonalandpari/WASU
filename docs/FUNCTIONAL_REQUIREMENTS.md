# ContextFlow - Functional Requirements
Version: 1.0

- **FR-01 Extension activation:** activate inside VS Code and identify the currently opened workspace.
- **FR-02 Project registration:** allow a developer to create or join a project with a stable project ID and repository identity.
- **FR-03 Member presence:** register connected members and active file; expire stale presence after a configured timeout.
- **FR-04 Activity collection:** detect supported workspace and Git events and convert them into shared event schemas.
- **FR-05 Activity feed:** display events chronologically and insert new events without manual refresh.
- **FR-06 Activity filtering:** filter by member, event type, file, branch, and time range.
- **FR-07 Commit linking:** identify commits by full hash and repository identity; prevent duplicates.
- **FR-08 Diff navigation:** selecting commit activity opens the corresponding diff.
- **FR-09 Source navigation:** selecting a changed diff line opens the correct workspace file at the relevant line or range.
- **FR-10 Discussion linking:** allow a discussion to be linked to a file and, when available, a line range and commit.
- **FR-11 Code Lens access:** provide an editor action to open a linked discussion from the relevant source-code location.
- **FR-12 Architecture scanning:** parse supported source files and extract dependency relationships.
- **FR-13 Architecture visualization:** render the graph and allow users to navigate it.
- **FR-14 Architecture updates:** relevant file changes trigger a debounced graph update; full refresh remains available.
- **FR-15 Modified node highlighting:** recently changed files are highlighted in the graph.
- **FR-16 Executive architecture view:** allow switching to a simplified module-level view.
- **FR-17 Report preview:** allow preview of a technical or executive report.
- **FR-18 Export:** support report export as SVG, JPG, and PDF.
- **FR-19 Reconnection:** reconnect after network interruption and retrieve missed persisted events.
- **FR-20 Error handling:** clearly communicate backend unavailable, no Git repository, invalid commit, missing source file, unresolved dependency, scanner failure, and export failure.
- **FR-21 Privacy and safety:** do not capture keystrokes, automatically modify source files, modify Git history, execute scanned repository code, upload environment variables/secrets, or scan outside the selected workspace.
