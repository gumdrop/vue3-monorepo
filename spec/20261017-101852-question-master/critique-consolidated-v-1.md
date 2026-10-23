# Spec 20261017-101852: Consolidated Critique (v1)

## Overview
**Critiques received from:** Claude (written directly in-session).
**Critiques missing:** Gemini — CLI failed with `IneligibleTierError` (free-tier Gemini Code Assist client is no longer supported). Codex — not installed on this machine. Both were attempted; only Claude's critique is available.

## Executive Summary
The spec is architecturally well-grounded and the domain rules (scoring, joker, parse contract, Wix scrape/decrypt) are captured correctly. Four items need resolution before implementation, in priority order:

1. **Neutral QM vs the existing result-submission report path** — `TaskFunctions.resultSubmission` calls `teamForUser(user)` and throws if the submitter has no team, and attributes the `Report` to the submitter's team. A neutral question master submitting a neutral AI report likely breaks this. This affects AR-5.1 and the data model.
2. **A/B ownership and half-swap determinism** — the system never states how the initial A/B assignment is made (default home=A in half 1?).
3. **Individual-round primary-contestant mapping** — the A/B suffix → team → contestant rule is implied but not stated.
4. **Scored-round count** — 10 total (3 and 8 individual) vs 10 team + 2 individual must be confirmed.

## Consolidated Requirements Feedback

### Feature 3 — Match Setup
**Issue:** A/B initial assignment and individual-round contestant mapping are undefined.
**Agreement:** n/a (single critique).
**Divergence:** n/a.
**Recommendation:** Add a setup FR designating the A team for half 1 (default home=A) with automatic swap at round 6, and state that in individual rounds an "A"-suffixed question is primary for the A-team's contestant in that category (B → B-team), passing to the opposing contestant on a wrong answer.

### Feature 5 — Result Submission and AI Match Report
**Issue:** Reusing `resultSubmission` may throw for a team-less QM and misattributes a neutral report.
**Agreement:** n/a.
**Divergence:** n/a.
**Recommendation:** Either submit scores with `reportText` omitted and store the AI report as a top-level `Text` referenced from the result, or explicitly extend the existing flow to support a neutral report. Do not leave as a checklist note.

### Security
**Issue:** No server-side auth on the new endpoint, no origin validation on the scraped PDF URL, and password logging is not prohibited.
**Agreement:** n/a.
**Divergence:** n/a.
**Recommendation:** Require server-side auth on `POST /rest/site/quiz/acquire`; validate the scraped URL host is `filesusr.com`/Wix and ends in `.pdf`; state the password is HTTPS-only, never logged, never echoed.

## Additional Requirements Identified
1. **Answer visibility** — FR needed: after an outcome is recorded, show the QM the answer text; advance to the next question only on explicit QM action.
2. **Undo** — define "undo last outcome" or move to Out of Scope.
3. **Fixture selection** — clarify the QM selects a `Fixture`; its parent `Fixtures.date` is the acquisition date.
4. **Team-size vs subjects mismatch** — state behavior when a team has fewer/more players than categories.

## Ambiguities Requiring Clarification
- Scored-round count and where spares/beer/tiebreak sit relative to the scored rounds.
- Whether the QM is guaranteed to be a team member (drives item 1 above).
- Parse input: pdfjs text extraction (recommended) vs qpdf+`inline_data` (fallback) — pick one for the v1 acceptance test.

## Summary of Required Changes
1. Add A/B initial-assignment FR (default home=A, swap at round 6).
2. Add individual-round primary-contestant mapping rule (A/B suffix → team → contestant).
3. Resolve the neutral-QM result/report path (AR-5.1 + data model).
4. Confirm the scored-round count (10 total, 3 and 8 individual).
5. Add answer-visibility FR and undo-or-out-of-scope statement.
6. Clarify fixture selection → parent `Fixtures.date` for acquisition.
7. Add server-side auth + PDF-URL origin validation + password no-logging.
8. Add team-size vs subjects edge case.
