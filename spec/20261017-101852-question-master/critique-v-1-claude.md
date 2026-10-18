# Spec 20261017-101852: Question Master — Claude Critique (v1)

## Summary
The spec is well-grounded in the codebase (reuses `SiteEndpoints`, `GeminiResultsSummary`, `TaskFunctions.resultSubmission`, `useUserStore`/`authGuard`) and captures the domain rules accurately. The parse contract and Wix scrape/decrypt path are solid. The main gaps are: (1) the A/B ownership model is not fully pinned down, (2) a likely blocker in reusing the existing result-submission report path for a neutral question master, and (3) a few missing/ambiguous functional requirements that an implementer would otherwise have to guess at.

## Blocking gaps

### 1. How the system knows which team is "A" in half 1 is undefined
FR-4.2/FR-4.3 describe the A/B swap but never state how the initial A/B assignment is established. The spec needs an explicit setup decision: default home = "A" in half 1 (and away = "B"), or a QM-selectable choice at match start. Without this, an implementer cannot deterministically attribute team-round questions.

**Recommendation:** Add a setup FR (e.g. "FR-3.5: designate the A/B teams for half 1, defaulting home=A, with the swap applied automatically at round 6") and reference it from FR-4.2/FR-4.3.

### 2. Individual-round primary-contestant mapping is undefined
FR-4.4 says questions are "annotated with the category and the name of the contestant to whom it is directed", but never says how the system determines which contestant is primary for a given question. The question `number` suffix (e.g. `1A` vs `1B`) presumably encodes the team, and the team's category assignment then yields the contestant — but this is never stated. "The rules are the same as for team questions" is doing a lot of implicit work here.

**Recommendation:** Add an explicit rule: in an individual round, a question numbered with an "A" suffix is primary for the A-team's contestant assigned to that category; "B" is primary for the B-team's contestant; on a wrong answer it passes to the opposing team's contestant in the same category (already in FR-4.4). State the plain-number/empty-number case too.

### 3. Reusing `resultSubmission` may throw for a neutral question master
This is the most likely real blocker. `TaskFunctions.resultSubmission` → `saveFixture` → `newReport` calls `teamForUser(user)` and **throws** `No team found for user` when the submitter has no team. A neutral QM (the whole point of this feature) may not be a member of either team, and the generated match report is neutral, not team-scoped — but the existing `Report` entity is `{ team, text }` and is attributed to the submitter's team.

The spec's AR-5.1 ("reuse the existing endpoint, no new result-writing path") and the checklist's "Open" note under Security review understate this. As written, the primary submit path can fail.

**Recommendation:** Resolve explicitly in the spec, e.g. one of:
- (a) submit scores via `resultSubmission` but with `reportText` omitted, and store the AI match report as a top-level `Text` linked from the fixture/result via a new optional reference field; or
- (b) confirm the QM will always be a team member and accept team-scoped attribution (weak — report would be misattributed to one team); or
- (c) extend `resultSubmission`/`Report` to support a neutral, team-less report.

Do not leave this as a checklist note — it changes the AR and data model.

### 4. Scored-round count is ambiguous
The spec assumes 10 scored rounds (rounds 3 and 8 individual). The user's description ("each half consists of 5 rounds" + "there are 2 individual rounds, round 3 and round 8") is consistent with 10 total, but "5 rounds per half" was said in the *team rounds* context, which could also mean 10 team rounds **plus** 2 individual rounds (12 total). The checklist flags this as Open, but it is fundamental to FR-4.x and the score. This must be resolved before implementation.

## Missing functional requirements

### 5. Answer visibility is not specified
The QM must be able to see the answer to each question to adjudicate correctness, yet no FR covers revealing/showing the answer (the `answer` field exists in the data model but is never surfaced in Features 3–4). Add an FR: after an outcome is recorded (or on explicit "show answer"), the answer text is displayed to the QM, and the next question is not required to be shown until the QM advances.

### 6. Mis-tap / undo is unaddressed
A QM will occasionally record the wrong outcome. Either define an "undo last outcome" FR, or explicitly move it to Out of Scope. As written it is unspecified behavior an implementer will have to invent.

### 7. Fixture selection vs fixture-set date is under-specified
FR-3.1 says the QM "selects the fixture" and "the fixture date drives acquisition", but `Fixture` (shared/src/entity/Fixtures.ts) has no `date` — the parent `Fixtures` document does, and a `Fixtures` set may contain multiple `Fixture` matches sharing one quiz PDF. The spec should state: the QM selects a specific `Fixture`; its parent `Fixtures.date` is the acquisition date; the selected fixture's home/away are the scoring teams.

## Security / robustness

### 8. No server-side auth on the new endpoint
The route is client-side `authGuard`-protected, but `POST /rest/site/quiz/acquire` itself has no authentication requirement stated. Existing endpoints are loose here (e.g. `result/submit` trusts a client-supplied `userID`), but a new endpoint that scrapes, decrypts, and calls a paid Gemini API should at least be authenticated server-side and, ideally, rate-limited. State the server-side auth expectation explicitly, and note whether it inherits the existing (weak) pattern deliberately.

### 9. Validate the scraped PDF URL origin
The scraper extracts a URL from the Wix page and then downloads it. Validate that the resolved URL is on the expected host (`filesusr.com` / the Wix domain) and has a `.pdf` extension before fetching, to avoid the server being driven to fetch arbitrary URLs if the site content changes unexpectedly.

### 10. Password handling over the wire/logging
FR-1.2 says the password is "never persisted", but does not say it must not be logged or stored in error messages. Add: the password is sent over HTTPS, never written to server logs, and never echoed in error responses (only "incorrect password", not the value).

## Minor

- **AR-2.2 is two approaches in one requirement.** Pick one primary parse-input path for a single testable `Verify` (recommend pdfjs text extraction), and demote the `qpdf` + `inline_data` alternative to a Constraints/Risks note. Otherwise the acceptance test is ambiguous.
- **Team-size vs subjects mismatch** is only in Assumptions. Add an edge-case statement: if a team has fewer players than subjects (or vice versa), how is assignment handled (unassigned subject? player taking two subjects?).
- **Gemini cost/abuse** (repeated acquire/parse calls) is unaddressed — a one-line rate-limit or per-session limit note would close it.

## Checklist assessment
- Scope & acceptance criteria: mostly yes, but items 1, 2, 4 above are unresolved.
- Security review: partially — items 8–10 are not addressed.
- Architecture & interfaces: the result-report attribution (item 3) is unresolved and affects the data model.
- Rollout & migration: fine (no schema change *if* item 3 is resolved without one).
- Testing strategy: needs a committed sample encrypted PDF (noted).
