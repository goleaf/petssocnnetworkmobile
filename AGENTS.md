<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

## Project Structure & Module Organization
`app/` hosts the Next.js App Router pages, API routes, and layouts; keep route-specific loaders next to their segment. `components/` provides feature modules plus `components/ui/*` primitives—compose from these before adding new widgets. Shared utilities, auth hooks, and CLI helpers live in `lib/`, `scripts/`, and `proxy.ts`; server data access belongs here rather than inside React trees. Persisted data flows through `prisma/` (schema + seeds) with localization files in `i18n/`. Tests sit in `tests/`, `components/__tests__`, and `e2e/`, while static assets remain under `public/`, styles in `styles/`, and Capacitor shells in `mobile/`.

## Build, Test, and Development Commands
Use `npm run dev` for everyday work and pair it with `mobile/` previews when validating native plugins. `npm run build && npm start` mirrors the production stack; run it before opening a PR that touches routing or middleware. `npm run lint`, `npm run typecheck`, and `npm run db:seed` keep ESLint, TypeScript, and Prisma data in sync. The Jest suite runs via `npm run test`, with `:watch` and `:coverage` variants; Playwright specs run through `npm run test:e2e`, `:headed`, or `:debug`.

## Coding Style & Naming Conventions
Code is TypeScript-first with 2-space indentation and explicit return types on exported helpers. Components use PascalCase filenames and export a single default or named component; hooks/utilities stay camelCase (`useFriendRequests`, `formatReputation`). Client-side React files start with `"use client"` and use the `cn` helper to compose Tailwind classes. Prefer colocating domain logic in `lib/` (often paired with `zod` schemas) and rely on ESLint autofix before committing.

## Database & Data Persistence
**Use Prisma exclusively** for all database operations. Import from `@/lib/prisma` or `@/lib/db`. Never use direct PostgreSQL queries, `pg` library, or raw SQL. The schema lives in `prisma/schema.prisma`. Run `npx prisma generate` after schema changes and `npx prisma migrate dev` to create migrations. See `docs/DATABASE_ARCHITECTURE.md` for patterns and best practices.

## Testing Guidelines
Unit and integration tests follow the `*.test.ts(x)` pattern near their sources or under `tests/`; reuse `__mocks__/` for auth/network doubles. Maintain or raise the coverage recorded in `coverage/`, and document any intentional gaps inside the PR description. E2E specs live in `e2e/flows` with Playwright; rely on `data-testid` selectors and run the headed mode before merging UI-heavy changes.

## Commit & Pull Request Guidelines
Follow the Conventional Commits vocabulary already in `git log` (`feat:`, `fix:`, `refactor:`, `chore:`). Each PR needs a concise summary, linked issue, test evidence (command + result), and screenshots for UI deltas. Surface schema or env-variable changes explicitly and request reviewers who own the affected module.
