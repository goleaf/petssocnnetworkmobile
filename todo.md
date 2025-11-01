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

### Phase 1: Data Models & Types
- [ ] Add `EditRequest` interface to `lib/types.ts`
- [ ] Define edit status: "pending", "approved", "rejected"
- [ ] Support multiple content types: blog, wiki, pet, user
- [ ] Add reporter tracking for user-initiated reports
- [ ] Include age/timestamp tracking for filtering

### Phase 2: Storage & Utilities
- [ ] Add storage keys to `lib/storage.ts`
- [ ] Create CRUD operations for edit requests
- [ ] Implement rate limiting utilities
- [ ] Add notification triggers for approval/rejection
- [ ] Create audit logging functions

### Phase 3: Moderation Dashboard
- [ ] Update `/admin/moderation` page with edit queue
- [ ] Add filters: type, age, reporter, status
- [ ] Implement pagination for edit list
- [ ] Add approve/reject dialog with reason input
- [ ] Display audit trail in sidebar/history panel

### Phase 4: Edit Integration
- [ ] Hook blog post edits to create edit requests
- [ ] Hook wiki article edits to create edit requests
- [ ] Hook pet profile edits to create edit requests
- [ ] Hook user profile edits to create edit requests
- [ ] Auto-submit edits to moderation queue

### Phase 5: Notifications
- [ ] Create notification types for edit approvals
- [ ] Create notification types for edit rejections
- [ ] Send notifications with decision reasons
- [ ] Add notification badges in UI

### Phase 6: Rate Limiting
- [ ] Implement per-user rate limits
- [ ] Add rate limit checks before allowing edits
- [ ] Display rate limit warnings in UI
- [ ] Track and display rate limit violations

### Phase 7: Testing
- [ ] Write tests for edit request creation
- [ ] Write tests for moderation actions
- [ ] Write tests for filtering and pagination
- [ ] Write tests for rate limiting
- [ ] Write tests for notifications
- [ ] Write tests for audit trail
- [ ] Run all tests and fix errors

### Phase 8: Polish & Documentation
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add responsive design tweaks
- [ ] Update documentation

## Priority Order
1. Data models and types (Phase 1)
2. Storage utilities (Phase 2)
3. Basic moderation dashboard (Phase 3)
4. Edit integration (Phase 4)
5. Notifications (Phase 5)
6. Rate limiting (Phase 6)
7. Tests (Phase 7)
8. Polish (Phase 8)

## Key Files to Create/Modify
- `lib/types.ts` - Add EditRequest interface
- `lib/storage.ts` - Add edit request operations
- `lib/moderation.ts` - Create new moderation utilities
- `app/admin/moderation/page.tsx` - Update dashboard
- `components/moderation/` - Create moderation components
- `__tests__/moderation/` - Create tests

## Notes
- All edits must go through approval queue
- Only admins and moderators can approve/reject
- Full audit trail required for compliance
- Rate limits prevent spam/abuse
- Authors notified of all decisions
- Filtering essential for large queues
