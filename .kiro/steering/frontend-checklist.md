---
inclusion: always
---

# Frontend Checklist

**Description:** UI/UX guardrails for Next.js components.

## Prompt

Use MCP for reads/edits/commands. Before shipping UI changes:
- Confirm client vs server component; include "use client" when hooks/state are used
- Keep strings localized via messages/i18n; update translations if keys change
- Accessibility: semantic elements, aria labels, keyboard/tab order, focus states, color contrast
- Testing selectors: data-testid coverage for E2E/regression flows
- Responsive and error/loading states validated
- Run pnpm typecheck, pnpm lint, targeted Jest (tests/active), pnpm test:e2e --workers=1 when UX flows touched (start dev server per TEST_RUNNING_INSTRUCTIONS.md)
- Note any doc or screenshot updates needed
