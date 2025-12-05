---
inclusion: always
---

# QA Sanity Checklist

**Description:** Ensure minimal QA coverage before handing over for manual validation.

## Prompt

Use MCP commands/files when gathering evidence. Before handing off code changes, verify:
+- All new behaviors have at least one regression test or criteria in `tests/active` or `e2e`.
+- Watch for sticky state (loading, error, empty, success) and ensure the UI shows messaging or skeletons.
+- Data flows: confirm server responses deliver expected fields, mocks updated if contracts change, and Prisma transactions follow `.kiro/DATABASE_STANDARDS.md`.
+- Capture any failing suites with `pnpm test -- <path>` or `pnpm test:e2e --workers=1` (start dev server per TEST_RUNNING_INSTRUCTIONS.md when needed).
+- Document remaining gaps (smoke tests not run, platform limitations) and link to relevant `.kiro/specs` tasks so QA can follow.
