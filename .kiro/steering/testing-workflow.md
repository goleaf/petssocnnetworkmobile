---
inclusion: always
---

# Testing Workflow

**Description:** Standard verification sequence for code changes.

## Prompt

Use MCP shell commands to verify changes.

Default order:
1) pnpm typecheck
2) pnpm lint
3) Targeted Jest suites in tests/active matching touched paths (prefer specific files)
4) pnpm test:e2e --workers=1 for UI/routes/auth changes (start dev server manually per TEST_RUNNING_INSTRUCTIONS.md if needed)
5) pnpm build when configs or bundling change

Keep tests in centralized folders, rely on data-testid selectors for E2E, and update mocks/fixtures when implementations shift. Report commands run, results, and any coverage impacts.
