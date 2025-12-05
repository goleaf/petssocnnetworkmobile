---
inclusion: always
---

# API Checklist

**Description:** Contract-first flow for API routes and server actions.

## Prompt

Use MCP for reads/edits/commands. For API/server changes:
- Validate inputs with Zod; enforce required fields and types
- Check auth/authorization early; respect tenant/locale context
- Use Prisma only for data; no raw SQL or other clients
- Handle errors safely; avoid leaking sensitive details
- Update schemas/types consumed by clients; align with UI expectations
- Sync docs/specs/tasks when behavior changes; call out env/flag impacts
- Run pnpm typecheck, pnpm lint, targeted Jest for actions/services, and pnpm test:e2e --workers=1 when UI flows depend on the endpoint (start dev server if needed)
- Summarize breaking risks and verification results
