# Architectural Decision Records: question-master

## ADR-001: Ship a companion `pdf.worker.mjs` alongside the server bundle
- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** AR-1.2 requires `pdfjs-dist` decryption while keeping the esbuild bundle deployable. At runtime pdfjs loads its worker via a dynamic `import(this.workerSrc)` that resolves relative to the bundled `main.cjs`; the worker is not statically bundled because the import specifier is a runtime variable.
- **Decision:** Keep `pdfjs-dist` bundled, and copy `node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs` into `server/deploy/` as part of the server `build` script. The default `workerSrc` (`./pdf.worker.mjs`) then resolves next to `main.cjs`.
- **Rationale:** Preserves the existing single-directory App Engine deploy without pulling in `node_modules`; avoids native binaries.
- **Consequences:** The deploy is no longer a single file — it is `main.cjs` plus `pdf.worker.mjs`. The build script now runs a small `node -e` copy step.

## ADR-002: Use the pdfjs-dist legacy build
- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** The server bundle emits CommonJS (`main.cjs`). The modern pdfjs-dist entry (`build/pdf.mjs`) relies on top-level await / modern module features that complicate CJS bundling; the legacy build is designed for broader environments and does not use top-level await.
- **Decision:** Import from `pdfjs-dist/legacy/build/pdf.mjs`.
- **Rationale:** Verified decryption + text extraction works in both vitest and a CJS esbuild bundle.
- **Consequences:** Tied to the legacy build path in the source and in the `require.resolve` used by the build copy step.

## ADR-003: Manual fixture selection in v1
- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** FR-3.1 requires the QM to select the fixture. A full fixture-browser UI (season → competition → fixture set → fixture) is substantial and this is an experimental section.
- **Decision:** The setup view accepts the fixture path, home/away team names, and fixture date as text fields rather than a browsable picker. The fixture path is used directly for result submission.
- **Rationale:** Gets an end-to-end experimental flow working quickly; can be replaced with a proper picker later.
- **Consequences:** The QM must obtain the Firestore fixture path manually (e.g. from the existing results-submission flow or the maintain app).

## ADR-004: Known v1 UI gaps
- **Date:** 2026-10-17
- **Status:** Superseded
- **Context:** Two minor FR details are not fully surfaced in the first UI pass.
- **Decision:** (1) FR-4.6 — the individual-round category list is collapsed after assignment but has no explicit mid-round "view assignments" toggle yet; assignments remain visible in the round setup step and in question annotations. (2) FR-5.3 — the session state is not explicitly cleared after a successful submit.
- **Rationale:** Accepted for the experimental first cut; neither affects scoring or submission correctness.
- **Consequences:** These are follow-up polish items.
- **Resolution (2026-10-24):** Both gaps closed. `QuizMasterMatch.vue` now shows a collapsed "View assignments & jokers" panel during individual rounds (FR-4.6), and the store clears recorded match data on a successful submit while snapshotting the confirmation values, with a "Run another match" action to fully reset (FR-5.3).

## ADR-005: Deterministic structure parsing replaces DeepSeek for quiz extraction
- **Date:** 2026-10-18
- **Status:** Accepted
- **Context:** Feature 2 originally parsed the quiz PDF into JSON with DeepSeek. The question paper is a rigid Word-generated table (number | question | answer columns, `ROUND`/`SPARES`/`BEER`/`TIEBREAK` headers), so structure extraction is a deterministic layout problem, not a generative one. AI parsing risked hallucination, API cost/latency, and prompt drift.
- **Decision:** Parse the PDF deterministically in `server/src/endpoint/QuizParser.ts` using pdfjs text-item positions and the existing underline detection, emitting the same `QuizPaper` JSON contract. DeepSeek is retained only for the generative match report (`generateMatchReport`).
- **Rationale:** Verified against the committed fixture — reconstructs all 13 sections (10 rounds, individual rounds 3 & 8 with subjects, spares A/B, beer round, tiebreak) and preserves answer underlining.
- **Consequences:** `parseQuiz`/`validateQuizPaper`/`buildQuizParsePrompt` and the parsing prompt were removed from `DeepSeekResultsSummary.ts`. `acquireQuiz` now calls `parseQuizPaper` directly. Column x-boundaries (50 / 420) assume the current Word template; a validation pass can flag drift later.
- **Resolution (2026-10-24):** The drift guard is now implemented — `QuizParser.assertColumnLayout` rejects items whose x-positions don't match the three-column layout, and `assertParsedPaper` rejects implausible papers (no rounds, no numbered questions, or a majority of numbered questions missing text). Both throw a 502 `Quiz template changed` error rather than silently returning a mangled paper.

## ADR-006: Commit the sample-paper fixture password
- **Date:** 2026-10-24
- **Status:** Accepted
- **Context:** The original plan treated the sample PDF's decrypt password as a secret and kept it out of the repo (env var or gitignored file). That made the committed parser tests un-runnable without a local secret.
- **Decision:** Commit `server/src/endpoint/__tests__/fixtures/quiz-password.txt`, which decrypts the 13-Oct-2026 sample paper only. The `QUIZ_PDF_TEST_PASSWORD` env override is retained for future fixture swaps.
- **Rationale:** A past paper's password is not a live secret; it is test data. The per-week password a question master supplies at runtime remains never-persisted (FR-1.2).
- **Consequences:** Tests are self-contained; `.gitignore` no longer excludes the fixture password. The spec/plan's "never commit the password" wording applies to the live per-week password, not this sample fixture.
