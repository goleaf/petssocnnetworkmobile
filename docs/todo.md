# PR Merge codex/run-tests-and-fix-errors

## Priority 0: Merge Tasks
- [x] Review commit `test: stabilize jest command`
- [x] Merge `codex/run-tests-and-fix-errors` into `main`
- [x] Run repository tests to confirm stability
- [x] Delete remote branch and close associated PR

# Groups Page Hydration Fix ✅ COMPLETED (2025-11-14)

## Priority 0: Immediate Stabilization
- [x] Capture hydration mismatch details from `/groups`
- [x] Align category loading across server and client
- [x] Validate fix locally (build + manual navigation)
- [x] Add follow-up test coverage if feasible

**Solution:** Replaced dynamic `getGroupCategories()` with static `DEFAULT_CATEGORIES` array. Removed `"use client"` directive. E2E test validates no hydration errors.

# Moderator & Reviewer Tools - Implementation Todo

## Priority 0: Group Resources Routing Fix
- [x] Reproduce `/groups/golden-retriever-adventures/resources/create`
- [x] Diagnose missing page or handler
- [x] Implement routing fix
- [x] Add regression test
- [x] Run relevant tests

## Priority 1: Core Infrastructure
- [ ] Create types for moderation/reviewer tools (lib/types.ts)
- [ ] Create API routes for recent changes feed
- [ ] Create API routes for backlog queues
- [ ] Create API routes for bulk operations

## Priority 2: Recent Changes Feed with Diff Previews
- [ ] Create recent changes API endpoint
- [ ] Create recent changes page component with diff viewer
- [ ] Implement diff calculation logic
- [ ] Add filtering and pagination

## Priority 3: Backlog Queues
- [ ] New pages queue (app/admin/queue/new-pages)
- [ ] Flagged health edits queue (app/admin/queue/flagged-health)
- [ ] COI (Conflict of Interest) edits queue (app/admin/queue/coi-edits)
- [ ] Image reviews queue (app/admin/queue/image-reviews)
- [ ] Queue management components

## Priority 4: Bulk Operations
- [ ] Bulk revert functionality
- [ ] Range blocks for abuse waves
- [ ] Bulk action API endpoints
- [ ] UI for bulk operations

## Priority 5: Link Management
- [ ] Link whitelist/blacklist system
- [ ] Link validation API
- [ ] Link management UI (app/admin/links)
- [ ] Auto-detection of links in content

## Priority 6: Hidden Categories for Internal Triage
- [ ] Category system for internal triage
- [ ] Hidden categories (e.g., "Needs maps", "Outdated laws")
- [ ] Category assignment UI
- [ ] Category filtering in queues

## Priority 7: Testing & Polish
- [ ] Write tests for all new components
- [ ] Write tests for API routes
- [ ] Update translations (multilanguage support)
- [ ] Run tests and fix errors
- [ ] Build and verify

# CreatePostButton React ReferenceError

## Priority 0: Immediate Fix
- [x] Capture error context and stack trace
- [x] Align component hook usage with React 18 import conventions
- [ ] Run `npm run build` to confirm resolution
