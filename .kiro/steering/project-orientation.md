---
inclusion: always
---

# Project Orientation

**Description:** Context checklist before making changes.

## Prompt

Use MCP file access to collect context: read AGENTS.md, openspec/AGENTS.md, .cursorrules, TEST_RUNNING_INSTRUCTIONS.md, package.json, and skim .kiro/specs plus openspec/specs to understand capabilities.

Summarize:
- Architecture: Next.js 16 App Router + TypeScript, Prisma-only data layer
- Key directories: app, components, lib, prisma, i18n, mobile, tests/active, e2e
- Default commands: pnpm dev/build/lint/typecheck/test/test:e2e/db:seed
- Testing expectations: centralized tests, data-testid selectors for E2E
- Mobile presence: Capacitor shells in mobile/

List immediate risks and assumptions before starting work.
