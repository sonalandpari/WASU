# ContextFlow - Team Work Split
Version: 1.0

## Person 1: Backend, realtime, shared contracts, integration lead

- Create shared TypeScript contracts and event schemas first.
- Implement Express APIs, Prisma, and SQLite.
- Implement Socket.IO project rooms and realtime broadcasts.
- Build project membership and presence storage/expiration.
- Store activity, discussion links, commits, and architecture snapshots.
- Provide report-data APIs.
- Own backend integration and end-to-end backend tests.

## Person 2: Figma designer and frontend engineer

- Create high-fidelity Figma designs before frontend implementation.
- Implement Activity, Presence, Diff, Discussion, Architecture, and Reports screens.
- Build event cards and member indicators.
- Implement graph visualization using React Flow.
- Build technical/executive view controls.
- Implement report preview and SVG/JPG/PDF export workflows.
- Prepare presentation slides, screenshots, and demo visuals.

## Person 3: Architecture scanner and graph engine

- Scan JS/TS/JSX/TSX repositories.
- Parse imports and exports.
- Resolve dependency relationships.
- Generate graph JSON using shared contracts.
- Implement incremental rescanning and full refresh.
- Track modified files and affected graph nodes.
- Support module grouping for executive view.
- Test scanning accuracy and performance.

## Person 4: Git, VS Code events, deep-linking engineer

- Build VS Code workspace event collector.
- Detect saves, active files, branches, staging, commits, and pushes.
- Implement presence updates and editor gutter decorations.
- Build commit-to-diff navigation.
- Build diff-line-to-source navigation.
- Implement Code Lens discussion navigation.
- Handle event deduplication, reconnects, and missing files.
- Own extension-level integration tests.

## Responsibility boundaries

- Person 1 owns persistence, shared contracts, and realtime transport.
- Person 2 owns visual graph components and report interfaces.
- Person 3 owns scanner correctness and graph data.
- Person 4 owns VS Code event collection and editor navigation.

## Integration checkpoints

### Checkpoint 1: Contracts and design
- Person 1: shared types, event schemas, database design.
- Person 2: Figma screens and reusable components.
- Person 3: scanner proof of concept and sample graph JSON.
- Person 4: VS Code event and Git metadata proof of concept.

Agree on event names, graph format, and Webview message types.

### Checkpoint 2: Independent modules
- Person 1: REST APIs and Socket.IO.
- Person 2: React UI with mock data matching shared contracts.
- Person 3: initial scanner and graph generator.
- Person 4: workspace and Git event collection.

Each module must work independently.

### Checkpoint 3: Integration
- Person 1: persist and broadcast events.
- Person 2: connect activity and presence UI.
- Person 3: connect graph data to backend and frontend.
- Person 4: connect event collection and navigation.

Test with two separate VS Code instances.

### Checkpoint 4: Advanced features
- Person 1: discussion persistence, reconnect, report data APIs.
- Person 2: executive view and report exports.
- Person 3: incremental graph updates and modified-node highlighting.
- Person 4: diff-to-source and Code Lens discussion navigation.

Verify the complete three-tier navigation.

### Checkpoint 5: Demo and stabilization
- Fix integration bugs.
- Test disconnected and reconnecting states.
- Test duplicate events.
- Validate exports.
- Prepare demo repository.
- Record screenshots and demo video.

## Recommended build order

Get Activity → Diff → Source → Discussion working first. Then add the living architecture graph and stakeholder exports. This proves the central product promise before adding the visual differentiators.
