# Spec 20260507-103000: Results Submission

## Overview
This specification defines the functional and architectural requirements for submitting match results in the QuizLeague application. It covers the process of capturing scores and optional reports from users, persisting them to the database, updating league standings, and notifying the community.

## Goals
- Provide a user-friendly interface for teams to report match outcomes.
- Ensure data consistency across fixtures, results, and league tables.
- Automate secondary updates like statistics recalculation.
- Foster community engagement through immediate notifications of match results.

---

## Feature 1: Results Entry and Processing

**Who & why:** Registered team members need a simple way to report match results so that league standings are kept up to date. This eliminates the need for manual administrator intervention for every match.

### Functional Requirements

#### FR-1.1: Result Submission Form
The system shall provide a form for users to enter scores for their team's fixtures.
- The form must display the home and away team names.
- The form must allow entering numeric scores for both teams.
- The form must provide an optional text area for a match report (Markdown supported).
**Verify:** A user can successfully submit a score of 10-8 with a brief match report.

#### FR-1.2: Submission Permissions
Any registered user associated with a team shall be permitted to submit results for that team's fixtures.
**Verify:** A logged-in user can submit a result for their own team, but cannot submit for a fixture where their team is not a participant.

#### FR-1.3: Data Persistence
Upon submission, the system shall:
- Update the `Fixture` entity with the submitted `Result` (scores and submitter info).
- Create a new `Report` and `Text` entity if a report was provided.
**Verify:** Checking the database after submission shows the `fixture.result` field populated and a new `report` document linked to the fixture.

#### FR-1.4: League Table Recalculation
The system shall automatically recalculate the relevant `LeagueTable` entities associated with the competition of the submitted fixture.
**Verify:** A team's 'Played', 'Won', and 'Points' columns in the league table update immediately after a result is submitted.

#### FR-1.5: Statistics Update
The system shall trigger a background update of player and team statistics for the current season based on the new result.
**Verify:** Player 'Top Scorer' charts reflect the points from the newly submitted result within a short period.

### Architectural Requirements

#### AR-1.1: Command Pattern Implementation
Result submission must use the `ResultsSubmitCommand` interface defined in `shared/src/command/ResultsSubmitCommand.ts`.
**Verify:** The client POSTs a JSON payload that strictly matches the `ResultsSubmitCommand` structure.

#### AR-1.2: Server-side Task Handling
Processing logic must reside in `server/src/endpoint/TaskFunctions.ts` under the `resultSubmission` function.
**Verify:** `SiteEndpoints.ts` routes the `/result/submit` endpoint to `TaskFunctions.resultSubmission`.

#### AR-1.3: Asynchronous Background Tasks
Statistics recalculation and notification delivery must be executed using `queueMicrotask` or a similar non-blocking mechanism on the server to ensure fast response times for the user.
**Verify:** The API response for result submission is returned to the client before the statistics update and notifications are fully processed.

---

## Feature 2: Result Notifications

**Who & why:** All website users want to stay informed about the latest results. Automated notifications ensure everyone is aware of recent outcomes without having to manually check league tables.

### Functional Requirements

#### FR-2.1: Global Result Notification
Upon successful result submission, a notification shall be sent to all registered website users.
- The notification should include the competition name, the two teams involved, and the final score.
**Verify:** All registered users receive a notification (via the in-app notification system or email) shortly after a result is submitted.

### Architectural Requirements

#### AR-2.1: Notification Service Integration
The notification system should utilize a dedicated service (e.g., `NotificationService` or a SendGrid integration) to handle the delivery of alerts to all users.
**Verify:** Code in `TaskFunctions.ts` calls a notification delivery method after the fixture is saved.

---

## Data Requirements
- **Fixture:** Must store a `Result` object containing `homeScore`, `awayScore`, and a reference to the `submitter`.
- **Report:** Must store a reference to the `team` reporting, a reference to the `Text` entity, and a path relative to the fixture.
- **Text:** Must store the raw Markdown string and a `mimeType` of `text/markdown`.

## Integration Points
- **REST API:** POST `/api/result/submit` -> `resultSubmission(command: ResultsSubmitCommand)`.
- **Storage:** Uses `server/src/storage/Storage.ts` for all Firestore operations.
- **Shared Logic:** Uses `recalculateTables` from `@quizleague/shared` for league table updates.

## Related Specs
None — this is a standalone feature.

## Constraints
- Scores are non-negative integers.
- Match reports are optional and have no length limit beyond database constraints.

## Out of Scope
- Editing or deleting submitted results (requires administrator intervention).
- Automated validation against previous score reports (the latest report overwrites).
- Push notifications to mobile devices (out of current scope, focused on web/email).

## Spec Completeness Checklist

- [x] **Scope & acceptance criteria** — Defined in FR-1.1 through FR-2.1.
- [x] **Testing strategy** — "Verify" lines provide clear test conditions.
- [x] **Existing patterns** — Follows the Command pattern and TaskFunctions structure identified in research.
- [x] **Dependencies** — Uses existing `@quizleague/shared` and server storage utilities.
- [x] **Architecture & interfaces** — Explicitly references `ResultsSubmitCommand` and `TaskFunctions.ts`.
- [x] **Error handling & failure modes** — Asynchronous tasks prevent blocking user flow on secondary failures.
- [x] **Security review** — FR-1.2 addresses submission permissions.
- [x] **Performance impact** — AR-1.3 ensures non-blocking processing for heavy updates.
- [x] **Rollout & migration** — N/A for this new feature implementation.
- [x] **Assumptions & risks** — Assumes user/team association is correctly handled by `useUserStore`.
