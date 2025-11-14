# Moderator Dashboard Implementation

## Overview
A comprehensive moderator dashboard has been implemented with full support for flagged edits, reported articles/comments, rollback history, and COI (Conflict of Interest) flags.

## Features Implemented

### 1. Flagged Edits Management
- **Location**: `/app/admin/moderation` - "Flagged Edits" tab
- **Features**:
  - View pending, approved, and rejected edit requests
  - Filter by content type (blog, wiki, pet, user), status, priority, and age
  - Statistics dashboard showing pending count, approval rate, and average processing time
  - Approve/reject actions with reason tracking
  - Complete audit trail for each edit request
  - Pagination support

### 2. Reported Articles & Comments
- **Location**: `/app/admin/moderation` - "Reports" tab
- **Features**:
  - View all reported articles (blog posts and wiki articles)
  - View flagged comments with flag counts
  - Filter by report status (pending, reviewed, resolved, dismissed)
  - Resolve or dismiss reports with resolution notes
  - Display reporter information and reasons

### 3. Rollback History
- **Location**: `/app/admin/moderation` - "Rollback History" tab
- **Features**:
  - Complete audit trail of all rollback operations
  - Search by content ID or reason
  - Filter by content type (blog/wiki)
  - Shows who performed the rollback, when, and why
  - Displays version information (rolled back from → to)
  - Automatic history creation when rollbacks are performed

### 4. COI (Conflict of Interest) Flags
- **Location**: `/app/admin/moderation` - "COI Flags" tab
- **Features**:
  - View active COI flags with severity levels (low, medium, high, critical)
  - Filter by severity level
  - Create new COI flags with reason, details, and severity
  - Resolve COI flags with resolution notes
  - Track related entities (brands, organizations)
  - Automatic flag tracking in both global list and content items

## Data Models

### ArticleReport
```typescript
interface ArticleReport {
  id: string
  reporterId: string
  reason: "spam" | "misinformation" | "inappropriate" | "copyright" | "other"
  message?: string
  reportedAt: string
  status?: "pending" | "reviewed" | "resolved" | "dismissed"
  reviewedBy?: string
  reviewedAt?: string
  resolution?: string
}
```

### COIFlag
```typescript
interface COIFlag {
  id: string
  flaggedBy: string
  flaggedAt: string
  reason: string
  details?: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "resolved" | "dismissed"
  resolvedBy?: string
  resolvedAt?: string
  resolution?: string
  relatedEntities?: string[]
}
```

### RollbackHistoryEntry
```typescript
interface RollbackHistoryEntry {
  id: string
  contentId: string
  contentType: "blog" | "wiki"
  rolledBackFrom: string
  rolledBackTo: string
  performedBy: string
  performedAt: string
  reason?: string
  metadata?: Record<string, unknown>
}
```

## Storage Functions

### Rollback History
- `getRollbackHistory()` - Get all rollback history entries (sorted by date descending)
- `getRollbackHistoryByContentId(contentId)` - Get rollbacks for specific content
- `getRollbackHistoryByContentType(contentType)` - Get rollbacks by content type
- `addRollbackHistoryEntry(entry)` - Add new rollback history entry

### Article Reporting
- `reportArticle(params)` - Report an article/blog post
- `getArticleReports()` - Get all article reports
- `getPendingArticleReports()` - Get pending reports only
- `updateArticleReport(reportId, updates)` - Update report status/resolution

### COI Flags
- `addCOIFlag(params)` - Add a COI flag to content
- `getCOIFlags()` - Get all COI flags
- `getActiveCOIFlags()` - Get active flags only
- `getCOIFlagsBySeverity(severity)` - Filter by severity level
- `updateCOIFlag(flagId, updates)` - Update flag status/resolution

## Access Control
- Dashboard is restricted to users with `role: "admin"` or `role: "moderator"`
- Non-authorized users see a permission error message

## UI Components
- Uses TailwindCSS for all styling (no inline CSS)
- Responsive design with proper spacing and layout
- Badges for status indicators
- Dialog modals for actions (approve, reject, resolve, etc.)
- Search and filter capabilities
- Tabbed interface for easy navigation

## Testing
Comprehensive test suite created at `lib/__tests__/moderation-dashboard.test.ts` covering:
- Rollback history operations
- Article reporting operations
- COI flag operations
- Integration tests for rollback history creation

## Integration Points

### Automatic Rollback History
When `rollbackToStableRevision()` is called, it automatically:
1. Creates a rollback history entry
2. Updates the article content
3. Creates a moderation action audit log

