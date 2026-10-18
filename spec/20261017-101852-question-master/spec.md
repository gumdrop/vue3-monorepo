# Spec 20261017-101852: Question Master

## Overview
This specification defines an experimental, auth-only "Question Master" section of the QuizLeague website. A question master (QM) selects the fixture being played, supplies the quiz PDF password, and the system scrapes the question writer's Wix site, decrypts the PDF, and uses DeepSeek to parse it into an ordered JSON structure. The QM then presents questions one at a time, records the outcome of each question, tracks the running score (including individual-round category assignments and jokers), and finally submits the result with an AI-generated match report.

## Goals
- Let a question master run a whole match on one screen, with no paper and no manual scorekeeping.
- Fetch, decrypt, and structure the weekly quiz automatically from the question writer's site.
- Enforce the league scoring rules (team rounds, individual rounds, bonuses, jokers) correctly and consistently.
- Submit the final result through the existing result submission pipeline, with an AI-generated match report.

---

## Feature 1: Quiz Acquisition

**Who & why:** Question masters currently visit the question writer's Wix site, download a password-protected PDF, and read questions off paper. They need the system to resolve that PDF automatically so the rest of the tool can present it in order.

### Functional Requirements

#### FR-1.1: Resolve the quiz PDF URL by scraping Wix
Given the fixture date, the server shall locate the current quiz PDF without human action:
- Fetch the Wix home page (`https://pantscat69er.wixsite.com/chiltern`).
- Find the link/button whose visible text matches `Quiz for <fixture date>`.
- Follow that link to the subpage and extract the `filesusr.com/ugd/*.pdf` URL.
- Date matching must accept both `DD/MM/YY` and `DD/MM/YYYY` button formats.
- Validate the extracted URL is on the `filesusr.com` (Wix) host and ends with `.pdf` before downloading it.
**Verify:** For a fixture dated 13/10/2026, the server resolves the `filesusr.com` PDF URL without any manual step.

#### FR-1.2: Download and decrypt the quiz PDF
The server shall download the resolved PDF and decrypt it using the password supplied by the QM at the start of the session. The password is never persisted server-side or client-side after the session ends. It is transmitted only over HTTPS, is never written to server logs, and is never echoed in error responses (only a generic "incorrect password" message).
**Verify:** With the correct password the quiz content becomes readable; with an incorrect password the system returns a clear "incorrect password" error and does not crash.

#### FR-1.3: Handle acquisition failures
If the home page, subpage, or PDF cannot be fetched, or the button for the fixture date is not found, the server shall return a specific error message distinguishing "quiz not found for this date" from "download failed" from "incorrect password".
**Verify:** Removing the quiz button for a date yields a "quiz not found" error; a bad password yields an "incorrect password" error.

### Architectural Requirements

#### AR-1.1: Server-side scraping without a headless browser
Scraping shall run on the server using plain HTTP `fetch` plus HTML parsing. The Wix home and subpage HTML is server-rendered and contains the button link and PDF URL directly, so no headless browser is required. This logic lives in a new `server/src/endpoint/QuizMasterFunctions.ts` module (or sibling), following the `SiteFunctions.ts` pattern.
**Verify:** Scraping is implemented with `fetch` + string/regex extraction, with no Playwright/puppeteer dependency in the server bundle.

#### AR-1.2: PDF decryption with pdfjs-dist
Decryption shall use `pdfjs-dist` (pure JavaScript, no native binaries, compatible with the esbuild single-file deploy) via `getDocument({ data, password })`. Note: `pdf-lib` is explicitly unsuitable because it cannot decrypt password-protected documents.
**Verify:** `pdfjs-dist` is the only new PDF dependency; the server bundle remains a single `main.cjs`.

#### AR-1.3: New REST endpoint
A new endpoint `POST /rest/site/quiz/acquire` shall accept `{ fixtureDate, password }` and return the parsed quiz JSON (Feature 2). It is registered alongside the existing endpoints using the same `configure(app)` pattern as `SiteEndpoints.ts`. Access control follows the existing site pattern: the client route is guarded with `authGuard`, and the endpoint trusts the signed-in user's identity supplied by the client (as `result/submit` does today).
**Verify:** `POST /rest/site/quiz/acquire` routes to the acquisition function and returns JSON or a typed error.

