# Spec 20260507-103000: Critique (Claude)

## Overview
This is a manual critique of the 'Results Submission' specification (Spec 20260507-103000). The spec covers the end-to-end flow of match result reporting.

## Findings

### Missing Requirements
- **Error Handling (Client-side):** The spec describes the successful flow (FR-1.1) but does not specify how the UI should handle server-side errors (e.g., network failure, validation errors).
- **Concurrency:** The spec doesn't address what happens if two users submit a result for the same fixture simultaneously. While "latest overwrites" is mentioned in Constraints, the UI behavior for this (e.g., warning if a result already exists) is not defined.
- **Notification Opt-out:** FR-2.1 mandates global notifications, but there's no requirement for users to be able to opt-out or for the system to respect communication preferences.

### Ambiguous Language
- **FR-1.2 (Permissions):** "Any registered user associated with a team" is slightly vague. Does this association come from the `User` entity, the `Team` entity, or the `useUserStore` state? It should reference the specific data model linkage (e.g., `user.id` present in `team.users`).
- **FR-2.1 (Global Notification):** "Sent to all registered website users" could be extremely noisy. It's unclear if this means an in-app toast, an email, or a record in a 'notifications' table.

### Assumptions & Risks
- **AR-1.3 (queueMicrotask):** While efficient, `queueMicrotask` doesn't persist across server restarts. If the server crashes immediately after a result is saved but before the microtask runs, statistics might get out of sync. A more robust queue might be needed if statistics integrity is critical.
- **Notification Scale:** Sending a notification to "all users" for every match result might hit rate limits (e.g., SendGrid) if the league is large.

### Security Concerns
- **Submission Permissions (FR-1.2):** While mentioned, the enforcement mechanism (client-side vs server-side) should be clarified. AR-1.2 should explicitly state that the server must verify the user's team membership before processing the command.

### Performance Implications
- **League Table Recalculation (FR-1.4):** Recalculating all tables for a competition on every submission is fine for small leagues but might become slow. However, given the current project scope, this is likely acceptable.

## Recommendations
1. **Clarify FR-1.2:** Explicitly state that the server MUST validate the `userID` in the command against the fixture's team rosters.
2. **Detail Notification Mechanism:** Specify that notifications should at least create a record in a database, allowing for future in-app "inbox" features, and that email should be throttled or optional.
3. **Add Error States to FR-1.1:** Require the UI to display a clear error message if the submission fails.
4. **Update AR-1.3:** Note that while `queueMicrotask` is used for now, it's a "best effort" approach and periodic full stats regenerations (already present in `TaskFunctions.ts`) serve as the fallback.
