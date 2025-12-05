---
inclusion: always
---

# Security Spotlight

**Description:** Checklist for verifying auth, access control, and data privacy.

## Prompt

Use MCP resources to audit sensitive paths. When code touches auth/data:
+- Ensure server actions/API routes verify `userId`, `session`, and roles before mutations; use existing middleware/hooks.
+- Validate Prisma operations respect ownership filters and avoid leaking fields (select only needed columns, filter out soft-deleted records).
+- Encrypt/handle secrets per env instructions; never log tokens/PII and store secrets in `.env` referenced docs.
+- Run targeted Jest tests that cover failure paths, unauthorized access, and mocking from `__mocks__/`.
+- Mention any security risks or assumptions remaining for reviewers.
