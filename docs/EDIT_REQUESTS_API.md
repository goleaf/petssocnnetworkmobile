# Edit Requests API Documentation

## Overview

The Edit Requests system provides a moderation workflow for content changes. Instead of directly updating content, users submit edit requests that are reviewed by moderators before being applied.

## Storage Layer

**Location**: `lib/storage/edit-requests.ts`

All database operations use Prisma exclusively. The storage layer provides CRUD operations, specialized queues, and approval/rejection workflows with transaction support.

## Data Model

### EditRequest

```typescript
interface EditRequest {
  id: string;                    // Unique identifier
  contentType: string;           // 'blog' | 'wiki' | 'pet' | 'profile'
  contentId: string;             // ID of the content being edited
  userId: string;                // User who submitted the edit
  changes: Record<string, any>;  // Structured diff of changes
  reason?: string;               // Optional reason for the edit
  status: string;                // 'pending' | 'approved' | 'rejected'
  priority: string;              // 'low' | 'normal' | 'high' | 'urgent'
  reviewedBy?: string;           // Moderator who reviewed
  reviewedAt?: Date;             // When it was reviewed
  isCOI: boolean;                // Conflict of interest flag
  isFlaggedHealth: boolean;      // Health-related content flag
  isNewPage: boolean;            // New page creation flag
  hasImages: boolean;            // Contains images flag
  categories: string[];          // Internal triage categories
  createdAt: Date;               // When created
  updatedAt: Date;               // Last updated
}
```

### Input Types

```typescript
interface CreateEditRequestInput {
  contentType: 'blog' | 'wiki' | 'pet' | 'profile';
  contentId: string;
  userId: string;
  changes: Record<string, unknown>;
  reason?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isCOI?: boolean;
  isFlaggedHealth?: boolean;
  isNewPage?: boolean;
  hasImages?: boolean;
  categories?: string[];
}

interface UpdateEditRequestInput {
  status?: 'pending' | 'approved' | 'rejected';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  isCOI?: boolean;
  isFlaggedHealth?: boolean;
  isNewPage?: boolean;
  hasImages?: boolean;
  categories?: string[];
}

interface QueueFilters {
  contentType?: string[];
  status?: string[];
  priority?: string[];
  ageInDays?: number;
  categories?: string[];
  userId?: string;
  reviewedBy?: string;
}

interface Pagination {
  page?: number;    // Default: 1
  limit?: number;   // Default: 50
}
```

## Diff Calculation Utilities

**Location**: `lib/diff-utils.ts`

The diff utilities provide functions to calculate structured diffs for edit requests. These functions generate JSON-serializable diff objects that track additions, modifications, and deletions.

### calculateEditRequestDiff

Core diff calculation function that compares two content objects.

```typescript
function calculateEditRequestDiff(
  oldContent: Record<string, unknown>,
  newContent: Record<string, unknown>
): Record<string, { old: unknown; new: unknown; type: 'added' | 'modified' | 'deleted' }>
```

**Example**:
```typescript
import { calculateEditRequestDiff } from '@/lib/diff-utils';

const diff = calculateEditRequestDiff(
  { title: 'Old Title', content: 'Old content' },
  { title: 'New Title', content: 'Old content', tags: ['new'] }
);

// Result:
// {
//   title: { old: 'Old Title', new: 'New Title', type: 'modified' },
//   tags: { old: null, new: ['new'], type: 'added' }
// }
```

### Content-Specific Diff Functions

Specialized diff functions for each content type:

#### calculateBlogDiff

```typescript
function calculateBlogDiff(
  oldPost: { title?: string; content?: string; coverImage?: string | null; tags?: string[]; categories?: string[] },
  newPost: { title?: string; content?: string; coverImage?: string | null; tags?: string[]; categories?: string[] }
): Record<string, unknown>
```

**Example**:
```typescript
import { calculateBlogDiff } from '@/lib/diff-utils';

const diff = calculateBlogDiff(
  { title: 'Old Title', tags: ['old'] },
  { title: 'New Title', tags: ['new', 'updated'] }
);
```

#### calculateWikiDiff

```typescript
function calculateWikiDiff(
  oldArticle: { title?: string; content?: string; status?: string },
  newArticle: { title?: string; content?: string; status?: string }
): Record<string, unknown>
```

#### calculatePetDiff

```typescript
function calculatePetDiff(
  oldPet: { name?: string; bio?: string | null; breed?: string | null; birthday?: string | null; weight?: string | null },
  newPet: { name?: string; bio?: string | null; breed?: string | null; birthday?: string | null; weight?: string | null }
): Record<string, unknown>
```

