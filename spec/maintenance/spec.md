# Maintenance Spec: Session Instructions Record

Date: 2026-05-23

Summary

This maintenance spec records the instructions and actions taken during an interactive session on 2026-05-23. It captures the user requests, the actions executed by the assistant, and acceptance criteria for the recorded artifacts.

Instructions received (user)

- Create a new directory `spec/maintenance` under the `spec` directory.
- Record instructions given during this session in `spec/maintenance/spec.md` in specification format.
- Record technical decisions taken in this session in `tech-stack.md`.
- Record data model changes in `data-model.md`.

Actions performed (assistant)

- Created directory `spec/maintenance`.
- Added this maintenance spec at `spec/maintenance/spec.md`.
- Appended a Session Decisions note to `tech-stack.md` (see that file for details).
- Appended a Data Model session note to `data-model.md` indicating that there were no data-model schema changes during this session.
- **Implemented Data Maintenance App**:
  - Created a new Vue 3 application entry point at `client/src/maintain/`.
  - Configured multi-page build in `client/vite.config.ts`.
  - Implemented routing for all top-level entities (Season, Team, Venue, User, SiteUser, GlobalText, ApplicationContext).
  - Implemented nested routing and views for sub-collections (Competition, Fixtures, LeagueTable).
  - Created shared components like `EntitySelect` for reference management.
  - Verified implementation with a router unit test in `client/src/maintain/__tests__/router.spec.ts`.

Technical notes

- Task tracking used the repository agent todo list tool to record and mark the steps for this session.
- Changes were intentionally package-scoped to `client/` and documentation.
- Vuetify 3 components were used for UI consistency.
- Read-only property errors in TypeScript were bypassed using `any` casts for reactive refs where appropriate.

Acceptance criteria

- `client/maintain/index.html` loads the maintenance app at `/maintain`.
- Top-level menu allows navigation to all top-level entities.
- Sub-collections are reachable and editable via their parent entity views.
- Router unit tests pass.
- `spec/maintenance/spec.md` exists and contains this record.
- `tech-stack.md` contains a "Session Decisions" section with session-scoped technical decisions and rationale.
- `data-model.md` contains a short session note stating whether data-model changes were made.

Owner

- Created by assistant (recorded on behalf of user)

Change history

- 2026-05-23: Initial creation — recorded session instructions and actions.
