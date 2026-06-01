Copilot instructions for this repository

Purpose

- This repository is a TypeScript monorepo for QuizLeague: a `client/` (Vue 3 + TypeScript), `server/` (Node + TypeScript) and `shared/` packages. Keep changes minimal and consistent with existing patterns.

What helps

- Prefer small, focused suggestions rather than large, sweeping changes.
- Stick to TypeScript types and the existing coding style (composition API in Vue, explicit exported types where practical).
- Run or update unit tests for behavioral changes. Tests live alongside code (e.g., `client/src/services/__tests__`).

Formatting & linting

- Follow the repo's ESLint and TypeScript settings. Don't introduce new formatting rules. Use existing formatters rather than novel styles.

Dependencies

- Avoid adding new dependencies unless necessary. If a new utility is required, prefer lightweight packages and add an explanatory comment.

Nested Entities

- season -> competition -> fixtures -> fixture -> result -> report
- season -> competition -> leaguetable

APIs & public surface

- When changing public/shared APIs (anything under `shared/` or exported from `server/`/`client/`), keep backward compatibility or provide a clear migration note in the commit message.

Testing & verification

- After code changes, run TypeScript checks, unit tests, and a test coverage check for the affected package:
  - Client: `cd client && npm install && npm run dev` (or `npm run test` for tests)
  - Server: `cd server && npm install && npm run dev` (or run tests similarly)
  - Type-check: `npx tsc -p client/tsconfig.json` (or the relevant tsconfig)
- If a coverage check cannot be run, explicitly document the reason and any residual risk.

Style preferences

- Use `async/await` for asynchronous code. Prefer clear variable names and avoid one-letter names.
- Keep functions small and single-responsibility. Extract helpers into appropriate `dao/`, `services/` or `utils/` folders.
- Use existing converters/utilities (e.g., `DataConverter`, `GenericConverter`) rather than duplicating logic.

When in doubt

- Search the repo for existing patterns before creating new files or patterns.
- Review `data-model.md` for the repo's entity and data architecture.
- If a suggestion would restructure many files or add new tools, propose the change in an issue/PR rather than applying it silently.

Contact

- If more context is needed, review `README.md` and the package-level `tsconfig` and `package.json` files.

Thank you for producing concise, repo-consistent suggestions.
