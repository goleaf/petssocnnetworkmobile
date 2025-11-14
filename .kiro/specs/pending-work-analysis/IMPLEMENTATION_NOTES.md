# Implementation Notes - Task 6: Edit Submission API

## Completed: 2025-11-14

### Overview
Successfully implemented the complete API infrastructure for edit request submission, including rate limiting, diff calculation, and content classification.

## Files Created

### 1. `app/api/admin/moderation/edit-requests/route.ts`
**Purpose:** Main API endpoint for creating edit requests

**Features:**
- POST endpoint for submitting edit requests
- Authentication verification using `getCurrentUser()`
- Rate limit enforcement (10/hour, 50/day per user)
- Input validation using Zod schemas
- Content existence verification
- Automatic edit classification (COI, health, new pages, images)
- Comprehensive error handling with clear error codes
- User-friendly retry time formatting

**Error Codes:**
- `UNAUTHORIZED` - User not authenticated
- `RATE_LIMIT_EXCEEDED` - User exceeded submission limits
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Content not found (profile edits only)
- `INTERNAL_ERROR` - Server error

**Response Format:**
```json
{
  "success": true,
  "editRequestId": "edit_123",
  "message": "Edit submitted for approval",
  "details": {
    "contentType": "blog",
    "contentId": "post_456",
    "status": "pending",
    "priority": "normal",
    "queues": ["new-pages", "image-reviews"]
  }
}
```

### 2. `lib/validations/edit-request.ts`
**Purpose:** Zod validation schemas for edit request submission

**Schemas:**
- `contentTypeSchema` - Validates content type (blog, wiki, pet, profile)
- `prioritySchema` - Validates priority level (low, normal, high, urgent)
- `changesSchema` - Validates changes object (must have at least one field)
- `createEditRequestSchema` - Complete validation for edit request creation

**Features:**
- Strict validation with custom error messages
- Type inference for TypeScript
- Maximum length constraints (reason: 500 chars)
- Required field validation

### 3. `lib/diff-utils.ts` (Extended)
**Purpose:** Diff calculation utilities for edit requests

**New Functions:**
- `calculateEditRequestDiff()` - Generic diff calculator for any content type
- `calculateBlogDiff()` - Blog post-specific diff calculation
- `calculateWikiDiff()` - Wiki article-specific diff calculation
- `calculatePetDiff()` - Pet profile-specific diff calculation
- `calculateProfileDiff()` - User profile-specific diff calculation

**Diff Format:**
```typescript
{
  "title": {
    "old": "Old Title",
    "new": "New Title",
    "type": "modified"
  },
  "coverImage": {
    "old": null,
    "new": "https://example.com/image.jpg",
    "type": "added"
  }
}
```

**Change Types:**
- `added` - Field was added (old value is null)
- `modified` - Field was changed
- `deleted` - Field was removed (new value is null)

### 4. `lib/server-rate-limit.ts` (Extended)
**Purpose:** Rate limiting for edit submissions

**New Functions:**
- `checkEditSubmissionRateLimit()` - Enforces hourly and daily limits
- `resetEditSubmissionRateLimit()` - Clears rate limit state (for testing)

**Rate Limits:**
- Hourly: 10 edits per user
- Daily: 50 edits per user

**Features:**
- Dual-window rate limiting (hourly + daily)
- Automatic window expiration
- Remaining count calculation
- Retry-after time calculation
- In-memory storage (suitable for single-instance deployments)

**Return Format:**
```typescript
{
  allowed: boolean,
  remaining: number,
  retryAfterMs: number
}
```

## Edit Classification Logic

### Conflict of Interest (COI) Detection
- Blog posts: Flags if author makes >2 changes to their own post
- Wiki articles: Flags if user makes ≥3 edits to same article in 7 days
- Helps moderators identify potential bias

### Health Content Flagging
- Scans title and content for health-related keywords
- Keywords: disease, illness, medication, treatment, symptom, diagnosis, vaccine, veterinary, health, medical, prescription, drug, therapy, surgery, emergency
- Ensures expert review for medical content

### New Page Detection
- Checks if content exists in database
- Flags new blog posts and wiki articles
- Allows moderators to review new content before publication

### Image Detection
- Checks for image fields (coverImage, avatarUrl, images)
- Scans content for Markdown images, HTML img tags, and direct image URLs
- Enables image-specific moderation queue

## Integration Points

### Database (Prisma)
- Uses existing `EditRequest` model from schema
- Queries `BlogPost`, `Article`, `Pet`, `User` tables for content verification
- Counts previous edit requests for COI detection

