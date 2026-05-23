# Technical Stack

This repository is a TypeScript monorepo for the QuizLeague website.

## Overview

- Root package is a workspace monorepo using npm workspaces.
- The repo is organized into three main packages:
  - `client/` — Vue 3 frontend
  - `server/` — Node backend
  - `shared/` — shared TypeScript types and utilities

## Client (`client/`)

- Framework: Vue 3
- Build system: Vite
- UI: Vuetify
- State: Pinia
- Routing: Vue Router
- Rich text: VueQuill / Vue Showdown
- Firebase integration: `firebase`, `vuefire`
- HTTP: `axios`
- Uses package scripts for development, build, type-check, test, and lint flows. See `README.md` for exact commands.

### Client structure

- `client/src/dao/` — data access objects and converters
- `client/src/entity/` — typed domain entities
- `client/src/services/` — business logic and app services
- `client/src/stores/` — Pinia stores
- `client/src/site/` — site-level components and router

## Server (`server/`)

- Runtime: Node.js with ES modules
- Web framework: Express
- Data: Google Cloud Firestore
- Email: SendGrid
- Build: `esbuild` bundle output to `server/deploy/main.cjs`
- Uses package scripts for local development and testing. See `README.md` for exact commands.

## Shared (`shared/`)

- Shared package providing common types and utility functions.
- Consumed by both `client/` and `server/` using workspace dependency `@quizleague/shared`.

## Tooling

- Root dev tooling: TypeScript, Vitest
- Client dev tooling: Vite, Vue CLI plugins, ESLint, Prettier
- Server dev tooling: esbuild, tsx
- Workspace package manager: npm workspaces

## Build and deployment

- Root package script: `npm run deployToProd`
- Deploy flow:
  1. Build client to `client/dist`
  2. Copy `client/dist` to `server/deploy/built`
  3. Build server bundle

## Notes

- Keep changes small and package-scoped when possible.
- Prefer existing services, DAOs, and utilities rather than introducing new architecture patterns.
- Consult `project.md` and `README.md` for repository-specific guidance.
