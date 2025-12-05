# Design Document: Pending Work Analysis

## Overview

This design document outlines the architecture and implementation approach for addressing pending work items across the Pet Social Network codebase. The work is organized into three major categories:

1. **Bug Fixes & Technical Debt** - Immediate issues affecting user experience (hydration errors, routing problems, React errors)
2. **Moderation System** - Core infrastructure for content review and approval workflows
3. **Developer Tooling** - Automation to improve development velocity (Cursor hooks for test maintenance)

The design prioritizes fixing critical bugs first, then establishing moderation infrastructure, and finally implementing developer automation tools.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Pet Social Network                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Bug Fixes  │  │  Moderation  │  │  Dev Tools   │      │
│  │              │  │   System     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Moderation System Architecture


```
┌─────────────────────────────────────────────────────────────────┐
│                      Moderation Dashboard                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │  Recent    │  │  Backlog   │  │   Bulk     │               │
│  │  Changes   │  │  Queues    │  │ Operations │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                         │
│  /api/admin/moderation/*                                         │
│  - recent-changes, queues, bulk-operations, links                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
│  lib/moderation.ts - Core moderation logic                       │
│  lib/storage/edit-requests.ts - Edit request CRUD                │
│  lib/audit.ts - Audit trail logging                              │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (Prisma)                           │
│  EditRequest, AuditLog, LinkWhitelist, LinkBlacklist            │
└─────────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### 1. Bug Fixes & Technical Debt

#### 1.1 Groups Page Hydration Fix  COMPLETED

**Problem:** Server-rendered HTML differs from client-rendered HTML, causing React hydration mismatches on `/groups` page.

**Root Cause Analysis:**
- Category data loading differed between server and client
- `getGroupCategories()` function call resulted in different data on initial render vs hydration

**Solution Implemented:**
- Removed `"use client"` directive from `app/[locale]/groups/page.tsx`
- Replaced dynamic `getGroupCategories()` call with static `DEFAULT_CATEGORIES` constant
- Static array ensures identical category data on both server and client renders
- All 10 categories (Dogs, Cats, Birds, Rabbits, Hamsters, Fish, Training, Health, Adoption, Nutrition) are now hardcoded

**Files Modified:**
- `app/[locale]/groups/page.tsx` - Removed client directive, added static categories

**Validation:**
- E2E test in `e2e/groups-hydration.spec.ts` confirms no hydration errors
- Unit test in `tests/active/app/[locale]/groups/page.test.tsx` validates rendering
- All existing functionality preserved (filtering, search, pagination, view modes)

**Design Decision:** Static category data is acceptable as group categories change infrequently. If dynamic categories are needed in the future, implement proper server-side data fetching with Next.js Server Components.

#### 1.2 Group Resources Routing

**Problem:** `/groups/[slug]/resources/create` route returns 404.

**Root Cause Analysis:**
- Missing page file in App Router structure
- Or missing route handler for resource creation

**Solution Approach:**
- Create `app/groups/[slug]/resources/create/page.tsx`
- Implement resource creation form component
- Add API route at `app/api/groups/[slug]/resources/route.ts` for POST operations

**Design Decision:** Follow existing patterns from other group sub-routes. Reuse form components and validation schemas where applicable.

#### 1.3 CreatePostButton React Error

**Problem:** ReferenceError in CreatePostButton component.

**Root Cause Analysis:**
- Likely improper React hook usage or import issues
- May be related to React 18 migration or SSR/CSR boundaries

**Solution Approach:**
- Review `components/posts/CreatePostButton.tsx` for hook violations
- Ensure proper `"use client"` directive if using hooks
- Verify all React imports follow React 18 conventions

**Design Decision:** Ensure all interactive components with hooks are properly marked as Client Components.


### 2. Moderation System

#### 2.1 Core Infrastructure

**TypeScript Types** (`lib/types.ts` or `lib/types/moderation.ts`):

```typescript
interface EditRequest {
  id: string
  contentType: 'blog' | 'wiki' | 'pet' | 'profile'
  contentId: string
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  changes: Record<string, any> // JSON diff
  reason?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
  metadata: {
    isCOI?: boolean
    isFlaggedHealth?: boolean
    isNewPage?: boolean
    hasImages?: boolean
    categories?: string[]
  }
}

interface ModerationQueue {
  type: 'new-pages' | 'flagged-health' | 'coi-edits' | 'image-reviews'
  items: EditRequest[]
  totalCount: number
  filters: QueueFilters
}

