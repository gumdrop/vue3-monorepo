# AGENTS.md

This repository does not currently include custom agent configuration files beyond the repository guidance in `project.md`.

## Purpose

`AGENTS.md` is a lightweight reference for people using AI-assisted tools in this repo.

## Recommended guidance

- Review `project.md` before making changes. It contains repository-specific guidance for the `client/`, `server/`, and `shared/` packages.
- See `tech-stack.md` for the repo's technical architecture, package roles, and build/deploy flow.
- Use the root `README.md` for standard development setup, commands, and package structure.

## Repo structure

- `client/` — frontend package
  - `/` - Main application
  - `/maintain` - Data maintenance application
- `server/` — backend package
- `shared/` — shared types and utilities

## Data Maintenance App

A dedicated data maintenance application is available at `/maintain`.
- Root: `client/src/maintain/index.ts`
- Views: `client/src/maintain/views/`
- All subcollection entities (e.g., Competitions under Seasons) must be editable via their parent entity views.

## Working with agents in this repo

- Prefer small, focused changes.
- Keep new behavior contained to the package where it belongs.
- If you need to add a new agent or skill file, document it here and keep the new file aligned with repository conventions.

## When to ask for help from an agent

- If you need a quick repo-wide search or context lookup, use a browsing/explore agent.
- If you need implementation help, use a code-focused agent and link the relevant package (`client/`, `server/`, or `shared/`).
- If you need to update shared APIs, preserve backward compatibility.

## Coding Conventions

- **Lifecycle Hooks**: When implementing or debugging features that depend on external state (like URL parameters or Firebase auth links), always ensure that the appropriate lifecycle hooks (e.g., `onMounted`) are used to initialize or check that state.
- **Authentication**: Refer to `spec/docs/auth.md` for the detailed authentication flow, especially for email-based login.

## Notes

If this repo later adds a custom agent manifest or skill directory, extend this file with the new agent names, purpose, and usage examples.