#### calculateProfileDiff

```typescript
function calculateProfileDiff(
  oldProfile: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null },
  newProfile: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null }
): Record<string, unknown>
```

**Usage in Edit Request Creation**:
```typescript
import { calculateBlogDiff } from '@/lib/diff-utils';

const oldPost = await getBlogPost(postId);
const changes = calculateBlogDiff(
  { title: oldPost.title, content: oldPost.content },
  { title: formData.title, content: formData.content }
);

await createEditRequest({
  contentType: 'blog',
  contentId: postId,
  userId: currentUser.id,
  changes, // Structured diff object
  reason: 'Updated content'
});
```

---

## Core Functions

### createEditRequest

Creates a new edit request.

```typescript
async function createEditRequest(
  data: CreateEditRequestInput
): Promise<EditRequest>
```

**Example**:
```typescript
import { calculateBlogDiff } from '@/lib/diff-utils';

// Calculate diff before creating edit request
const changes = calculateBlogDiff(
  { title: 'Old Title', content: 'Old content...' },
  { title: 'New Title', content: 'New content...' }
);

const editRequest = await createEditRequest({
  contentType: 'blog',
  contentId: 'post_123',
  userId: 'user_456',
  changes, // Structured diff from calculateBlogDiff
  reason: 'Fixed typo in title and updated content',
  priority: 'normal',
  isFlaggedHealth: false
});
```

**Returns**: Created EditRequest object

**Throws**: Error if creation fails

---

### getEditRequest

Retrieves an edit request by ID with user and reviewer relations.

```typescript
async function getEditRequest(id: string): Promise<EditRequest | null>
```

**Example**:
```typescript
const editRequest = await getEditRequest('edit_123');
if (editRequest) {
  console.log('Submitted by:', editRequest.user.username);
  console.log('Changes:', editRequest.changes);
}
```

**Returns**: EditRequest with user/reviewer data or null if not found

---

### updateEditRequest

Updates an existing edit request.

```typescript
async function updateEditRequest(
  id: string,
  data: UpdateEditRequestInput
): Promise<EditRequest>
```

**Example**:
```typescript
const updated = await updateEditRequest('edit_123', {
  priority: 'high',
  categories: ['needs-review', 'health-content']
});
```

**Returns**: Updated EditRequest

**Throws**: Error if update fails or edit request not found

---

### deleteEditRequest

Deletes an edit request.

```typescript
async function deleteEditRequest(id: string): Promise<void>
```

**Example**:
```typescript
await deleteEditRequest('edit_123');
```

**Throws**: Error if deletion fails

---

### listEditRequests

Lists edit requests with filtering and pagination.

```typescript
async function listEditRequests(
  filters?: QueueFilters,
  pagination?: Pagination
): Promise<PaginatedResult<EditRequest>>
```

**Example**:
```typescript
const result = await listEditRequests(
  {
    status: ['pending'],
    contentType: ['blog', 'wiki'],
    priority: ['high', 'urgent'],
    ageInDays: 7
  },
  { page: 1, limit: 20 }
);

console.log(`Found ${result.total} edit requests`);
console.log(`Page ${result.page} of ${result.totalPages}`);
result.items.forEach(item => {
  console.log(`- ${item.contentType}: ${item.id}`);
});
```

**Returns**:
```typescript
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

### getQueueItems

Gets edit requests for specialized moderation queues.

```typescript
async function getQueueItems(
  queueType: 'new-pages' | 'flagged-health' | 'coi-edits' | 'image-reviews',
  filters?: QueueFilters,
  pagination?: Pagination
): Promise<PaginatedResult<EditRequest>>
```

**Queue Types**:
- `new-pages`: New content creation (isNewPage = true)
- `flagged-health`: Health-related edits (isFlaggedHealth = true)
- `coi-edits`: Conflict of interest edits (isCOI = true)
- `image-reviews`: Edits with images (hasImages = true)

**Example**:
```typescript
// Get all pending health-related edits
const healthEdits = await getQueueItems(
  'flagged-health',
  { priority: ['high', 'urgent'] },
  { page: 1, limit: 20 }
);

