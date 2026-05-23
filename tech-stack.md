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

## Session Decisions (2026-05-23)

- Created `spec/maintenance` directory to collect maintenance specifications and session artifacts.
- Record session artifacts in `spec/maintenance/spec.md`, append session decisions to `tech-stack.md`, and record any data-model changes in `data-model.md`.
- Use the repository agent `manage_todo_list` tool to track multi-step tasks and mark progress for sessions and maintenance work.
- Maintain the principle of small, package-scoped changes for maintenance work; avoid introducing architectural changes during note-taking.
- **Maintenance App Architecture**: Implemented a secondary entry point for the client package at `/maintain`. This is configured in `client/vite.config.ts` as a separate rollup input and has its own Vue 3 app instance and router configuration in `client/src/maintain/`. It relies on shared DAOs and entities but is functionally independent of the main site app.

(Recorded by assistant during an interactive session.)
