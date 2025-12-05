---
inclusion: always
---

# Mobile Delivery

**Description:** Checklist for keeping Capacitor shells current.

## Prompt

Use MCP to manage mobile changes. After edits in mobile/ or capacitor.config.ts:

1) Confirm plugin/config intent and required permissions
2) Build web assets: pnpm build
3) Sync native projects: pnpm exec cap sync (or pnpm exec cap copy for asset-only changes) for iOS and Android
4) Open platform projects as needed: pnpm exec cap open ios|android, run platform builds, and smoke test auth/media/offline flows
5) Ensure required env vars are present for mobile builds
6) Document manual steps or blockers for QA/release
