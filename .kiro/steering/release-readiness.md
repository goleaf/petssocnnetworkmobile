---
inclusion: always
---

# Release Readiness

**Description:** Checklist before tagging/releasing or merging major changes.

## Prompt

Use MCP shell for commands. Before release/merge:
- Confirm specs/tasks complete (openspec/AGENTS.md workflow); update checklists in `.kiro/specs/**` if needed
- Build and verify: pnpm typecheck, pnpm lint, pnpm test, pnpm test:e2e --workers=1 (start dev server per TEST_RUNNING_INSTRUCTIONS.md), pnpm build
- Database: ensure migrations are applied and documented; seeds updated if schema changed
- Mobile: if Capacitor impacted, run pnpm exec cap sync (iOS/Android) after pnpm build
- Update changelog and README/docs with user-facing changes and breaking notes
- Summarize verification results and remaining risks/gaps
