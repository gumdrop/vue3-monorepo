# Acceptance Tests

Playwright + Cucumber acceptance tests for the QuizLeague browser app.

## Run locally

From the repository root, start the long-running app dependencies in separate shells:

```sh
npm run emulators:start
npm run dev -w client
```

Once the Firestore emulator is running, seed it from the repository root:

```sh
npm run seed:emulator
```

Then run the acceptance suite:

```sh
cd acceptance-tests
npm install
npm test
```

By default the tests target `http://127.0.0.1:5173`. Override it with:

```sh
ACCEPTANCE_BASE_URL=http://127.0.0.1:4173 npm test
```

Run with a visible browser:

```sh
PW_HEADLESS=false npm test
```

Generated Cucumber HTML reports are written to `acceptance-tests/reports/`.