### Article Reporting Flow
1. User reports article via `reportArticle()`
2. Report is added to article's `reports` array
3. Report is stored in global reports list for dashboard
4. Moderator reviews and resolves/dismisses via dashboard

### COI Flag Flow
1. Moderator/admin creates COI flag via `addCOIFlag()`
2. Flag is added to content's `coiFlags` array
3. Flag is stored in global COI flags list
4. Updates sync between global list and content items

## Files Modified/Created

### New Files
- `app/admin/moderation/page.tsx` - Comprehensive moderator dashboard
- `lib/__tests__/moderation-dashboard.test.ts` - Test suite

### Modified Files
- `lib/types.ts` - Added ArticleReport, COIFlag, RollbackHistoryEntry types
- `lib/storage.ts` - Added storage functions for reports, COI flags, rollback history
- Enhanced `rollbackToStableRevision()` to create history entries

## Usage Examples

### Reporting an Article
```typescript
import { reportArticle } from '@/lib/storage'

const result = await reportArticle({
  articleId: 'blog-123',
  contentType: 'blog',
  reporterId: 'user-456',
  reason: 'misinformation',
  message: 'Contains incorrect information about pet care'
})
```

### Adding a COI Flag
```typescript
import { addCOIFlag } from '@/lib/storage'

const result = await addCOIFlag({
  contentId: 'wiki-789',
  contentType: 'wiki',
  flaggedBy: 'moderator-1',
  reason: 'Author has financial interest in mentioned brand',
  details: 'Author is employed by Brand X',
  severity: 'high',
  relatedEntities: ['brand-x']
})
```

### Viewing Rollback History
```typescript
import { getRollbackHistoryByContentId } from '@/lib/storage'

const history = getRollbackHistoryByContentId('wiki-789')
// Returns all rollbacks for that content, sorted by date (newest first)
```

## 5. Recent Changes Feed Component
- **Location**: `components/admin/RecentChangesFeed.tsx`
- **Features**:
  - Reusable client component for displaying edit requests
  - Paginated feed with customizable page size
  - Advanced filtering by content type, status, priority, and age
  - Visual diff viewer integration (expandable/collapsible)
  - Inline approve/reject actions with loading states
  - Metadata badges (COI, Health, New Page, Images)
  - Responsive card-based layout
  - Error handling and empty states
  - Real-time action feedback

### Component API
```typescript
interface RecentChangesFeedProps {
  filters?: {
    contentType?: string[]
    status?: string[]
    priority?: string[]
    ageInDays?: number
  }
  pageSize?: number
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  className?: string
}
```

### Usage Example
```tsx
import { RecentChangesFeed } from '@/components/admin/RecentChangesFeed'

<RecentChangesFeed
  filters={{
    status: ['pending'],
    priority: ['high', 'urgent'],
    ageInDays: 7
  }}
  pageSize={20}
  onApprove={async (id) => {
    await fetch(`/api/admin/moderation/approve/${id}`, { method: 'POST' })
  }}
  onReject={async (id) => {
    await fetch(`/api/admin/moderation/reject/${id}`, { method: 'POST' })
  }}
/>
```

### API Integration
The component integrates with the REST API endpoint:
- `GET /api/admin/moderation/recent-changes` ✅ **Implemented**

**Location**: `app/api/admin/moderation/recent-changes/route.ts`

Query parameters:
- `page` - Page number (1-indexed, default: 1)
- `limit` - Items per page (1-100, default: 50)
- `contentType` - Comma-separated content types (blog, wiki, pet, profile)
- `status` - Comma-separated statuses (pending, approved, rejected)
- `priority` - Comma-separated priorities (low, normal, high, urgent)
- `ageInDays` - Filter by age in days (default: 30)

Response format:
```typescript
{
  items: EditRequest[]
  total: number
  page: number
  limit: number
  totalPages: number
  metadata?: {
    filters: { ... }
    availableFilters: { ... }
  }
}
```

**Security**: Requires moderator role. Returns 403 for unauthorized access.

For complete API documentation, see [RECENT_CHANGES_FEED.md](./RECENT_CHANGES_FEED.md).

## Future Enhancements
1. Email notifications for report resolutions
2. Bulk actions for processing multiple reports/flags
3. Advanced filtering and search capabilities
4. Export functionality for audit trails
5. Dashboard analytics and reporting
6. Integration with external moderation services

