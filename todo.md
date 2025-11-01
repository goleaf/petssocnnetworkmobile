# Edit Approval Queue & Moderation Dashboard - Implementation Plan

## Goal
Create a comprehensive moderation queue and dashboard for edits requiring approval with filtering, rate limits, and audit trails.

## Requirements Analysis

### Core Features Needed
1. **Edit Request System**: Track all content edits (Blog Posts, Wiki Articles, Pet Profiles, User Profiles)
2. **Moderation Queue**: Dashboard at `/admin/moderation` with filtering capabilities
3. **Approval/Rejection**: Action buttons with reason tracking
4. **Notifications**: Notify authors of approval/rejection decisions
5. **Rate Limits**: Prevent abuse by limiting edit frequency
6. **Audit Trail**: Complete history of all moderation actions
7. **Tests**: Comprehensive test coverage for all features

## Implementation Tasks

### Phase 1: Data Models & Types ✅ COMPLETED
- [x] Add `EditRequest` interface to `lib/types.ts`
- [x] Define edit status: "pending", "approved", "rejected"
- [x] Support multiple content types: blog, wiki, pet, user
- [x] Add reporter tracking for user-initiated reports
- [x] Include age/timestamp tracking for filtering

### Phase 2: Storage & Utilities ✅ COMPLETED
- [x] Add storage keys to `lib/storage.ts`
- [x] Create CRUD operations for edit requests
- [x] Implement rate limiting utilities
- [x] Add notification triggers for approval/rejection
- [x] Create audit logging functions

### Phase 3: Moderation Dashboard ✅ COMPLETED
- [x] Update `/admin/moderation` page with edit queue
- [x] Add filters: type, age, reporter, status
- [x] Implement pagination for edit list
- [x] Add approve/reject dialog with reason input
- [x] Display audit trail in sidebar/history panel

### Phase 4: Edit Integration ⚠️ NOT STARTED
- [ ] Hook blog post edits to create edit requests
- [ ] Hook wiki article edits to create edit requests
- [ ] Hook pet profile edits to create edit requests
- [ ] Hook user profile edits to create edit requests
- [ ] Auto-submit edits to moderation queue

### Phase 5: Notifications ✅ COMPLETED
- [x] Create notification types for edit approvals
- [x] Create notification types for edit rejections
- [x] Send notifications with decision reasons
- [x] Add notification badges in UI

### Phase 6: Rate Limiting ✅ COMPLETED
- [x] Implement per-user rate limits
- [x] Add rate limit checks before allowing edits
- [x] Display rate limit warnings in UI
- [x] Track and display rate limit violations

### Phase 7: Testing ⚠️ NOT STARTED
- [ ] Write tests for edit request creation
- [ ] Write tests for moderation actions
- [ ] Write tests for filtering and pagination
- [ ] Write tests for rate limiting
- [ ] Write tests for notifications
- [ ] Write tests for audit trail
- [ ] Run all tests and fix errors

### Phase 8: Polish & Documentation ⚠️ PARTIALLY COMPLETE
- [x] Add loading states
- [x] Improve error handling
- [x] Add responsive design tweaks
- [ ] Update documentation

## Priority Order
1. ✅ Data models and types (Phase 1)
2. ✅ Storage utilities (Phase 2)
3. ✅ Basic moderation dashboard (Phase 3)
4. ⚠️ Edit integration (Phase 4) - REQUIRES TESTING
5. ✅ Notifications (Phase 5)
6. ✅ Rate limiting (Phase 6)
7. ⚠️ Tests (Phase 7) - REQUIRES COMPLETION
8. ⚠️ Polish (Phase 8) - MINOR UPDATES NEEDED

## Key Files Created/Modified
- ✅ `lib/types.ts` - Added EditRequest and EditRequestAuditLog interfaces
- ✅ `lib/storage.ts` - Added edit request CRUD operations and audit logging
- ✅ `lib/moderation.ts` - Created comprehensive moderation utilities
- ✅ `app/admin/moderation/page.tsx` - Complete moderation dashboard with filters and pagination
- ✅ `components/ui/alert-dialog.tsx` - Created alert dialog component

## Completed Features
- ✅ Edit request data model with full type safety
- ✅ Storage layer with CRUD operations and audit trails
- ✅ Moderation utilities: filtering, rate limiting, approval/rejection
- ✅ Dashboard with stats, filters (type/status/priority/age), pagination
- ✅ Approve/reject actions with reason tracking
- ✅ Audit trail viewer for each request
- ✅ Notifications for authors on approval/rejection
- ✅ Rate limiting (10/hour, 50/day per user)
- ✅ Statistics: pending count, avg processing time, oldest pending

## Remaining Work
- ⚠️ Phase 4: Hook edit forms to auto-create edit requests
- ⚠️ Phase 7: Write comprehensive tests
- ⚠️ Phase 8: Final documentation

## Notes
- All edits must go through approval queue
- Only admins and moderators can approve/reject
- Full audit trail required for compliance
- Rate limits prevent spam/abuse
- Authors notified of all decisions
- Filtering essential for large queues
