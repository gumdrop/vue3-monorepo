# Question Master

This document describes the experimental Question Master tool in the QuizLeague website.

## Overview

The Question Master (QM) section lets a signed-in user run a whole quiz match from one screen. The server scrapes the question writer's Wix site for the weekly password-protected quiz PDF, decrypts it using a password the QM supplies, parses it deterministically into an ordered JSON structure, and the client presents questions one at a time while recording outcomes and tracking the score. At the end the QM submits the result (reusing the existing results-submission pipeline) with a DeepSeek-generated match report.

The section is experimental and hidden from site navigation. It is reachable at `/quizmaster` and is guarded by `authGuard`.

A match in progress is resumable: progress is persisted per fixture (shared by any team member who opens the same fixture), so an equipment failure or restart offers the question master a chance to re-enter the password and continue from the same round/question. The parsed paper and the password are never persisted (see ADR-007).

## Match rules encoded

- 10 scored rounds (rounds 3 and 8 are individual rounds; the rest are team rounds).
- Team rounds: 2 points for a correct answer by the owning team, 1 point to the opposition for a converted bonus, 0 unanswered. A/B ownership swaps between halves.
- Individual rounds: contestants are assigned to categories; the same correct/bonus/unanswered scoring applies; a team's joker on a category doubles its correct-answer values (2→4 primary, 1→2 bonus).
- Spares (A and B sets) replace disputed questions.
- Beer round (20 questions) is recorded separately and does not affect the main result.

## Key files

| File | Purpose |
|------|---------|
| `server/src/endpoint/QuizMasterFunctions.ts` | Wix scrape, PDF download/decrypt, orchestration |
| `server/src/endpoint/QuizParser.ts` | Deterministic PDF structure parsing + template-drift validation |
| `server/src/endpoint/DeepSeekResultsSummary.ts` | `generateMatchReport` (shared DeepSeek client) |
| `server/src/endpoint/QuizMasterEndpoints.ts` | `POST /rest/site/quiz/acquire` and `/rest/site/quiz/report` |
| `client/src/stores/quizmaster.ts` | Match session state (in-memory) + persistence/resume orchestration |
| `client/src/services/QuizMasterSession.ts` | Firestore save/load/clear of a resumable session (paper excluded) |
| `client/src/services/QuizScoring.ts` | Pure scoring rules (ownership, half swap, bonuses, jokers) |
| `client/src/site/components/quizmaster/*` | Setup, review, match, and result views |

## Introduced by
- Spec `20261017-101852-question-master` (Question Master)

## Related
- Results Submission (Spec `20260507-103000`) — final submission reuses its `POST /rest/site/result/submit` flow.
- Authentication (`spec/docs/auth.md`) — access is controlled via `authGuard` and the signed-in user.
