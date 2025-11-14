---
inclusion: always
---

<!-- OPENSPEC:START -->
# OpenSpec Instructions

For planning, proposals, breaking changes, or architectural decisions, consult `openspec/AGENTS.md` first to understand the spec workflow and project conventions.

<!-- OPENSPEC:END -->

# Project Architecture

## Directory Structure
- `app/` - Next.js App Router pages, API routes, layouts. Keep route loaders colocated with their segments
- `components/` - Feature components and `components/ui/*` primitives. Compose from existing components before creating new ones
- `lib/` - Shared utilities, auth hooks, server-side data access. All server logic belongs here, not in React components
- `prisma/` - Database schema and seed files
- `i18n/` - Localization files (de.json, en.json)
- `tests/`, `components/__tests__/`, `e2e/` - Test files
- `public/` - Static assets
- `mobile/` - Capacitor native app shells

## Database Rules (Critical)
**Always use Prisma for database operations.** Import from `@/lib/prisma` or `@/lib/db`.

Never use:
- Direct PostgreSQL queries
- `pg` library
- Raw SQL

After schema changes:
1. `npx prisma generate`
2. `npx prisma migrate dev`

Reference `docs/DATABASE_ARCHITECTURE.md` for patterns.

## TypeScript & Code Style
- 2-space indentation
- Explicit return types on exported functions
- PascalCase for component files, camelCase for utilities/hooks
- Client components must start with `"use client"`
- Use `cn()` helper for Tailwind class composition
- Colocate domain logic in `lib/` with Zod schemas
- Run ESLint autofix before committing

## Development Commands
- `npm run dev` - Development server
- `npm run build && npm start` - Production preview (test before PRs)
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript validation
- `npm run db:seed` - Seed database
- `npm run test` - Jest unit tests (`:watch`, `:coverage` variants)
- `npm run test:e2e` - Playwright E2E (`:headed`, `:debug` variants)

## Testing Standards
- Unit/integration: `*.test.ts(x)` pattern, colocated or in `tests/`
- Use `__mocks__/` for auth/network stubs
- E2E: `e2e/` directory with Playwright
- Use `data-testid` selectors for E2E
- Maintain or improve coverage
- Run headed mode for UI changes before merging

## Git Conventions
Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`

PRs require:
- Concise summary with linked issue
- Test evidence (commands + results)
- Screenshots for UI changes
- Explicit callout of schema/env changes
