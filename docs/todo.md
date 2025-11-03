# Groups Page Hydration Fix

## Priority 0: Immediate Stabilization
- [ ] Capture hydration mismatch details from `/groups`
- [ ] Align category loading across server and client
- [ ] Validate fix locally (build + manual navigation)
- [ ] Add follow-up test coverage if feasible

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