// Get all new page submissions
const newPages = await getQueueItems(
  'new-pages',
  {},
  { page: 1, limit: 50 }
);
```

**Returns**: Paginated list of EditRequests sorted by priority (desc) then createdAt (desc)

---

### getRecentChanges

Gets recent changes feed with filtering.

```typescript
async function getRecentChanges(
  filters?: QueueFilters,
  pagination?: Pagination
): Promise<PaginatedResult<EditRequest>>
```

**Example**:
```typescript
// Get all changes from last 7 days
const recentChanges = await getRecentChanges(
  { ageInDays: 7, status: ['pending', 'approved'] },
  { page: 1, limit: 50 }
);
```

**Note**: Defaults to last 30 days if ageInDays not specified

---

### approveEditRequest

Approves an edit request and applies changes to content.

```typescript
async function approveEditRequest(
  id: string,
  reviewerId: string
): Promise<EditRequest>
```

**Transaction Flow**:
1. Validates edit request exists and is pending
2. Updates status to 'approved'
3. Applies changes to actual content (blog/wiki/pet/profile)
4. Logs action to audit trail
5. Sends notification to user

**Example**:
```typescript
try {
  const approved = await approveEditRequest('edit_123', 'moderator_456');
  console.log('Edit approved and applied:', approved.id);
} catch (error) {
  console.error('Approval failed:', error.message);
}
```

**Returns**: Approved EditRequest

**Throws**: 
- Error if edit request not found
- Error if edit request not pending
- Error if content update fails

**Content Updates**:
- **Blog**: Updates title, content, coverImage, tags, categories
- **Wiki**: Updates title, status
- **Pet**: Updates name, bio, breed, birthday, weight
- **Profile**: Updates displayName, bio, avatarUrl

---

### rejectEditRequest

Rejects an edit request with a reason.

```typescript
async function rejectEditRequest(
  id: string,
  reviewerId: string,
  reason: string
): Promise<EditRequest>
```

**Transaction Flow**:
1. Validates edit request exists and is pending
2. Updates status to 'rejected'
3. Logs action to audit trail with reason
4. Sends notification to user with rejection reason

**Example**:
```typescript
const rejected = await rejectEditRequest(
  'edit_123',
  'moderator_456',
  'Content does not meet quality guidelines. Please provide more detail.'
);
```

**Returns**: Rejected EditRequest

**Throws**:
- Error if edit request not found
- Error if edit request not pending

---

## Usage Patterns

### Creating Edit Requests from Forms

```typescript
import { calculateBlogDiff } from '@/lib/diff-utils';

// In blog edit form submission
async function handleBlogEdit(postId: string, formData: any) {
  // Fetch original content
  const originalPost = await getBlogPost(postId);
  
  // Calculate structured diff
  const changes = calculateBlogDiff(
    {
      title: originalPost.title,
      content: originalPost.content,
      coverImage: originalPost.coverImage,
      tags: originalPost.tags,
      categories: originalPost.categories
    },
    {
      title: formData.title,
      content: formData.content,
      coverImage: formData.coverImage,
      tags: formData.tags,
      categories: formData.categories
    }
  );
  
  const editRequest = await createEditRequest({
    contentType: 'blog',
    contentId: postId,
    userId: currentUser.id,
    changes, // Structured diff object
    reason: formData.editReason,
    priority: 'normal'
  });
  
  // Show success message
  toast.success('Edit submitted for review');
  
  // Redirect to content page
  router.push(`/blog/${postId}`);
}
```

### Building Moderation Dashboard

```typescript
// Recent changes feed
async function loadRecentChanges(page: number) {
  const result = await getRecentChanges(
    {
      status: ['pending'],
      ageInDays: 30
    },
    { page, limit: 20 }
  );
  
  return result;
}

// Specialized queue
async function loadHealthQueue(page: number) {
  const result = await getQueueItems(
    'flagged-health',
    { priority: ['high', 'urgent'] },
    { page, limit: 20 }
  );
  
  return result;
}
```

### Handling Approvals/Rejections

```typescript
// Approve handler
async function handleApprove(editRequestId: string) {
  try {
    await approveEditRequest(editRequestId, currentModerator.id);
    toast.success('Edit approved and applied');
    refreshQueue();
  } catch (error) {
    toast.error(`Approval failed: ${error.message}`);
  }
}

// Reject handler
async function handleReject(editRequestId: string, reason: string) {
  try {
    await rejectEditRequest(editRequestId, currentModerator.id, reason);
    toast.success('Edit rejected');
    refreshQueue();
  } catch (error) {
    toast.error(`Rejection failed: ${error.message}`);
  }
}
```

## Error Handling

All functions throw errors with descriptive messages:

```typescript
try {
  await approveEditRequest(id, reviewerId);
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle not found
  } else if (error.message.includes('not pending')) {
    // Handle invalid status
  } else {
    // Handle other errors
  }
}
```

## Performance Considerations

### Indexes

The EditRequest model has indexes on:
- `userId` - Fast lookup by submitter
- `reviewedBy` - Fast lookup by reviewer
- `status` - Fast filtering by status
- `contentType` - Fast filtering by content type
- `priority` - Fast sorting by priority
- `createdAt` - Fast sorting by date
- `isCOI`, `isFlaggedHealth`, `isNewPage`, `hasImages` - Fast queue filtering

### Pagination

Always use pagination for large result sets:

```typescript
// Good: Paginated query
const result = await listEditRequests({}, { page: 1, limit: 50 });

