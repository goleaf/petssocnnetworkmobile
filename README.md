# Pet Social Network Mobile

Next.js 16 App Router project for a pet-focused social network with Prisma as the single data layer. Includes Capacitor mobile shells, Playwright E2E tests, and Kiro automation hooks/steerings for repeatable workflows.

## Quick Start
- Install dependencies: `pnpm install`
- Run dev server: `pnpm dev`
- Type safety: `pnpm typecheck`
- Lint: `pnpm lint`
- Unit tests (Jest, centralized in `tests/active/`): `pnpm test`
- E2E (Playwright): `pnpm test:e2e --workers=1` (see testing section for dev-server steps)
- Build: `pnpm build` then `pnpm start`

## Project Layout
- `app/` Next.js App Router routes and API handlers
- `components/` shared UI and feature components
- `lib/` server logic, validation, and services
- `prisma/` schema and seeds
- `tests/active/` Jest suites; `e2e/` Playwright specs (per `.cursorrules`)
- `mobile/` Capacitor shells for iOS/Android
- `.kiro/` automation hooks, steerings, and specs

## Database (Prisma Only)
- Schema: `prisma/schema.prisma`
- Update schema then run: `pnpm prisma generate` and `pnpm prisma migrate dev --name <change>`
- Seeds: `pnpm db:seed` or `pnpm db:seed:lt`
- Never use raw SQL or direct `pg`—see `.kiro/DATABASE_STANDARDS.md` and `docs/DATABASE_ARCHITECTURE.md`.

## Testing Workflow
- Centralized tests only (per `.cursorrules`): Jest in `tests/active/`, Playwright in `e2e/`
- Type + lint gate: `pnpm typecheck` then `pnpm lint`
- Unit/regression: `pnpm test` (target files with `pnpm test -- <path>` if needed)
- E2E: `pnpm test:e2e --workers=1`; when required, start dev server first (`pnpm dev`) per `TEST_RUNNING_INSTRUCTIONS.md`
- Prefer `data-testid` selectors; update mocks/fixtures alongside logic changes

## Workflow Guardrails
- Follow AGENTS instructions in `AGENTS.md` and `openspec/AGENTS.md` before planning or proposing changes (OpenSpec workflow).
- Client components require `"use client"`; server-only logic lives in `lib/`.
- Use Zod validation for API/server actions; import Prisma from `@/lib/prisma` or `@/lib/db`.
- Prefer existing UI primitives in `components/ui/` and Tailwind helpers (`cn()`).
- Kiro hooks/steerings in `.kiro/` cover database, API, frontend, config, mobile sync, and spec governance; use MCP file/shell operations when available.

## Mobile
- Capacitor config: `capacitor.config.ts`; native shells live in `mobile/`.
- After web build changes, sync native projects: `pnpm exec cap sync` (platforms: iOS/Android). See `docs/CAPACITOR_SETUP.md`, `doc/ANDROID-APP.md`, and `docs/ANDROID-APP.md`.

## Documentation Map
- High-level: `docs/README.md`, `docs/PROJECT_ANALYSIS.md`
- Installation/environment: `doc/INSTALLATION.md`, `docs/INSTALLATION.md`, `.env` template guidance inside those files
- Database: `docs/DATABASE_README.md`, `docs/QUICK_START_DATABASE.md`, `docs/DATABASE_ARCHITECTURE.md`, `.kiro/DATABASE_STANDARDS.md`
- Testing: `TEST_RUNNING_INSTRUCTIONS.md`, `docs/TEST_ORGANIZATION_SUMMARY.md`, `tests/README.md`
- Features/moderation: `doc/FEATURES.md`, `docs/RECENT_CHANGES_FEED.md`, `docs/MODERATION-FEATURE.md`
- Mobile: `docs/CAPACITOR_SETUP.md`, `doc/ANDROID-APP.md`, `docs/ANDROID-APP.md`

## Tooling & Automation
- Kiro hooks and steerings live in `.kiro/` (database, API, frontend, config, mobile, spec governance).
- Always use MCP file and shell operations when available to edit files or run commands.
- OpenSpec specs and changes live in `openspec/`; validate proposals with `openspec validate --strict`.