---

## Feature 2: AI Parsing

**Who & why:** The decrypted PDF is a human-formatted document with rounds, subjects, and numbered questions. The QM needs it converted into a strict, ordered JSON structure so the presentation and scoring logic can consume it deterministically.

### Functional Requirements

#### FR-2.1: Parse the quiz into JSON with DeepSeek
The server shall send the decrypted quiz content to DeepSeek and receive a JSON object with this exact structure:

```json
{
  "rounds": [
    {
      "round": "Round Name",
      "subjects": ["Subject 1", "Subject 2"],
      "questions": [
        { "number": "1A", "question": "...", "answer": "..." }
      ]
    }
  ]
}
```

**Verify:** A sample PDF returns valid JSON that parses and contains a non-empty `rounds` array.

#### FR-2.2: Preserve content and order verbatim
The parsed JSON shall preserve round names, subject headings, question numbers (`1A`, `1B`, `2A`, `1`, or empty for tiebreak), and question/answer text exactly as printed, including punctuation, accents, and parenthetical notes. Rounds and questions must remain in document order. `subjects` shall be present only on rounds whose name contains "Individual".
**Verify:** For each question in the PDF, the parsed `number` and `question`/`answer` text match the PDF byte-for-byte and appear in the same order.

#### FR-2.3: Include every section
The parse shall include all sections in the PDF — main rounds, the two spare sets (A and B), the beer round (20 questions), and tiebreak — as separate rounds in the `rounds` array, in document order.
**Verify:** The `rounds` array contains an entry for the tiebreak section when the PDF has one.

#### FR-2.4: Review before starting
After parsing, the QM shall be shown the parsed rounds and questions (including extra sections) and may re-run acquisition/parsing before starting the match. Editing parsed text is out of scope for this version.
**Verify:** The QM can inspect the parsed structure and trigger a re-parse without restarting the session.

### Architectural Requirements

#### AR-2.1: Reuse the existing DeepSeek integration
Parsing shall reuse the existing DeepSeek client in `server/src/endpoint/DeepSeekResultsSummary.ts` (the `use_deepseek_ai` branch renames `GeminiResultsSummary.ts` and calls the OpenAI-compatible chat completions API). A new function (e.g. `parseQuiz`) sends the fixed parsing prompt with `response_format: { type: 'json_object' }` and returns the parsed object.
**Verify:** The parse call shares the `DEEPSEEK_API_KEY`/`DEEPSEEK_MODEL` resolution code with the existing summary/roundup functions.

#### AR-2.2: Decrypted content replaces the `[URL]` placeholder
The parsing prompt is fixed (see Data Requirements). DeepSeek is text-only, so the server substitutes the decrypted quiz content in place of `[URL]` by extracting text with `pdfjs-dist` `getTextContent` and inlining it; JSON output is enforced with `response_format: { type: 'json_object' }`.
**Verify:** The fixed prompt is not duplicated in client code; the text substitution happens server-side, and the v1 acceptance test uses extracted text.

#### AR-2.3: Validate the parse response
Before returning the parse to the client, the server shall validate that the response is JSON matching the required shape (array of rounds; each round has `round` and `questions`; each question has `number`, `question`, `answer`). Invalid responses return a "parse failed" error and allow retry.
**Verify:** A DeepSeek response missing `rounds` is rejected with a typed error rather than returned to the client.

---

## Feature 3: Match Setup

**Who & why:** Before questions are read, the QM must establish which fixture is being played, who is playing, and (for individual rounds) which player is answering which category, so every question can be attributed correctly.

### Functional Requirements

#### FR-3.1: Fixture context and access control
The QM shall select the fixture (home and away teams) being played. The selected `Fixture`'s parent `Fixtures.date` is the acquisition date used by FR-1.1; the fixture's home/away teams drive scoring and result submission. This section is accessible only to signed-in users, is not present in the site menu, and the signed-in user is recorded as the match operator/submitter.
**Verify:** An unauthenticated visitor cannot reach the section; a signed-in user can select a fixture and its date/teams are shown.

