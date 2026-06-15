# QuizLeague Website

TypeScript monorepo for the QuizLeague public website, REST backend, shared domain model, and data maintenance app.

## Repository Map

- `client/` - Vue 3, Vite, Vuetify browser apps.
  - `/` is the public QuizLeague site.
  - `/maintain` is the authenticated data maintenance app.
- `server/` - Node.js, Express, Firestore-backed REST and task endpoints.
- `shared/` - shared TypeScript entities, commands, and utilities used by both client and server.
- `acceptance-tests/` - Playwright-BDD browser acceptance tests.
- `scripts/` - repository helper scripts, including emulator seeding and deployment YAML generation.
- `emulator-data/` - reusable Firestore emulator import/export data.

Read `project.md` before broad changes, `tech-stack.md` for package architecture, and `data-model.md` before changing persisted entities or Firestore paths.

## Prerequisites

- Node.js 22-compatible runtime.
- npm, using the root npm workspace.
- Java runtime for Firebase emulator usage.
- Google Cloud SDK for deployment.

Install the workspace dependencies from the repository root:

```sh
npm install
```

The acceptance-test package is outside the root workspace, so install it separately when needed:

```sh
cd acceptance-tests
npm install
```

## Local Development

Use separate terminals for the long-running processes.

Start Firestore locally:

```sh
npm run emulators:start
```

The emulator imports from `emulator-data/` on startup and exports back to that directory on exit. The configured local endpoints are:

- Firestore: `127.0.0.1:18080`
- Emulator UI: `http://127.0.0.1:14000/firestore`

Reset the emulator to the seeded development data set:

```sh
npm run seed:emulator
npm run emulators:export
```

Start the backend against the emulator:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:18080 npm run local -w server
```

The server listens on `http://localhost:8000` by default. Set `PORT` to override it.

Start the client:

```sh
npm run dev -w client
```

Vite serves the app at `http://localhost:5173` by default and proxies `/rest` calls to `http://localhost:8000`.

Useful local URLs:

- Public site: `http://localhost:5173/`
- Maintenance app: `http://localhost:5173/maintain/`
- REST API: `http://localhost:8000/rest/...`

The client automatically connects to the Firestore emulator on local hosts. Override the defaults with:

```sh
VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1
VITE_FIRESTORE_EMULATOR_PORT=18080
```

Server-side runtime variables used during local development and deployment:

- `FIRESTORE_EMULATOR_HOST` - enables local server access to the Firestore emulator.
- `FIREBASE_PROJECT_ID` - optional project id override; defaults to `chiltern-ql-firestore`.
- `GEMINI_API_KEY` - enables generated fixture-set and competition roundup summaries. If unset, the server also checks `gemini-api-key.txt` in the project root.
- `GEMINI_MODEL` - optional Gemini model override; defaults to `gemini-3.5-flash`.
- `SENDGRID_API_KEY` - required for contact email endpoints and deployment YAML generation.
- `CONTACT_CAPTCHA_SECRET` - optional stable signing secret for contact-form captcha tokens.

## Maintenance App

The maintenance app is a second Vite entry point at `client/src/maintain/index.ts`, with views under `client/src/maintain/views/`. It uses the same DAOs and shared entities as the public app, but routes under `/maintain/`.

Authentication is required. For local acceptance or development runs that need a bypass, start the client with:

```sh
VITE_MAINTAIN_AUTH_BYPASS=true npm run dev -w client
```

The bypass is limited to local hosts. Acceptance tests also need `ACCEPTANCE_MAINTAIN_AUTH_BYPASS=true`.

Subcollection entities should be edited through their parent views. For example, competitions, fixture sets, and league tables are maintained through season screens.

## Common Commands

Run package scripts from the repository root with npm workspace flags:

```sh
npm run dev -w client          # Vite dev server
npm run build -w client        # client type-check plus production build
npm run type-check -w client   # Vue/TypeScript checks
npm run test:unit -w client    # client Vitest
npm run lint -w client         # ESLint with autofix

npm run local -w server        # run server with tsx
npm run build -w server        # bundle server to server/deploy/main.cjs
npm run test:unit -w server    # server Vitest

npm run build -w shared        # shared TypeScript build
npm run test:unit -w shared    # shared Vitest

npm run test:coverage          # coverage for all workspaces that define it
```

For a focused change, run the checks for the affected package. For shared entity or API changes, run checks in both consumers as well as `shared/`.

## Acceptance Tests

Acceptance tests live in `acceptance-tests/` and use Playwright-BDD.

Start the emulator and client first:

```sh
npm run emulators:start
npm run dev -w client
```

Seed the emulator if the test data is stale or missing:

```sh
npm run seed:emulator
```

Run the suite:

```sh
cd acceptance-tests
npm test
```

The default base URL is `http://127.0.0.1:5173`. Override it when testing a preview build:

```sh
ACCEPTANCE_BASE_URL=http://127.0.0.1:4173 npm test
```

Maintenance acceptance tests require both sides of the auth bypass:

```sh
# terminal 1
VITE_MAINTAIN_AUTH_BYPASS=true npm run dev -w client

# terminal 2
cd acceptance-tests
ACCEPTANCE_MAINTAIN_AUTH_BYPASS=true npm test
```

See `acceptance-tests/README.md` for headed mode, generated reports, and dry-run generation.

## Firestore And Data Model

The production and emulator project id defaults to `chiltern-ql-firestore`. Server-side local Firestore access is enabled by setting `FIRESTORE_EMULATOR_HOST`; `FIREBASE_PROJECT_ID` can override the default project id.

Important data-model notes:

- Top-level and nested entity definitions live in `shared/src/entity/`.
- Client data access code lives under `client/src/dao/`.
- Server Firestore persistence uses `server/src/storage/Storage.ts` and `GenericConverter`.
- Update `data-model.md` when persisted entities, collections, or reference shapes change.

## Deployment

Build the deployable artifact:

```sh
npm run deployToProd
```

This script:

1. Builds the client.
2. Copies `client/dist` into `server/deploy/built`.
3. Bundles the server to `server/deploy/main.cjs`.
4. Writes `server/deploy/app.yaml`.

Deployment secrets:

- `gemini-api-key.txt` at the repository root is required for deployment YAML generation.
- `SENDGRID_API_KEY` must be set in the build environment.
- `GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash`.

Deploy to Google App Engine:

```sh
npm run deployToGcp
```

`server/deploy/app.yaml` is generated and should not be hand-maintained.

## Working Conventions

- Keep changes small and package-scoped where possible.
- Prefer existing DAOs, services, converters, and shared utilities over new patterns.
- Preserve backward compatibility when changing `shared/` exports or public REST behavior.
- Add or update tests with behavioral changes.
- Update `project.md`, `tech-stack.md`, or `data-model.md` when the architecture or data contract changes materially.