### Authentication
- Uses `getCurrentUser()` from `@/lib/auth-server`
- Requires authenticated user for all edit submissions
- User ID is automatically attached to edit requests

### Storage Layer
- Uses `createEditRequest()` from `@/lib/storage/edit-requests`
- Handles transaction management and audit logging
- Sends notifications to users

## Testing Recommendations

### Unit Tests
1. Test rate limiting with multiple submissions
2. Test validation schema with invalid inputs
3. Test diff calculation for all content types
4. Test classification logic for each queue type

### Integration Tests
1. Test complete edit submission flow
2. Test rate limit enforcement in API
3. Test error handling for missing content
4. Test authentication requirements

### E2E Tests
1. Test user submitting edit through UI
2. Test rate limit error display
3. Test success message and redirect
4. Test edit appearing in moderation queue

## Security Considerations

### Rate Limiting
- Prevents spam and abuse
- Per-user limits (not IP-based)
- Clear error messages without exposing system details

### Input Validation
- Strict Zod schemas prevent injection attacks
- Maximum length constraints prevent DoS
- Type validation ensures data integrity

### Authentication
- All endpoints require authentication
- User ID from session (not from request body)
- No privilege escalation possible

### Content Verification
- Checks content existence before creating edit request
- Prevents editing non-existent content
- Profile edits restricted to existing users

## Future Enhancements

### Potential Improvements
1. **Link Validation**: Integrate with link whitelist/blacklist system
2. **Auto-Approval**: Trusted users with high reputation
3. **Edit Templates**: Pre-defined edit patterns for common changes
4. **Batch Edits**: Allow multiple edits in single submission
5. **Draft Edits**: Save edits as drafts before submission
6. **Edit History**: Show user's previous edit requests
7. **Notification Preferences**: Let users opt-in to edit status updates
8. **Redis Rate Limiting**: Replace in-memory with Redis for multi-instance deployments

### Known Limitations
1. Rate limiting is in-memory (not suitable for multi-instance deployments)
2. COI detection is basic (could use ML for better accuracy)
3. Health keyword detection is simple (could use NLP)
4. No link validation yet (planned for Phase 4)
5. No category assignment yet (planned for Phase 4)

## Requirements Satisfied

### Requirement 4.2 (Moderation Infrastructure)
✅ API routes for edit submission with authentication and authorization

### Requirement 10.5 (Edit Integration)
✅ Edit submission creates EditRequest instead of direct update
✅ Displays "Edit submitted for approval" message
✅ Returns edit request ID and confirmation

### Requirement 10.6 (Rate Limiting)
✅ Enforces 10 edits per hour per user
✅ Enforces 50 edits per day per user
✅ Returns clear error messages when limits exceeded
✅ Provides retry-after time in user-friendly format

### Requirement 5.4 (Diff Calculation)
✅ Supports diff calculation for blog, wiki, pet, profile content
✅ Generates structured diffs with additions/deletions
✅ Stores diffs in JSON format in EditRequest.changes

## Next Steps

To complete the moderation system, the following tasks remain:

1. **Task 7**: Integrate edit submission into existing forms
   - Modify blog, wiki, pet, profile edit forms
   - Replace direct update calls with edit request API
   - Add success/error message handling

2. **Task 8**: Create API routes for moderation dashboard
   - Recent changes feed endpoint
   - Queue-specific endpoints
   - Approve/reject endpoints

3. **Task 9**: Build moderation dashboard UI components
   - Recent changes feed component
   - Diff viewer integration
   - Approve/reject buttons

4. **Task 10**: Implement queue management
   - Specialized queue views
   - Bulk operations
   - Queue navigation

## Deployment Checklist

Before deploying to production:

- [ ] Run database migrations for EditRequest model
- [ ] Test rate limiting with real user accounts
- [ ] Verify authentication works in production
- [ ] Set up monitoring for API errors
- [ ] Configure alerts for high rate limit hits
- [ ] Document API endpoints for frontend team
- [ ] Create moderator training materials
- [ ] Set up audit log retention policy
- [ ] Test rollback procedure
- [ ] Verify notification system integration

## Contact

For questions or issues with this implementation, refer to:
- Design document: `.kiro/specs/pending-work-analysis/design.md`
- Requirements: `.kiro/specs/pending-work-analysis/requirements.md`
- Task list: `.kiro/specs/pending-work-analysis/tasks.md`