#### FR-3.2: Enter player names
The QM shall enter the names of the players for each team at the start of the match.
**Verify:** Player names entered for both teams are available throughout the session for question attribution.

#### FR-3.3: Assign players to categories in individual rounds
At the start of each individual round (rounds 3 and 8), the QM shall assign each team's players to the round's categories (subjects). The categories shall be presented to the QM at the start of the round, then collapsed for the rest of the round but still viewable on demand. The number of categories comes from the parsed PDF; if a team has fewer players than categories, a player may be assigned more than one category.
**Verify:** In an individual round, every category has a named contestant from each team assigned to it, even when a player covers more than one category.

#### FR-3.4: Declare jokers
At the start of each individual round, before any question in that round is answered, the QM shall record which category each team is playing its joker on. Jokers apply to one category per team, only in individual rounds, and there are no restrictions on which category may be chosen.
**Verify:** Each team's joker category is captured before the first question of the round and is immutable for the rest of that round.

#### FR-3.5: Designate the A team for the first half
At match start the QM shall designate which team is the "A" team for the first half, defaulting to home = A. The designation swaps automatically for the second half (rounds 6–10).
**Verify:** The team shown as the A team in rounds 1–5 matches the QM's designation, and the opposite team is shown as A in rounds 6–10.

### Architectural Requirements

#### AR-3.1: Experimental auth-guarded route
The section shall be added as a new route (e.g. `/quizmaster`) in `client/src/site/router/index.ts` with `beforeEnter: authGuard`, following the existing named-component route structure. It shall not be added to any navigation/menu component.
**Verify:** The route exists with `authGuard` and appears in no menu.

#### AR-3.2: Session state in a Pinia store
Match session state (selected fixture, players, category assignments, jokers, parsed quiz, question progress, scores) shall live in a new Pinia store following `client/src/stores/app.ts` conventions. State is in-memory only for this version (no Firestore session persistence).
**Verify:** The store holds all session state and is the single source of truth for the running match.

---

## Feature 4: Question Presentation and Scoring

**Who & why:** The QM reads questions aloud and needs the tool to present them one at a time, in the correct order, clearly labelled with the team/contestant to whom each is directed, and to keep the score correctly according to league rules.

### Functional Requirements

#### FR-4.1: Present questions in order
Questions shall be presented one at a time in document order: rounds in order, and questions within each round in their numeric order. The scored match consists of exactly 10 rounds — rounds 3 and 8 are individual rounds and the other 8 are team rounds. The QM advances explicitly to the next question.
**Verify:** The sequence of presented questions matches the PDF's round and question order exactly.

#### FR-4.2: Team-round attribution and scoring
For team rounds, each question shall be labelled with the team it is directed at (the "A" or "B" team for the current half, per FR-3.5). The QM records one of three outcomes:
- **Correct** — the owning team answered correctly: **+2 points** to the owning team.
- **Bonus to the opposition** — the owning team answered wrong and the question passed over; the other team answered correctly: **+1 point** to the other team.
- **Unanswered** — neither team answered: **0 points**.
The running home/away score shall update immediately and correctly for every outcome.
**Verify:** A "correct" answer adds 2 to the owning team; a "bonus" adds 1 to the opposing team; the displayed score always equals the sum of recorded outcomes.

#### FR-4.3: Half swap
The A/B ownership shall swap between halves (see FR-3.5): the team that answered A questions in rounds 1–5 answers B questions in rounds 6–10, and vice versa.
**Verify:** A question numbered with a "B" suffix in round 7 is attributed to the team that answered A questions in round 1.

#### FR-4.4: Individual-round attribution
For individual rounds, each question shall be annotated with the category and the name of the contestant to whom it is directed. A question numbered with an "A" suffix is primary for the A team's contestant assigned to that category; a "B" suffix is primary for the B team's contestant. If the primary contestant answers wrong, the annotation shall change to the contestant from the other team assigned to the same category, reflecting the bonus opportunity. Questions with plain or empty numbers belong to the non-scored sections and are not scored.
**Verify:** An individual question shows "category + primary contestant" matching its A/B suffix; after a wrong answer it shows "category + opposing contestant in that category".