// Bad: Loading all results
const result = await listEditRequests({}, { limit: 10000 });
```

### Selective Loading

Use filters to reduce result set size:

```typescript
// Only load what you need
const result = await listEditRequests({
  status: ['pending'],
  contentType: ['blog'],
  ageInDays: 7
}, { page: 1, limit: 20 });
```

## Integration with Audit System

All approval and rejection operations automatically log to the audit trail:

```typescript
// Approval creates audit log entry
await approveEditRequest(id, reviewerId);
// Logs: action='approve_edit', targetType='edit_request', targetId=id

// Rejection creates audit log entry with reason
await rejectEditRequest(id, reviewerId, reason);
// Logs: action='reject_edit', targetType='edit_request', targetId=id, reason=reason
```

## Integration with Notifications

Approval and rejection operations send notifications to users:

```typescript
// On approval
createNotification({
  userId: editRequest.userId,
  type: 'system',
  message: 'Your edit to blog has been approved',
  metadata: { editRequestId, contentType, contentId }
});

// On rejection
createNotification({
  userId: editRequest.userId,
  type: 'system',
  message: 'Your edit to blog was not approved: [reason]',
  metadata: { editRequestId, contentType, contentId, rejectionReason }
});
```

## Testing

Example test structure:

```typescript
import {
  createEditRequest,
  approveEditRequest,
  rejectEditRequest
} from '@/lib/storage/edit-requests';

describe('Edit Requests', () => {
  it('creates edit request', async () => {
    const result = await createEditRequest({
      contentType: 'blog',
      contentId: 'post_123',
      userId: 'user_456',
      changes: { title: 'New Title' }
    });
    
    expect(result.status).toBe('pending');
    expect(result.contentType).toBe('blog');
  });
  
  it('approves edit request', async () => {
    const editRequest = await createEditRequest({...});
    const approved = await approveEditRequest(editRequest.id, 'mod_123');
    
    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe('mod_123');
  });
});
```

## API Routes

### GET /api/admin/moderation/queue-counts

Returns counts for all moderation queues with urgent item detection.

**Authentication**: Required (moderator or admin role)

**Response**:
```typescript
{
  queues: {
    'new-pages': number,        // Count of new page submissions
    'flagged-health': number,   // Count of health-related edits
    'coi-edits': number,        // Count of conflict of interest edits
    'image-reviews': number     // Count of edits with images
  },
  totalPending: number,         // Total pending items across all queues
  urgentCount: number,          // Count of urgent priority items
  hasUrgent: boolean            // Whether any urgent items exist
}
```

**Example**:
```typescript
const response = await fetch('/api/admin/moderation/queue-counts');
const data = await response.json();

console.log(`Total pending: ${data.totalPending}`);
console.log(`Urgent items: ${data.urgentCount}`);
console.log(`New pages: ${data.queues['new-pages']}`);

if (data.hasUrgent) {
  // Show urgent badge in navigation
}
```

**Usage in Navigation**:
```typescript
// Display queue counts as badges
function AdminNavigation() {
  const { data } = useSWR('/api/admin/moderation/queue-counts');
  
  return (
    <nav>
      <Link href="/admin/queue/new-pages">
        New Pages
        {data?.queues['new-pages'] > 0 && (
          <Badge>{data.queues['new-pages']}</Badge>
        )}
      </Link>
      
      <Link href="/admin/queue/flagged-health">
        Health Content
        {data?.queues['flagged-health'] > 0 && (
          <Badge variant={data.hasUrgent ? 'destructive' : 'default'}>
            {data.queues['flagged-health']}
          </Badge>
        )}
      </Link>
    </nav>
  );
}
```

**Error Responses**:
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User lacks moderator/admin role
- `500 Internal Server Error` - Database or server error

---

## Related Documentation

- [Database Architecture](./DATABASE_ARCHITECTURE.md) - Database schema and Prisma usage
- [Audit System](../doc/AUDIT_SYSTEM.md) - Audit logging integration
- [Moderation Feature](./MODERATION-FEATURE.md) - Media moderation system
