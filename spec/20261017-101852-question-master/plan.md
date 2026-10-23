# Plan: Question Master (Spec 20261017-101852)

## Overview
Implement an experimental, auth-only Question Master tool. Server scrapes the Wix site for the weekly quiz PDF, decrypts it (password supplied by the QM), parses it to JSON with DeepSeek, and the client presents questions one at a time while tracking scores (team rounds, individual rounds, jokers, spares, beer round) and finally submits the result with a DeepSeek-generated match report.

This work is on branch `experimental_qm_assistance`, which already contains the DeepSeek client (`server/src/endpoint/DeepSeekResultsSummary.ts`).

## Verified inputs
- Sample encrypted PDF: `~/Downloads/9af7f9_e4dda457ca82493aa0af73422217d404.pdf` (AES-128, 7 pages; password supplied via test env var, never committed).
- PDF structure confirmed: ROUND ONE–TEN; ROUND THREE & EIGHT are "INDIVIDUAL – PICK A SUBJECT" (4 subjects, questions `1A/1B`–`4A/4B`); `SPARES A & B`; `TWENTY SPARE QUESTIONS – BEER ROUND`; `TIEBREAK`.
- Individual-round subject mapping: question number prefix `1`→subject[0], `2`→subject[1], … (confirmed from the PDF's FILMS/ENGLISH GEOGRAPHY/FORMER COINS/AUTOMOTIVE ENGINEERS ordering).

---

## 1. Task Breakdown

### T1 — Commit the encrypted test fixture
- **Subject:** Add the sample encrypted PDF as a committed test fixture (no password in repo).
- **Description:** Copy the sample PDF into `server/src/endpoint/__tests__/fixtures/quiz-2026-10-13.pdf`. Add a test helper that reads the decrypt password from an env var (`QUIZ_PDF_TEST_PASSWORD`) or a gitignored file; add the password file pattern to `.gitignore`. The password value is never committed.
- **Dependencies:** none
- **Files:**
  - `server/src/endpoint/__tests__/fixtures/quiz-2026-10-13.pdf` (Create)
  - `server/src/endpoint/__tests__/quizFixture.ts` (Create — password loader)
  - `.gitignore` (Modify — ignore test-password file)

### T2 — Shared types for quiz JSON and commands
- **Subject:** Add parsed-quiz and command types to `shared`.
- **Description:** Define the parse contract (`QuizPaper`, `QuizRound`, `QuizQuestion`) and the acquire/report commands. Export them from `shared/src/index.ts`.
  - `QuizQuestion { number: string; question: string; answer: string }`
  - `QuizRound { round: string; subjects?: string[]; questions: QuizQuestion[] }`
  - `QuizPaper { rounds: QuizRound[] }`
  - `QuizAcquireCommand { fixtureDate: string; password: string }`
  - `QuizReportCommand` — match data for report generation (teams, scores, outcomes, jokers, beer round).
- **Dependencies:** none
- **Files:**
  - `shared/src/quiz/QuizPaper.ts` (Create)
  - `shared/src/command/QuizAcquireCommand.ts` (Create)
  - `shared/src/command/QuizReportCommand.ts` (Create)
  - `shared/src/index.ts` (Modify — export new types)

### T3 — DeepSeek parse and match-report functions
- **Subject:** Add `parseQuiz` and `generateMatchReport` to the existing DeepSeek client.
- **Description:** In `server/src/endpoint/DeepSeekResultsSummary.ts`, add:
  - `parseQuiz(text)` — sends the fixed parsing prompt (see spec Data Requirements) with `[URL]` replaced by the extracted text, `response_format: { type: 'json_object' }`, validates the response against `QuizPaper` shape, and returns it (throw a typed error on invalid/missing `rounds`).
  - `generateMatchReport(input)` — Markdown report following the existing `generateFixtureSetResultsSummary` pattern.
  - Both reuse the existing `deepseekApiKey()`/`deepseekModel()` and chat-completions call.
- **Dependencies:** T2
- **Files:**
  - `server/src/endpoint/DeepSeekResultsSummary.ts` (Modify)
  - `server/src/endpoint/__tests__/DeepSeekQuiz.test.ts` (Create)

### T4 — Server acquisition module (scrape + decrypt)
- **Subject:** Implement Wix scraping and PDF decryption.
- **Description:** In a new `server/src/endpoint/QuizMasterFunctions.ts`:
  - `resolveQuizPdfUrl(fixtureDate)` — `fetch` the Wix home page, find the `Quiz for <date>` link (accept `DD/MM/YY` and `DD/MM/YYYY`), follow to the subpage, extract the `filesusr.com/ugd/*.pdf` URL, and validate the host is `filesusr.com` and the path ends `.pdf`.
  - `decryptQuizText(pdfBytes, password)` — use `pdfjs-dist` `getDocument({ data, password })` and `getTextContent` to return extracted text.
  - `acquireQuiz(command)` — orchestrate resolve → download → decrypt → `parseQuiz`, returning the `QuizPaper`; map failures to the typed errors (quiz-not-found / download-failed / incorrect-password / parse-failed).
  - Add `pdfjs-dist` as a server dependency.
- **Dependencies:** T1 (fixture), T2 (types), T3 (parse)
- **Files:**
  - `server/src/endpoint/QuizMasterFunctions.ts` (Create)
  - `server/src/endpoint/__tests__/QuizMasterFunctions.test.ts` (Create)
  - `server/package.json` (Modify — add `pdfjs-dist`)

### T5 — Server endpoints
- **Subject:** Add `/rest/site/quiz/acquire` and `/rest/site/quiz/report`.
- **Description:** New `server/src/endpoint/QuizMasterEndpoints.ts` with `configure(app)`:
  - `POST /rest/site/quiz/acquire` → `acquireQuiz`
  - `POST /rest/site/quiz/report` → `generateMatchReport`
  - Wire `configureQuizMaster(app)` in `server/src/index.ts`.
  - **Auth (AR-1.3):** follow the existing site pattern — client route guarded with `authGuard`; the endpoints trust the client-supplied signed-in user (as `result/submit` does). No server-side token verification in this version.
- **Dependencies:** T3, T4
- **Files:**
  - `server/src/endpoint/QuizMasterEndpoints.ts` (Create)
  - `server/src/index.ts` (Modify — register `configureQuizMaster`)
  - `server/src/endpoint/__tests__/QuizMasterEndpoints.test.ts` (Create)

### T6 — Client scoring service (pure, unit-tested)
- **Subject:** Extract scoring rules into a pure module.
- **Description:** `client/src/services/QuizScoring.ts` with pure functions:
  - A/B team ownership per round number (half swap at round 6; default home = A in half 1).
  - `applyOutcome` — correct `+2` to owner, bonus `+1` to other, unanswered `0`, with joker doubling (primary `2→4`, bonus `1→2`) when the question's category equals the scoring team's joker category.
  - `subjectForQuestion` — map an individual-round question's numeric prefix to its `subjects` index.
  - Unit tests cover team/individual rounds, half swap, joker doubling, and subject mapping (using the confirmed PDF ordering).
- **Dependencies:** T2 (types)
- **Files:**
  - `client/src/services/QuizScoring.ts` (Create)
  - `client/src/services/__tests__/QuizScoring.spec.ts` (Create)

### T7 — Client quizmaster store
- **Subject:** Pinia store for session state.
- **Description:** `client/src/stores/quizmaster.ts` holding in-memory state and actions: fixture selection, players, parsed quiz, category assignments, jokers, question outcomes, spares state, beer-round scores, derived running score; actions `acquire`, `recordOutcome`, `undo`, `invokeSpare`, `recordBeerRound`, `generateReport`, `submit`. Reuses `useUserStore` for the signed-in user and `submitResult` from `FixtureService` for submission.
- **Dependencies:** T2, T6
- **Files:**
  - `client/src/stores/quizmaster.ts` (Create)

### T8 — Client route + setup/review views
- **Subject:** Route and match-setup/review screens.
- **Description:** Add `/quizmaster` route with `beforeEnter: authGuard` in `client/src/site/router/index.ts` (not in any menu). Create setup view (fixture selection + password + acquire; FR-3.1/3.2/3.5) and parse review view (FR-2.4: inspect rounds/questions, re-parse).
- **Dependencies:** T7
- **Files:**
  - `client/src/site/router/index.ts` (Modify)
  - `client/src/site/components/quizmaster/QuizMasterMain.vue` (Create)
  - `client/src/site/components/quizmaster/QuizMasterSetup.vue` (Create)
  - `client/src/site/components/quizmaster/QuizMasterReview.vue` (Create)

### T9 — Client match view (presentation, scoring, spares, beer round)
- **Subject:** The live match screen.
- **Description:** One-question-at-a-time presentation in order (FR-4.1); team-round attribution (FR-4.2/4.3); individual-round category assignment + joker declaration (FR-3.3/3.4) with collapsed-but-viewable categories (FR-4.6); contestant annotation + A/B→category mapping (FR-4.4); joker doubling (FR-4.5); answer reveal (FR-4.7); undo (FR-4.8); spare invocation from A/B sets (FR-4.9); beer round (20 questions, recorded, non-scoring, FR-4.10).
- **Dependencies:** T7, T6
- **Files:**
  - `client/src/site/components/quizmaster/QuizMasterMatch.vue` (Create)
  - `client/src/site/components/quizmaster/IndividualRoundSetup.vue` (Create)
  - `client/src/site/components/quizmaster/QuestionCard.vue` (Create)
  - `client/src/site/components/quizmaster/BeerRound.vue` (Create)

### T10 — Client result view (report + submit)
- **Subject:** Match report and submission.
- **Description:** Generate the Markdown report via `POST /rest/site/quiz/report`, preview it, then submit the final `homeScore`/`awayScore` + report through the existing result submission path (`POST /rest/site/result/submit`, submitter = signed-in user). Show confirmation and clear the session (FR-5.x).
- **Dependencies:** T7, T5
- **Files:**
  - `client/src/site/components/quizmaster/QuizMasterResult.vue` (Create)

---

## 2. File Impact Assessment

| File | Action | Description |
|------|--------|-------------|
| `.gitignore` | Modify | Ignore the gitignored test-password file |
| `server/src/endpoint/__tests__/fixtures/quiz-2026-10-13.pdf` | Create | Encrypted sample PDF test fixture |
| `server/src/endpoint/__tests__/quizFixture.ts` | Create | Loads test password from env var |
| `shared/src/quiz/QuizPaper.ts` | Create | `QuizPaper`/`QuizRound`/`QuizQuestion` types |
| `shared/src/command/QuizAcquireCommand.ts` | Create | Acquire request type |
| `shared/src/command/QuizReportCommand.ts` | Create | Report request type |
| `shared/src/index.ts` | Modify | Export new types |
| `server/src/endpoint/DeepSeekResultsSummary.ts` | Modify | Add `parseQuiz` and `generateMatchReport` |
| `server/src/endpoint/__tests__/DeepSeekQuiz.test.ts` | Create | Parse/report tests |
| `server/src/endpoint/QuizMasterFunctions.ts` | Create | Wix scrape + PDF decrypt + orchestration |
| `server/src/endpoint/__tests__/QuizMasterFunctions.test.ts` | Create | Acquisition/decrypt tests (uses fixture) |
| `server/src/endpoint/QuizMasterEndpoints.ts` | Create | New REST endpoints |
| `server/src/index.ts` | Modify | Register `configureQuizMaster` |
| `server/src/endpoint/__tests__/QuizMasterEndpoints.test.ts` | Create | Endpoint tests |
| `server/package.json` | Modify | Add `pdfjs-dist` |
| `client/src/services/QuizScoring.ts` | Create | Pure scoring functions |
| `client/src/services/__tests__/QuizScoring.spec.ts` | Create | Scoring unit tests |
| `client/src/stores/quizmaster.ts` | Create | Session store |
| `client/src/site/router/index.ts` | Modify | Add `/quizmaster` route (authGuard) |
| `client/src/site/components/quizmaster/QuizMasterMain.vue` | Create | Section orchestrator/wizard |
| `client/src/site/components/quizmaster/QuizMasterSetup.vue` | Create | Fixture/password/acquire + players |
| `client/src/site/components/quizmaster/QuizMasterReview.vue` | Create | Parse review + re-parse |
| `client/src/site/components/quizmaster/QuizMasterMatch.vue` | Create | Live match screen |
| `client/src/site/components/quizmaster/IndividualRoundSetup.vue` | Create | Category assignment + joker |
| `client/src/site/components/quizmaster/QuestionCard.vue` | Create | Question + outcome + answer reveal |
| `client/src/site/components/quizmaster/BeerRound.vue` | Create | Beer round (20 questions) |
| `client/src/site/components/quizmaster/QuizMasterResult.vue` | Create | Report preview + submit + confirm |

---

## 3. Testing Strategy

### Unit Tests
- **Scoring (`client/src/services/__tests__/QuizScoring.spec.ts`)** — correct/bonus/unanswered in team and individual rounds; half swap at round 6; joker doubling (primary 2→4, bonus 1→2); subject-from-number mapping using the confirmed FILMS/ENGLISH GEOGRAPHY/FORMER COINS/AUTOMOTIVE ENGINEERS ordering.
- **Parse (`server/src/endpoint/__tests__/DeepSeekQuiz.test.ts`)** — fixed prompt built correctly; `[URL]` substituted with extracted text; `response_format` is `json_object`; response validated (missing `rounds` rejected). DeepSeek HTTP call mocked.
- **Acquisition (`server/src/endpoint/__tests__/QuizMasterFunctions.test.ts`)** — `resolveQuizPdfUrl` with stubbed HTML (both date formats, missing button, non-`filesusr.com` URL rejected); `decryptQuizText` against the committed fixture with the env-var password (wrong password → typed error); `acquireQuiz` orchestration with mocked scrape/DeepSeek.
- **Endpoints (`server/src/endpoint/__tests__/QuizMasterEndpoints.test.ts`)** — request/response shape and error mapping for `/quiz/acquire` and `/quiz/report`.

### Integration Tests
- **End-to-end decrypt+parse** — run `decryptQuizText` on the committed fixture, then `parseQuiz` against a mocked/recorded DeepSeek response to assert the `QuizPaper` shape and round ordering (10 rounds, 2 individual, spares A/B, beer round, tiebreak).

### Manual Verification
- Navigate to `/quizmaster` signed-in; acquire the 13-Oct-2026 paper; run a full match exercising a team round, an individual round with joker, a spare replacement, and the beer round; confirm the submitted result matches the main-quiz score and the report references the beer-round score.
- Confirm the route is absent from all menus and blocked when signed out.

---

## 4. Execution Sequence

**Phase 0 — Parallel (independent):**
- T1 (fixture), T2 (types), T6 (scoring) can all start immediately.

**Phase 1:**
- T3 (DeepSeek parse/report) ← after T2
- T4 (acquisition) ← after T1, T2, T3

**Phase 2:**
- T5 (endpoints + auth) ← after T3, T4
- T7 (store) ← after T2, T6

**Phase 3:**
- T8 (route + setup/review) ← after T7
- T9 (match view) ← after T7, T6
- T10 (result view) ← after T7, T5

**Parallelism:** T8/T9/T10 are independent of each other once T7 is done (and T10 additionally needs T5). T3 and T4 are sequential to each other; T5 blocks T10.

---

## Notes / Risks
- **Auth follows the existing client-side pattern** (AR-1.3 relaxed): the `/quizmaster` route is `authGuard`-guarded, and the new endpoints trust the client-supplied user, matching `result/submit`. Server-side token verification is deferred and may be revisited later.
- **Individual-round subject mapping** relies on question-number prefix → `subjects` index (confirmed from the sample PDF). The parse does not emit a per-question subject field; if this proves fragile, enhance the parse prompt (out of scope for now).
- **DeepSeek JSON mode** requires the prompt to contain the word "json" — the fixed prompt already does ("return them as JSON"), so `response_format: { type: 'json_object' }` is compatible.
- **`pdfjs-dist` in Node** should use the legacy build (`pdfjs-dist/legacy/build/pdf.mjs`) for `getDocument`/`getTextContent`; verify esbuild bundling (AR-1.2) when adding it.
- **Do not commit the quiz PDF password** anywhere; tests read it from `QUIZ_PDF_TEST_PASSWORD` (or a gitignored file).
