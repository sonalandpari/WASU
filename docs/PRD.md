
# DevSync — Product Requirements Document

Status: Hackathon planning baseline
Product: DevSync
Platform: VS Code extension + companion backend
Target demo: Hackathon MVP
Team: 4 contributors

## 1. Summary

DevSync is a VS Code collaboration extension that connects team discussion with project activity.

It provides a shared chat and chronological activity timeline where member joins, commits, and pull requests can appear as structured events.

A teammate can open a commit event to inspect the associated code changes.

DevSync also generates a lightweight architecture map from the repository and allows the map to be exported.

The MVP is designed for a small team collaborating on one repository during a hackathon.

It is not intended to solve every collaboration or scaling concern in this release.

## 2. Problem

During collaborative development, teams commonly discuss work in one place and change code in another.

The context becomes disconnected:

- A teammate may join a discussion after important decisions were made.
- Chat messages and commits can be read in the wrong order or interpreted without context.
- A discussion may refer to code that has already changed.
- Teammates may need to inspect a commit or PR without leaving the collaboration context.
- Explaining the project architecture to someone outside the discussion takes manual effort.

DevSync aims to make these relationships visible in one project timeline.

## 3. Product Goal

Help a small development team understand project conversation and code activity in context, directly from VS Code.

### MVP Goals

1. Let teammates exchange project messages.
2. Make member-join events visible in the timeline.
3. Display linked commit activity with clear timestamps.
4. Let users open the relevant commit changes.
5. Generate and export a repository architecture map.
6. Keep the core demo usable without AI.

### Demo Success Criteria

The team can demonstrate:

- Four team members joining the same project space.
- A member-joined event appearing in the timeline.
- Chat messages appearing in realtime.
- A commit event appearing with a clear timestamp and commit identity.
- Opening the commit's changes from its timeline card.
- Generating an architecture map and exporting it.
- Showing that the core workflow still works when AI is unavailable.

These are demo success criteria, not measured production analytics.

## 4. Target Users

### Primary User: Teammate Working in a Shared Repository

A developer using VS Code who needs to follow team discussion and understand recent code activity without repeatedly switching context.

### Secondary User: Teammate Joining Mid-Work

A developer who needs a clear indication of when they joined and how project activity is represented in the shared timeline.

### Demo Stakeholder: Reviewer or Mentor

Someone who needs to understand the project structure through an exportable architecture map.

## 5. Product Principles

- Context over volume: show useful project events, not unrelated editor telemetry.
- Chronology clarity: distinguish when a Git commit happened from when DevSync detected or linked it.
- Small-team reliability: prioritize the four-person demo over hypothetical large-team scaling.
- AI optionality: no core feature depends on Gemma.
- Generated structure is grounded: architecture graph nodes and edges come from repository scanning; AI may summarize them but cannot create unsupported dependencies.

## 6. MVP Scope

### Included

- VS Code extension entry point and project selection/join flow.
- Shared project chat.
- Member-joined event.
- Timeline containing chat and structured project events.
- Commit event linked to a repository and commit hash.
- Commit detail/change navigation.
- Basic pull-request link event when a PR URL is supplied or available.
- Architecture scanner for supported JS/TS repository structures.
- Architecture graph visualization.
- Export architecture map as SVG.
- Realtime updates through Socket.IO.
- Optional architecture explanation through a Gemma provider adapter.

### Explicitly Excluded

- Production-grade authentication, organization administration, or role management.
- Supporting every editor or IDE.
- Large-scale load testing or production scaling.
- Full chat transcript ingestion from external platforms.
- Capturing all VS Code activity or keystrokes.
- Automatically inferring every discussion-to-commit relationship.
- Automatic code review, merge, or deployment.
- Guaranteed support for every language or build system.
- AI being required for chat, timeline, Git, or graph generation.
- A complete hosted SaaS deployment during the hackathon.

## 7. Core User Journeys

### Journey A — Join and Follow the Project

1. Developer opens DevSync in VS Code.
2. Developer selects or enters the project.
3. DevSync registers the member's join.
4. A MEMBER_JOINED event is added to the timeline.
5. Project chat and events load.
6. New messages and events arrive in realtime.

Outcome: teammates can see a clear join point and current project activity.

### Journey B — Discuss and Inspect a Commit

1. A teammate sends a chat message.
2. A commit is linked or detected for the project.
3. DevSync stores the commit identity and timestamps.
4. A commit event appears in the timeline.
5. A teammate selects View Changes.
6. VS Code opens the corresponding diff or commit view.

Outcome: the user can move from project context to the code change.

### Journey C — Generate and Share Architecture

1. Developer opens the Architecture tab.
2. DevSync scans supported repository files.
3. Scanner emits graph nodes and dependency edges.
4. UI renders the graph.
5. Developer exports the map as SVG.
6. The exported artifact can be shared outside the discussion.

Outcome: the team can explain the repository structure without manually drawing it.

### Journey D — Optional AI Explanation

1. Developer requests an architecture explanation.
2. DevSync sends the already-generated graph to the configured provider.
3. Gemma returns a text explanation.
4. UI displays the explanation with an AI label.
5. If provider is unavailable, the graph remains usable and the UI reports that explanation is unavailable.

Outcome: AI helps explain a deterministic graph without being a dependency of the product.

## 8. Priorities

| Priority | Capability |
|---|---|
| P0 | Project chat and timeline |
| P0 | Member-join event |
| P0 | Commit event and timestamp clarity |
| P0 | Open commit changes |
| P0 | Architecture graph generation |
| P0 | Architecture SVG export |
| P0 | Realtime updates |
| P1 | PR event/link |
| P1 | AI architecture explanation |
| P2 | PNG export |
| P2 | Broad language/framework coverage |

## 9. Non-Functional Expectations

- The extension should fail gracefully if the backend is unavailable.
- The UI should show loading, empty, and error states.
- Event ordering should use a consistent server-generated event time.
- Git timestamps must not be confused with DevSync event time.
- Only project-related information needed for the MVP should be stored.
- Secrets must not be committed or placed in extension frontend code.
- The MVP should be understandable and testable by the four-person team.

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Integration consumes hackathon time | Agree shared types/API early; integrate a vertical slice first |
| Git timestamp confusion | Store and label commit time and DevSync event time separately |
| AI setup fails on teammate machine | AI is optional; deterministic graph remains |
| Architecture scanner overpromises | Document supported languages and extraction limits |
| Scope expands to scaling/editor support | Keep demo limited to VS Code and four teammates |
| Diff navigation differs by environment | Test Git API/CLI path early and keep a fallback |

## 11. Demo Narrative

1. Open DevSync in VS Code.
2. Show the project and chat.
3. Have another member join; point out the join event.
4. Send a message.
5. Link or detect a commit; show both its Git time and DevSync event time.
6. Click View Changes and inspect the diff.
7. Open Architecture, generate the graph, and export SVG.
8. Optionally ask Gemma to explain the graph.
9. End by showing that AI is optional and the core workflow is still available.

## 12. Decisions to Confirm

- Final package versions and repository layout.
- Whether commit activity is manually linked, detected locally, or both.
- Exact Git API/CLI implementation.
- Whether backend runs locally for the demo or is hosted.
- Which architecture file types and import patterns are supported.
- Whether PR events are included in the final demo.
- Whether local Ollama/Gemma can be tested on at least one machine.