#### FR-4.5: Joker doubling
In an individual round, when a team's joker category is the category of the question being scored, any correct-answer value for that team is doubled: primary correct **2 → 4**, bonus correct **1 → 2**. The opposing team's answers on that category are not doubled.
**Verify:** A primary correct on a team's joker category adds 4 to that team; a bonus correct adds 2; the other team's values are unaffected.

#### FR-4.6: Categories collapsed but viewable
During an individual round, the category list shall be collapsed once assignments are complete, but the QM shall be able to expand it at any time to review assignments and jokers.
**Verify:** The collapsed category list can be expanded to show assignments and joker choices mid-round.

#### FR-4.7: Reveal the answer
After the QM records an outcome for a question, the answer text shall be shown to the QM. The next question is presented only when the QM explicitly advances.
**Verify:** Recording an outcome reveals the answer, and the next question does not appear until the QM advances.

#### FR-4.8: Undo the last outcome
The QM shall be able to undo the most recently recorded outcome, which reverts the running score and returns to that question.
**Verify:** Undoing the last recorded outcome restores the previous score and the question's unrecorded state.

#### FR-4.9: Invoke spare questions
The question paper contains two sets of spare questions (A and B). When a printed answer is clearly wrong or disputed, the QM shall be able to invoke a spare question from the matching set — an "A" question is replaced from the A spare set, a "B" question from the B spare set. The spare is presented and scored identically to the original question, and the replaced question is marked as void.
**Verify:** The QM can replace a disputed A question with the next A spare, the spare is scored like the original, and the voided question no longer counts toward the score.

#### FR-4.10: Beer round
The beer round (20 questions) is presented separately: every question is read to both teams, answers are written down, and marked at the end. The QM shall record each team's beer-round score. The beer-round score is displayed and recorded for the session but does not affect the main quiz result (it is excluded from the submitted `homeScore`/`awayScore`) and is included in the AI match report (FR-5.2).
**Verify:** The 20 beer-round questions are presented to both teams, each team's score is recorded at the end, and the submitted result equals the main-quiz score only (beer-round score excluded).

### Architectural Requirements

#### AR-4.1: Scoring logic isolated and unit-tested
The scoring rules (team ownership, half swap, bonus pass, joker doubling) shall be implemented as a pure, framework-free module (e.g. in `shared/src/utils/` or `client/src/services/`) with unit tests following `client/src/services/__tests__` conventions. UI components call this module; they do not re-implement scoring.
**Verify:** Unit tests cover correct/bonus/unanswered in team and individual rounds, the half swap, and joker doubling.

---

## Feature 5: Result Submission and AI Match Report

**Who & why:** At the end of the match the QM needs the final score recorded through the normal league pipeline and a written match report produced automatically from everything that was recorded during the match.

### Functional Requirements

#### FR-5.1: Submit the final result
At the end of the match, the QM shall be able to submit the result. Submission shall write the final `homeScore` and `awayScore` to the selected fixture's `Result`, with the signed-in user recorded as the submitter, using the existing result submission flow.
**Verify:** After submission, the fixture's `result.homeScore`/`result.awayScore` match the final displayed score and `submitter` is the signed-in user.

#### FR-5.2: Generate an AI match report
The system shall generate a Markdown match report from the recorded match data (teams, final score, per-round outcomes, notable correct/bonus answers, individual-round contestant performance, joker categories, and the beer-round scores) using DeepSeek, and submit it as the match report alongside the result.
**Verify:** After submission, a report `Text` document is created containing AI-generated Markdown that references the recorded match data.

#### FR-5.3: Confirmation and completion
After submission succeeds, the QM shall see a confirmation (and the generated report). The session's recorded data is then cleared.
**Verify:** A successful submission shows a confirmation with the report and clears the in-memory session.

### Architectural Requirements

