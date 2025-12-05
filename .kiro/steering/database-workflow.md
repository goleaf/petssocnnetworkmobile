---
inclusion: always
---

# Database Workflow

**Description:** Prisma-first steps for any data model change.

## Prompt

Use MCP resources to handle schema updates. Rules: Prisma only (see .kiro/DATABASE_STANDARDS.md and AGENTS.md).

Steps:
1) Review affected models/relations and seed scripts
2) Edit prisma/schema.prisma accordingly; avoid raw SQL or other clients
3) Run pnpm prisma generate and pnpm prisma migrate dev --name <desc>
4) Update lib/ services, Zod schemas, and API handlers to match the schema
5) Refresh seeds and fixtures
6) Update docs (docs/DATABASE_ARCHITECTURE.md, relevant specs/tasks)
7) Run pnpm typecheck, pnpm lint, targeted pnpm test suites, and pnpm test:e2e --workers=1 when flows changed
8) Summarize migrations and verification results