interface QueueFilters {
  contentType?: string[]
  priority?: string[]
  ageInDays?: number
  categories?: string[]
}

interface BulkOperation {
  type: 'revert' | 'range-block'
  targetIds: string[]
  reason: string
  executedBy: string
}

interface LinkRule {
  id: string
  domain: string
  type: 'whitelist' | 'blacklist'
  reason?: string
  addedBy: string
  addedAt: Date
}
```

**Design Decision:** Use a single `EditRequest` model with metadata flags rather than separate tables for each queue type. This simplifies queries and allows flexible categorization.


#### 2.2 API Routes

**Recent Changes Feed** (`app/api/admin/moderation/recent-changes/route.ts`):
- GET endpoint with query params: `page`, `limit`, `contentType`, `status`, `priority`, `ageInDays`
- Returns paginated list of EditRequests with diff previews
- Includes metadata for filtering UI

**Backlog Queues** (`app/api/admin/moderation/queues/[type]/route.ts`):
- GET endpoint for each queue type: `new-pages`, `flagged-health`, `coi-edits`, `image-reviews`
- Filters EditRequests based on metadata flags
- Supports same query params as recent changes

**Bulk Operations** (`app/api/admin/moderation/bulk/route.ts`):
- POST endpoint for bulk revert and range block operations
- Validates moderator permissions
- Logs all operations to audit trail
- Returns operation results with success/failure counts

**Link Management** (`app/api/admin/moderation/links/route.ts`):
- GET: List all whitelist/blacklist rules
- POST: Add new rule
- DELETE: Remove rule
- Validates domain format and checks for duplicates

**Design Decision:** Use Next.js App Router route handlers with proper authentication middleware. All routes require moderator role verification.

#### 2.3 Storage Layer

**Edit Request Storage** (`lib/storage/edit-requests.ts`):

```typescript
// CRUD operations using Prisma
async function createEditRequest(data: CreateEditRequestInput): Promise<EditRequest>
async function getEditRequest(id: string): Promise<EditRequest | null>
async function updateEditRequest(id: string, data: UpdateEditRequestInput): Promise<EditRequest>
async function deleteEditRequest(id: string): Promise<void>

// Query operations
async function listEditRequests(filters: QueueFilters, pagination: Pagination): Promise<PaginatedResult<EditRequest>>
async function getQueueItems(queueType: string, filters: QueueFilters): Promise<EditRequest[]>
async function getRecentChanges(filters: RecentChangesFilters): Promise<EditRequest[]>

