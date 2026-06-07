# vue3-test

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run the Firestore Emulator

```sh
npm run emulators:start
```

The emulator imports and exports the reusable local data set in `emulator-data/`.
To reset the emulator to the seeded Chiltern Quiz League data model sample, run:

```sh
npm run seed:emulator
npm run emulators:export
```

### Gemini result summaries

The server generates a public fixture-set results summary after every fixture in the set has a submitted result. Put the Gemini API key in `gemini-api-key.txt` at the project root before deploying. The local server also uses that file when `GEMINI_API_KEY` is not set. `npm run deployToProd` writes a gitignored `server/deploy/app.yaml` with `GEMINI_API_KEY`, `GEMINI_MODEL`, and `SENDGRID_API_KEY` for GCP deployment. `SENDGRID_API_KEY` must be set in the build environment. `npm run deployToGcp` then deploys the generated artifact with `gcloud app deploy server/deploy`. `GEMINI_MODEL` is optional and defaults to `gemini-3.5-flash`.

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

**Repository guidance**

- This repository includes a guidance file at `project.md`. It contains repository-specific tips for making focused, consistent changes across the `client/`, `server/`, and `shared/` packages. Review that file before making wide-reaching edits.
