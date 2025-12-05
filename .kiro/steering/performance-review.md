---
inclusion: always
---

# Performance Review

**Description:** Checklist for guarding regressions in load, render, and data fetching performance.

## Prompt

Use MCP shell for profiling commands when possible. For performance-impacting changes:
+- Check bundle/platform metrics: `next build` output, tree-shake new dependencies, and avoid large polyfills.
+- Monitor data fetching: prefer selective Prisma `select` fields, use pagination/cursor, and batch writes (prisma.$transaction) when mutating related models.
+- UI runtime: avoid expensive loops, memoize heavy calculations, and ensure virtualization (list virtualization, lazy loading) is in place.
+- Run `pnpm test -- --runInBand` when data-intensive suites exist, and `pnpm dev`/`pnpm test:e2e --workers=1` with Lighthouse/Playwright when needed.
+- Note any performance budgets or evidence (timings, wasm builds) for reviewers.