#### AR-5.1: Reuse the existing result submission endpoint
Final submission shall call the existing `POST /rest/site/result/submit` endpoint (`TaskFunctions.resultSubmission` / `ResultsSubmitCommand`), supplying the fixture path, final scores, the AI report text, and the signed-in user ID. No new result-writing path is introduced.
**Verify:** The client POSTs a `ResultsSubmitCommand` payload to `/rest/site/result/submit`; server result/table/stats side effects reuse the existing flow.

#### AR-5.2: Match report via the existing DeepSeek pattern
Match report generation shall be a new function in `DeepSeekResultsSummary.ts` (e.g. `generateMatchReport`) following the same prompt/model/key pattern as the roundup functions, returning Markdown. It is exposed via a `POST /rest/site/quiz/report` endpoint, which the client calls before submitting the result.
**Verify:** The report generator uses the shared DeepSeek key/model resolution and returns Markdown text.

---

## Data Requirements

### Parsed quiz JSON (server → client)
The contract returned by Feature 2, used verbatim by Features 3–4:

```json
{
  "rounds": [
    {
      "round": "Round Name",
      "subjects": ["Subject 1", "Subject 2"],
      "questions": [
        { "number": "1A", "question": "...", "answer": "..." }
      ]
    }
  ]
}
```

- `round` — verbatim round name.
- `subjects` — present only when the round name contains "Individual"; subject headings in document order.
- `questions[].number` — verbatim question number (`1A`, `1B`, `2A`, `1`, or empty for tiebreak).
- `questions[].question` / `questions[].answer` — verbatim text including punctuation, accents, and parenthetical notes.

### Parsing prompt (fixed, server-side)
```
Extract all quiz questions and answers from the PDF at [URL] and return them as JSON.

Use this exact nested structure:
{
  "rounds": [
    {
      "round": "Round Name",
      "subjects": ["Subject 1", "Subject 2"],
      "questions": [
        {
          "number": "1A",
          "question": "...",
          "answer": "..."
        }
      ]
    }
  ]
}

Rules:
- Preserve round names exactly as printed in the PDF.
- If a round name contains the word "Individual", add a "subjects" array listing the subject headings in the order they appear in the document. Do not add "subjects" to other rounds.
- Preserve question numbers exactly (e.g. 1A, 1B, 2A; some sections may use 1, 2, 3; tiebreak may have an empty number).
- Copy question and answer text verbatim, including punctuation, accents, special characters, and parenthetical pronunciations or notes.
- Include every section: main rounds, spares, beer round, tiebreak, etc.
- Output only valid JSON. Do not include markdown, commentary, or extra text.
- If the PDF cannot be accessed, reply that it could not be retrieved and ask for an accessible URL or the raw text.
```

`[URL]` is replaced at request time with the decrypted quiz content as extracted text (DeepSeek is text-only — see AR-2.2).

### Match session (in-memory, ephemeral)
- `fixture` — selected `Fixture` (path, home/away teams, date).
- `players` — player names per team.
- `parsedQuiz` — the parsed JSON above.
- `categoryAssignments` — per individual round, mapping category → contestant for each team.
- `jokers` — per individual round, joker category per team.
- `questionOutcomes` — per question: outcome (correct | bonus | unanswered); replaced questions are marked void (FR-4.9).
- `spares` — the two spare sets (A and B) and which spare has been invoked for each voided question.
- `beerRoundScore` — per-team beer-round score (recorded, non-scoring for the main result).
- `scores` — derived running home/away score.

## Integration Points
- **Wix scrape:** `https://pantscat69er.wixsite.com/chiltern` → subpage → `filesusr.com/ugd/*.pdf`.
- **DeepSeek API:** `https://api.deepseek.com/chat/completions` (existing `DeepSeekResultsSummary.ts` on the `use_deepseek_ai` branch); `response_format: { type: 'json_object' }` for parsing.
- **PDF decryption:** `pdfjs-dist` (`getDocument({ data, password })`).
- **Result submission:** `POST /rest/site/result/submit` → `TaskFunctions.resultSubmission` → `ResultsSubmitCommand`.
- **Auth:** `useUserStore` (signed-in user) and `authGuard` (route protection).

## Related Specs