// Approval/rejection
async function approveEditRequest(id: string, reviewerId: string): Promise<void>
async function rejectEditRequest(id: string, reviewerId: string, reason: string): Promise<void>
```

**Design Decision:** Use Prisma exclusively for all database operations, following repository guidelines. Implement proper transaction handling for approval/rejection flows.


#### 2.4 UI Components

**Recent Changes Feed** (`components/admin/RecentChangesFeed.tsx`):
- Displays paginated list of edit requests
- Shows visual diffs using `components/diff-viewer.tsx` (already exists)
- Provides filtering controls (content type, status, priority, age)
- Includes approve/reject actions for each item

**Queue Management** (`components/admin/QueueManager.tsx`):
- Reusable component for all queue types
- Accepts queue type as prop to customize behavior
- Displays queue-specific metadata (e.g., COI flag, health flag)
- Supports bulk selection and operations

**Bulk Operations Panel** (`components/admin/BulkOperationsPanel.tsx`):
- Checkbox selection for multiple items
- Confirmation dialog before executing bulk actions
- Progress indicator during operation
- Results summary after completion

**Link Management** (`components/admin/LinkManagement.tsx`):
- Two-column layout: whitelist and blacklist
- Add/remove domain functionality
- Search and filter capabilities
- Displays reason and added-by information

**Design Decision:** Build reusable components that can be composed for different queue types. Use existing UI primitives from `components/ui/*` for consistency.

#### 2.5 Diff Calculation

**Existing Implementation:** `lib/moderation.ts` already contains diff calculation logic.

**Enhancement Approach:**
- Extend existing diff utilities to support all content types (blog, wiki, pet, profile)
- Generate structured diffs that highlight additions, deletions, and modifications
- Format diffs for visual display in UI components

**Design Decision:** Reuse and extend existing diff logic rather than introducing new libraries. This maintains consistency with current implementation.


#### 2.6 Edit Integration

**Content Edit Flow:**

```
User submits edit
      ↓
Create EditRequest (pending status)
      ↓
Rate limit check (10/hour, 50/day)
      ↓
Store original + changes as JSON diff
      ↓
Classify edit (COI, health, new page, images)
      ↓
Add to appropriate queue(s)
      ↓
Show "Edit submitted for approval" message
      ↓
Redirect to content page
```

**Files to Modify:**
- `app/blog/[id]/edit/page.tsx` - Blog edit form
- `app/wiki/[slug]/edit/page.tsx` - Wiki edit form
- `app/user/[username]/pet/[slug]/edit/page.tsx` - Pet profile edit form
- `app/user/[username]/edit/page.tsx` - User profile edit form

**API Integration:**
- Each edit form submits to `/api/admin/moderation/edit-requests` instead of direct content update endpoints
- API creates EditRequest and returns confirmation
- Original content remains unchanged until approval

**Rate Limiting:**
- Use existing `lib/rate-limit.ts` or `lib/server-rate-limit.ts`
- Implement per-user limits: 10 edits/hour, 50 edits/day
- Return clear error messages when limits exceeded

**Design Decision:** Intercept edit submissions at the API layer rather than modifying form components extensively. This minimizes changes to existing UI code.


#### 2.7 Link Management System

**Validation Flow:**

```
User submits content with links
      ↓
Extract all URLs from content
      ↓
Check each domain against blacklist
      ↓
If blacklisted → Reject submission
      ↓
Check each domain against whitelist
      ↓
If not whitelisted → Flag for review
      ↓
If all whitelisted → Allow submission
```

**Storage:**
- `LinkWhitelist` table: id, domain, reason, addedBy, addedAt
- `LinkBlacklist` table: id, domain, reason, addedBy, addedAt

**Validation Utility** (`lib/moderation/link-validator.ts`):
```typescript
async function validateLinks(urls: string[]): Promise<LinkValidationResult>
async function isBlacklisted(domain: string): Promise<boolean>
async function isWhitelisted(domain: string): Promise<boolean>
async function extractDomain(url: string): string
```

**Design Decision:** Use domain-level matching rather than full URL matching to simplify management. Support wildcard subdomains (e.g., `*.example.com`).

#### 2.8 Hidden Categories

**Category System:**
- Categories are metadata tags on EditRequests
- Only visible to moderators
- Used for internal organization and prioritization

**Predefined Categories:**
- "Needs maps" - Content requiring geographic information
- "Outdated laws" - Legal information needing updates
- "Needs citations" - Claims requiring source verification
- "Image quality" - Visual content needing improvement

**Custom Categories:**
- Moderators can create custom categories
- Stored in `ModerationCategory` table
- Applied via dropdown in queue management UI

**Design Decision:** Store categories as array of strings in EditRequest metadata rather than separate join table. This provides flexibility without complex schema changes.


### 3. Developer Tooling

#### 3.1 Cursor Hook for Test Automation

**Problem:** Manual test maintenance when functions are edited.

**Solution:** Automated hook that detects function changes and updates related tests.

**Hook Workflow:**

```
Developer edits function
      ↓
Hook detects file change
      ↓
Identify function name and location
      ↓
Search for related test files
      ↓
Analyze test coverage for edited function
      ↓
Generate or update test cases
      ↓
Run affected tests
      ↓
Report results to developer
```

**Implementation Approach:**

1. **File Watcher:** Monitor changes to `*.ts` and `*.tsx` files (excluding test files)
2. **AST Parsing:** Use TypeScript compiler API to extract function signatures
3. **Test Discovery:** Follow naming conventions to find related test files:
   - `lib/utils.ts` → `tests/lib/utils.test.ts` or `lib/__tests__/utils.test.ts`
   - `components/Button.tsx` → `components/__tests__/Button.test.tsx`
4. **Test Generation:** Use templates to generate test scaffolding for new functions
5. **Test Execution:** Run specific test suites using Jest's `--testNamePattern` or `--testPathPattern`

**Context7 Constraints:**
- The requirements mention Context7 usage constraints
- Need to clarify what Context7 is and how it affects implementation
- Assumption: Context7 may be a code generation or AI assistance tool with specific limitations

**Design Decision:** Implement as a Kiro agent hook (`.kiro/hooks/`) that can be triggered on file save events. This aligns with the repository's existing hook infrastructure.

**Files to Create:**
- `.kiro/hooks/test-automation.ts` - Main hook implementation
- `lib/dev-tools/ast-parser.ts` - Function extraction utilities
- `lib/dev-tools/test-generator.ts` - Test template generation

**Design Decision:** Start with a simple implementation that handles common cases (pure functions, React components) before expanding to complex scenarios (hooks, async functions, database operations).


## Data Models

### Prisma Schema Extensions

```prisma
model EditRequest {
  id            String   @id @default(cuid())
  contentType   String   // 'blog' | 'wiki' | 'pet' | 'profile'
  contentId     String
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  status        String   @default("pending") // 'pending' | 'approved' | 'rejected'
  priority      String   @default("normal") // 'low' | 'normal' | 'high' | 'urgent'
  changes       Json     // Structured diff
  reason        String?
  reviewedBy    String?
  reviewer      User?    @relation("ReviewedEdits", fields: [reviewedBy], references: [id])
  reviewedAt    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Metadata for queue classification
  isCOI         Boolean  @default(false)
  isFlaggedHealth Boolean @default(false)
  isNewPage     Boolean  @default(false)
  hasImages     Boolean  @default(false)
  categories    String[] // Hidden categories for triage
  
  @@index([status, createdAt])
  @@index([contentType, status])
  @@index([userId, createdAt])
  @@index([isCOI, status])
  @@index([isFlaggedHealth, status])
  @@index([isNewPage, status])
}

model LinkWhitelist {
  id        String   @id @default(cuid())
  domain    String   @unique
  reason    String?
  addedBy   String
  moderator User     @relation(fields: [addedBy], references: [id])
  addedAt   DateTime @default(now())
  
  @@index([domain])
}

model LinkBlacklist {
  id        String   @id @default(cuid())
  domain    String   @unique
  reason    String?
  addedBy   String
  moderator User     @relation(fields: [addedBy], references: [id])
  addedAt   DateTime @default(now())
  
  @@index([domain])
}

model ModerationCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdBy   String
  moderator   User     @relation(fields: [createdBy], references: [id])
  createdAt   DateTime @default(now())
}

// Extend existing AuditLog model to include moderation actions
// (Assuming AuditLog already exists based on lib/audit.ts)
```

**Design Decision:** Use JSON field for `changes` to store flexible diff structures. This allows different content types to have different change formats without schema modifications.


## Error Handling

### API Error Responses

All API routes follow consistent error response format:

```typescript
interface ErrorResponse {
  error: string
  code: string
  details?: any
}
```

**Error Codes:**
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks moderator permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Edit rate limit exceeded
- `VALIDATION_ERROR` - Invalid input data
- `CONFLICT` - Resource conflict (e.g., duplicate domain)
- `INTERNAL_ERROR` - Unexpected server error

### Client-Side Error Handling

**Edit Submission Errors:**
- Rate limit exceeded: Display remaining time until next allowed edit
- Validation errors: Highlight specific fields with error messages
- Network errors: Show retry button with exponential backoff

**Moderation Dashboard Errors:**
- Failed to load queue: Display error message with refresh button
- Bulk operation failures: Show partial success results with failed items
- Permission errors: Redirect to unauthorized page

**Design Decision:** Use React Error Boundaries for component-level error handling. Log all errors to audit trail for debugging.

### Database Transaction Handling

**Approval Flow Transaction:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update EditRequest status
  await tx.editRequest.update({ ... })
  
  // 2. Apply changes to actual content
  await tx[contentModel].update({ ... })
  
  // 3. Log to audit trail
  await tx.auditLog.create({ ... })
  
  // 4. Send notification to user
  await createNotification({ ... })
})
```

**Design Decision:** Use Prisma transactions for all multi-step operations to ensure data consistency. Implement retry logic for transient failures.


## Testing Strategy

### Unit Tests

**Moderation Logic** (`tests/lib/moderation.test.ts`):
- Edit request creation with various content types
- Diff calculation for different change scenarios
- Rate limiting enforcement
- Link validation (whitelist/blacklist checking)
- Category assignment and filtering

**Storage Operations** (`tests/lib/storage/edit-requests.test.ts`):
- CRUD operations for EditRequest
- Query filtering and pagination
- Approval and rejection flows
- Transaction rollback scenarios

**Link Validation** (`tests/lib/moderation/link-validator.test.ts`):
- Domain extraction from URLs
- Whitelist/blacklist matching
- Wildcard subdomain handling
- Edge cases (malformed URLs, IP addresses)

### Integration Tests

**Moderation Dashboard** (`tests/integration/admin/moderation.test.tsx`):
- Recent changes feed rendering
- Queue filtering and sorting
- Approve/reject actions
- Bulk operations
- Link management UI

**Edit Submission Flow** (`tests/integration/edit-submission.test.ts`):
- Blog edit submission creates EditRequest
- Wiki edit submission creates EditRequest
- Pet profile edit submission creates EditRequest
- User profile edit submission creates EditRequest
- Rate limit enforcement in UI

### E2E Tests

**Moderation Workflow** (`e2e/flows/moderation.spec.ts`):
- User submits edit → EditRequest created
- Moderator reviews edit → Sees in queue
- Moderator approves edit → Content updated
- Moderator rejects edit → User notified
- Bulk revert operation → Multiple edits reverted

**Bug Fix Validation** (`e2e/bug-fixes.spec.ts`):
- Groups page loads without hydration errors
- Group resources creation page accessible
- CreatePostButton renders without errors

### Test Coverage Goals

- Unit tests: 80% coverage for moderation modules
- Integration tests: All critical user flows covered
- E2E tests: Happy path and error scenarios for moderation workflow

**Design Decision:** Follow existing test patterns in the repository. Use `__mocks__/` for auth and database doubles. Run tests before merging PRs.


## Implementation Phases

### Phase 1: Critical Bug Fixes (Priority: Urgent)

**Goal:** Restore broken functionality affecting users.

**Tasks:**
1. Fix groups page hydration error
2. Implement group resources routing
3. Fix CreatePostButton React error

**Rationale:** These bugs directly impact user experience and should be resolved before adding new features.

**Estimated Effort:** 1-2 days

### Phase 2: Moderation Infrastructure (Priority: High)

**Goal:** Establish core moderation system foundation.

**Tasks:**
1. Define TypeScript types and Prisma schema
2. Implement storage layer (edit-requests.ts)
3. Create API routes for edit submission
4. Integrate edit submission into existing forms
5. Implement rate limiting

**Rationale:** Core infrastructure must be in place before building UI and advanced features.

**Estimated Effort:** 3-5 days

### Phase 3: Moderation Dashboard (Priority: High)

**Goal:** Provide moderators with tools to review and approve edits.

**Tasks:**
1. Build Recent Changes Feed component
2. Implement queue management components
3. Create diff viewer integration
4. Add approve/reject actions
5. Implement filtering and pagination

**Rationale:** Moderators need a functional dashboard to process the edit requests created in Phase 2.

**Estimated Effort:** 3-4 days

### Phase 4: Advanced Moderation Features (Priority: Medium)

**Goal:** Add bulk operations, link management, and hidden categories.

**Tasks:**
1. Implement bulk revert and range block
2. Build link whitelist/blacklist system
3. Add hidden category management
4. Create specialized queue views (COI, health, images)

**Rationale:** These features enhance moderator efficiency but aren't required for basic moderation workflow.

**Estimated Effort:** 2-3 days

### Phase 5: Developer Tooling (Priority: Low)

**Goal:** Automate test maintenance for improved developer velocity.

**Tasks:**
1. Implement Cursor hook for test automation
2. Create AST parsing utilities
3. Build test generation templates
4. Add test execution integration

**Rationale:** This is a developer productivity enhancement that doesn't affect end users. Can be implemented after user-facing features are complete.

**Estimated Effort:** 2-4 days

### Phase 6: Testing & Documentation (Priority: High)

**Goal:** Ensure quality and maintainability.

**Tasks:**
1. Write comprehensive unit tests
2. Create integration tests for moderation flows
3. Add E2E tests for critical paths
4. Write moderator user guide
5. Document API endpoints
6. Create developer integration guide

**Rationale:** Testing and documentation should be completed before considering the feature production-ready.

**Estimated Effort:** 3-4 days

**Total Estimated Effort:** 14-22 days


## Security Considerations

### Authentication & Authorization

**Moderator Role Verification:**
- All moderation API routes require authentication
- Check user role includes "moderator" or "admin"
- Use existing auth patterns from `lib/auth-server.ts`

**Edit Request Ownership:**
- Users can only view their own pending edit requests
- Moderators can view all edit requests
- Audit trail logs all moderator actions

**Design Decision:** Leverage existing role-based access control (RBAC) system. Don't create separate permission system for moderation.

### Rate Limiting

**Edit Submission Limits:**
- 10 edits per hour per user
- 50 edits per day per user
- Use existing `lib/server-rate-limit.ts`

**API Rate Limits:**
- Moderation API routes: 100 requests/minute per moderator
- Public API routes: 20 requests/minute per user

**Design Decision:** Apply stricter rate limits to prevent abuse while allowing legitimate moderation work.

### Input Validation

**Edit Request Validation:**
- Validate content type against allowed values
- Sanitize HTML in changes to prevent XSS
- Validate JSON structure of changes field
- Check content ID exists before creating edit request

**Link Validation:**
- Validate domain format (no malformed URLs)
- Check for homograph attacks (IDN domains)
- Prevent bypass attempts (URL encoding, redirects)

**Design Decision:** Use Zod schemas for all input validation. Sanitize user input at API boundaries.

### Audit Trail

**Logged Actions:**
- Edit request creation (user, content, timestamp)
- Edit approval/rejection (moderator, reason, timestamp)
- Bulk operations (moderator, targets, timestamp)
- Link whitelist/blacklist changes (moderator, domain, timestamp)

**Audit Log Retention:**
- Keep all audit logs indefinitely
- Index by user ID, moderator ID, and timestamp
- Use existing `lib/audit.ts` infrastructure

**Design Decision:** Comprehensive audit logging for accountability and debugging. No automatic deletion of audit records.


## Performance Considerations

### Database Optimization

**Indexes:**
- `EditRequest.status + createdAt` - For queue queries
- `EditRequest.contentType + status` - For filtering by content type
- `EditRequest.userId + createdAt` - For user edit history
- `EditRequest.isCOI/isFlaggedHealth/isNewPage + status` - For specialized queues
- `LinkWhitelist.domain` and `LinkBlacklist.domain` - For fast link validation

**Query Optimization:**
- Use pagination for all list queries (default 50 items per page)
- Implement cursor-based pagination for large datasets
- Cache frequently accessed data (whitelist/blacklist domains)

**Design Decision:** Add indexes proactively based on expected query patterns. Monitor slow queries in production and optimize as needed.

### Caching Strategy

**Link Validation Cache:**
- Cache whitelist/blacklist domains in memory
- Refresh cache every 5 minutes or on update
- Use existing `lib/cache.ts` infrastructure

**Queue Count Cache:**
- Cache queue item counts for dashboard display
- Refresh every 30 seconds
- Invalidate on edit request status change

**Design Decision:** Use in-memory caching for frequently accessed, slowly changing data. Implement cache invalidation on writes.

### Diff Calculation Performance

**Optimization Strategies:**
- Calculate diffs asynchronously when creating edit requests
- Store pre-calculated diffs in `changes` JSON field
- Limit diff size for very large content (truncate after 10,000 characters)
- Use efficient diff algorithm (Myers' algorithm via existing implementation)

**Design Decision:** Pre-calculate diffs on submission rather than on-demand to improve dashboard load times.

### Bulk Operation Performance

**Batch Processing:**
- Process bulk operations in batches of 100 items
- Use Prisma batch operations (`updateMany`, `deleteMany`)
- Implement progress tracking for large operations
- Run bulk operations in background job for >1000 items

**Design Decision:** Balance between immediate feedback and system load. Use background jobs for very large operations.


## Migration Strategy

### Database Migration

**Schema Changes:**
1. Create `EditRequest` table with all fields and indexes
2. Create `LinkWhitelist` and `LinkBlacklist` tables
3. Create `ModerationCategory` table
4. Add relations to existing `User` table
5. Extend `AuditLog` table if needed

**Migration Steps:**
```bash
# Generate migration
npx prisma migrate dev --name add_moderation_system

# Review migration SQL
# Apply to development database
npx prisma migrate deploy

# Seed initial data (predefined categories, common whitelisted domains)
npx prisma db seed
```

**Design Decision:** Use Prisma migrations for all schema changes. Test migrations on development database before production deployment.

### Feature Rollout

**Phase 1: Shadow Mode (Week 1)**
- Deploy edit request creation without enforcing approval
- Log edit requests but also apply changes immediately
- Monitor for issues and gather metrics

**Phase 2: Soft Launch (Week 2)**
- Enable approval requirement for new pages only
- Existing content edits still apply immediately
- Train moderators on dashboard usage

**Phase 3: Full Rollout (Week 3+)**
- Enable approval requirement for all content types
- Monitor queue backlog and moderator capacity
- Adjust rate limits based on usage patterns

**Design Decision:** Gradual rollout minimizes risk and allows iterative improvements based on real usage data.

### Backward Compatibility

**Existing Edit Forms:**
- Maintain existing form components
- Intercept submissions at API layer
- No breaking changes to form interfaces

**Existing API Routes:**
- Keep existing direct update endpoints for backward compatibility
- Add new moderation-aware endpoints
- Deprecate old endpoints after migration complete

**Design Decision:** Minimize changes to existing code. Add new functionality alongside old rather than replacing.


## Monitoring & Observability

### Metrics to Track

**Queue Health:**
- Number of pending edit requests by queue type
- Average time to approval/rejection
- Queue backlog growth rate
- Moderator response time

**User Behavior:**
- Edit submission rate by content type
- Rate limit hits per user
- Edit approval rate
- Edit rejection reasons

**System Performance:**
- API response times for moderation endpoints
- Database query performance
- Cache hit rates
- Bulk operation completion times

**Design Decision:** Use existing monitoring infrastructure. Add custom metrics for moderation-specific KPIs.

### Alerting

**Critical Alerts:**
- Queue backlog exceeds 1000 items
- Average approval time exceeds 24 hours
- API error rate exceeds 5%
- Database query time exceeds 1 second

**Warning Alerts:**
- Queue backlog exceeds 500 items
- Moderator capacity below 50%
- Cache miss rate exceeds 20%

**Design Decision:** Set up proactive alerts to catch issues before they impact users. Integrate with existing alerting system.

### Logging

**Structured Logs:**
- All moderation actions with context (user, moderator, content, timestamp)
- API request/response logs with timing
- Error logs with stack traces
- Performance logs for slow operations

**Log Retention:**
- Application logs: 30 days
- Audit logs: Indefinite
- Performance logs: 7 days

**Design Decision:** Use structured logging (JSON format) for easy parsing and analysis. Separate audit logs from application logs.


## Open Questions & Decisions Needed

### 1. Context7 Constraints for Cursor Hook

**Question:** What are the specific constraints or limitations of Context7 mentioned in Requirement 1?

**Impact:** Affects implementation approach for test automation hook.

**Recommendation:** Clarify Context7 requirements before implementing Phase 5 (Developer Tooling).

### 2. Moderator Capacity Planning

**Question:** How many moderators will be available? What is the expected edit volume?

**Impact:** Affects queue prioritization strategy and rate limit settings.

**Recommendation:** Start with conservative rate limits (10/hour, 50/day) and adjust based on actual usage.

### 3. Auto-Approval Rules

**Question:** Should certain edits be auto-approved (e.g., minor typo fixes, trusted users)?

**Impact:** Could reduce moderator workload significantly.

**Recommendation:** Implement basic auto-approval for trusted users (reputation > threshold) in Phase 4.

### 4. Edit Request Expiration

**Question:** Should old pending edit requests expire automatically?

**Impact:** Prevents stale edits from cluttering queues.

**Recommendation:** Auto-reject edit requests older than 30 days with notification to user.

### 5. Notification Strategy

**Question:** How should users be notified of edit approval/rejection?

**Impact:** Affects user experience and engagement.

**Recommendation:** Use existing notification system (`lib/notifications.ts`). Send in-app notification + optional email.

### 6. Diff Format for Complex Content

**Question:** How to handle diffs for rich content (images, embedded media, complex formatting)?

**Impact:** Affects diff calculation and display complexity.

**Recommendation:** Start with text-based diffs. Add rich content diff support in future iteration.

### 7. Bulk Operation Limits

**Question:** What are reasonable limits for bulk operations (max items per operation)?

**Impact:** Affects system load and abuse prevention.

**Recommendation:** Limit to 1000 items per bulk operation. Require additional confirmation for >100 items.


## Dependencies & Prerequisites

### External Dependencies

**No New Dependencies Required:**
- All functionality can be implemented using existing dependencies
- Prisma for database operations
- Next.js App Router for API routes
- React for UI components
- TypeScript for type safety

**Existing Dependencies to Leverage:**
- `lib/diff-utils.ts` - Diff calculation
- `lib/audit.ts` - Audit logging
- `lib/auth-server.ts` - Authentication
- `lib/server-rate-limit.ts` - Rate limiting
- `lib/cache.ts` - Caching
- `lib/notifications.ts` - User notifications
- `components/diff-viewer.tsx` - Diff display
- `components/ui/*` - UI primitives

**Design Decision:** Maximize use of existing infrastructure to reduce complexity and maintain consistency.

### Prerequisites

**Before Starting Implementation:**
1. Ensure Prisma is properly configured and migrations are working
2. Verify existing auth system supports role-based access control
3. Confirm audit logging is functional
4. Test rate limiting infrastructure
5. Review existing diff calculation logic

**Development Environment:**
- Node.js 18+ (as per existing setup)
- PostgreSQL database (as per existing setup)
- Next.js 14+ (as per existing setup)

### Team Knowledge Requirements

**Required Skills:**
- TypeScript and React expertise
- Next.js App Router patterns
- Prisma ORM usage
- Database schema design
- Testing with Jest and Playwright

**Nice to Have:**
- Experience with moderation systems
- Understanding of diff algorithms
- Familiarity with AST parsing (for Cursor hook)


## Success Criteria

### Bug Fixes

**Groups Page Hydration:**
-  No hydration errors in browser console
-  Page loads successfully on first render
-  Categories display correctly
-  Passes local build validation

**Group Resources Routing:**
-  `/groups/[slug]/resources/create` returns 200 status
-  Resource creation form displays
-  Form submission works correctly
-  Regression test passes

**CreatePostButton:**
-  Component renders without errors
-  No React hook violations
-  Build completes successfully
-  Button functionality works as expected

### Moderation System

**Core Functionality:**
-  Edit requests are created for all content types
-  Rate limiting enforces 10/hour and 50/day limits
-  Moderators can view all pending edit requests
-  Approve/reject actions work correctly
-  Content updates only after approval
-  Users receive notifications of approval/rejection

**Dashboard Usability:**
-  Recent changes feed loads in <2 seconds
-  Diffs display clearly with additions/deletions highlighted
-  Filtering and sorting work as expected
-  Bulk operations complete successfully
-  Link management UI is intuitive

**Performance:**
-  API response times <500ms for queue queries
-  Diff calculation completes in <1 second
-  Bulk operations handle 1000 items without timeout
-  Cache hit rate >80% for link validation

**Testing:**
-  Unit test coverage >80% for moderation modules
-  All integration tests pass
-  E2E tests cover critical moderation workflows
-  No regressions in existing functionality

### Developer Tooling

**Cursor Hook:**
-  Detects function edits automatically
-  Identifies related test files correctly
-  Generates or updates test scaffolding
-  Runs affected tests successfully
-  Reports results to developer

**Documentation:**
-  Moderator user guide is complete and clear
-  API documentation covers all endpoints
-  Developer integration guide is available
-  Code comments explain complex logic


## Future Enhancements

### Phase 7+: Advanced Features (Not in Current Scope)

**Machine Learning for Auto-Moderation:**
- Train ML model to classify edit quality
- Auto-approve high-confidence good edits
- Flag high-confidence problematic edits for priority review

**Collaborative Editing:**
- Allow multiple users to suggest edits to same content
- Merge suggestions intelligently
- Show edit conflicts and resolution UI

**Moderation Analytics Dashboard:**
- Visualize queue trends over time
- Track moderator performance metrics
- Identify content areas needing attention

**Mobile Moderation App:**
- Native mobile app for moderators
- Push notifications for urgent reviews
- Simplified mobile-optimized UI

**Advanced Diff Visualization:**
- Side-by-side diff view
- Syntax highlighting for code blocks
- Rich media diff support (images, videos)

**Reputation-Based Auto-Approval:**
- Trusted users (high reputation) get auto-approved edits
- New users require more scrutiny
- Dynamic trust scoring based on edit history

**Edit Templates:**
- Pre-defined edit templates for common changes
- Guided editing workflows
- Reduced errors and faster submissions

**Moderation API for Third-Party Tools:**
- Public API for moderation actions
- Webhooks for edit events
- Integration with external moderation services

**Design Decision:** These enhancements are valuable but not required for MVP. Prioritize based on user feedback and usage patterns after initial launch.


## Conclusion

This design document provides a comprehensive blueprint for addressing all pending work items in the Pet Social Network codebase. The approach is structured into clear phases, starting with critical bug fixes and progressing through moderation infrastructure, dashboard implementation, advanced features, developer tooling, and comprehensive testing.

**Key Design Principles:**

1. **Incremental Development:** Build in phases to deliver value early and iterate based on feedback
2. **Leverage Existing Infrastructure:** Maximize use of existing code, patterns, and dependencies
3. **Security First:** Implement proper authentication, authorization, and audit logging from the start
4. **Performance Conscious:** Design with scalability in mind through proper indexing, caching, and batch processing
5. **Test-Driven:** Maintain high test coverage to ensure quality and prevent regressions
6. **User-Centric:** Prioritize user experience for both moderators and content creators

**Next Steps:**

1. Review and approve this design document
2. Create detailed implementation tasks in tasks.md
3. Begin Phase 1 (Critical Bug Fixes)
4. Iterate through subsequent phases
5. Gather feedback and adjust as needed

The estimated total effort of 14-22 days assumes a single developer working full-time. This can be parallelized across multiple developers or adjusted based on team capacity and priorities.
