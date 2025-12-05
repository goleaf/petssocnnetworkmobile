---
inclusion: always
---

# Docs Checklist

**Description:** Keep documentation accurate and aligned with code/specs.

## Prompt

Use MCP to read/edit docs and run any commands. When updating docs or README:
- Verify commands, file paths, and feature descriptions against current code/specs (AGENTS.md, openspec/AGENTS.md, .cursorrules)
- Highlight Prisma-only rule, test locations, and OpenSpec/Kiro workflows
- Note schema/env/test impacts and link to authoritative docs (DATABASE_*, TEST_RUNNING_INSTRUCTIONS.md)
- Update links, samples, and screenshots if UI/flows changed
- If commands change, validate with pnpm typecheck/lint and targeted tests; note any steps not run