| Spec | Relationship | Affected Requirements |
|------|-------------|---------------------|
| Spec 20260507-103000: Results Submission | **Extends** — reuses its result submission endpoint, `Result`/`Report`/`Text` writing, and league-table/stats side effects for the final submit step | Feature 5 |

## Constraints
- The quiz PDF uses standard PDF open-password encryption (AES-128, R4/V4). The password is supplied by the QM per session and is never persisted.
- No native binaries are added to the server bundle; decryption uses `pdfjs-dist`. DeepSeek is text-only, so the parse input is always extracted text (no PDF `inline_data` option).
- Scraping uses plain HTTP; the Wix button date may appear as `DD/MM/YY` or `DD/MM/YYYY`.
- Scores are non-negative integers; the running total is derived solely from recorded question outcomes.
- The question master is a member of a team; the existing `resultSubmission` flow (`teamForUser`) requires this and attributes the submitted report to that team.

## Out of Scope
- Persisting a resumable match session to Firestore (session is in-memory only).
- Editing parsed question/answer text (re-parse only).
- Scoring the tiebreak section (parsed and viewable, but not scored). Spares are in scope as replacements within the main quiz (FR-4.9); the beer round is recorded separately and does not affect the main result (FR-4.10).
- Player/team statistics derived from per-question records (per-question data feeds the report only).
- Adding the section to the site navigation menu.
- Push/email notifications of the result.

## Spec Completeness Checklist

- [x] **Scope & acceptance criteria** — Features 1–5 define scope with per-FR `Verify` acceptance lines; A/B ownership (FR-3.5), individual-round contestant mapping (FR-4.4), and the 10-round structure (FR-4.1) are explicit.
- [x] **Testing strategy** — FR `Verify` lines plus AR-4.1 unit tests for scoring; server acquisition/parse tests follow `server/src/endpoint/__tests__` patterns. A sample encrypted PDF (`9af7f9_e4dda457ca82493aa0af73422217d404.pdf`, the 13-Oct-2026 paper, AES-128, 7 pages) is available as a test fixture; its decrypt password is supplied via a test environment variable, not committed to the repo.
- [x] **Existing patterns** — Reuses `SiteEndpoints` routing, `DeepSeekResultsSummary` DeepSeek client (from the `use_deepseek_ai` branch), `TaskFunctions.resultSubmission`, `useUserStore`/`authGuard`, and Pinia store conventions.
- [x] **Dependencies** — One new dependency (`pdfjs-dist`) justified for decryption; `pdf-lib` explicitly ruled out (no decryption support). DeepSeek/axios/firebase already present (DeepSeek client on the `use_deepseek_ai` branch).
- [x] **Architecture & interfaces** — New `POST /rest/site/quiz/acquire` endpoint and `/quizmaster` route specified; parsed-JSON contract and `ResultsSubmitCommand` reuse defined.
- [x] **Error handling & failure modes** — FR-1.3 distinguishes quiz-not-found/download-failed/incorrect-password; AR-2.3 rejects invalid parse responses with retry.
- [x] **Security review** — Auth-guarded route (AR-3.1) following the existing client-side auth pattern (no server-side token verification, per AR-1.3); password never persisted or logged and never echoed in errors (FR-1.2); scraped PDF URL origin is validated (FR-1.1); submitter is the signed-in user (FR-5.1). The question master is assumed to be a team member, matching the existing `resultSubmission` report-attribution semantics (see Constraints).
- [x] **Performance impact** — Scraping/download/decrypt/parse are per-session, server-side, and one-shot at match start; scoring is client-side and constant-time. DeepSeek latency is acceptable at setup and submit time only.
- [x] **Rollout & migration** — No data-model changes; the route is hidden from menus so rollout is invisible except to direct links. No migration required.
- [x] **Assumptions & risks** — Assumes 4 players per team and that the number of individual-round subjects matches players; assumes the question master is a team member (see Constraints); assumes Wix HTML remains server-rendered; risk that text extraction loses layout (DeepSeek is text-only, so no PDF fallback — mitigated by `pdfjs-dist` reading order and the prompt's verbatim-copy rules); risk that the Wix button date format or PDF URL hash changes week to week (mitigated by date matching and by scraping the current page each time).
