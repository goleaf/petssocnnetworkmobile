# Recent Changes Feed Component

## Overview
The `RecentChangesFeed` component is a reusable, client-side React component that displays a paginated feed of edit requests with visual diffs and moderation actions. It's designed for use in admin and moderator dashboards.

## Location
`components/admin/RecentChangesFeed.tsx`

## Features

### Core Functionality
- **Paginated Feed**: Displays edit requests with configurable page size
- **Visual Diffs**: Integrates with `DiffViewer` component for side-by-side change comparison
- **Inline Actions**: Approve/reject buttons with loading states
- **Advanced Filtering**: Filter by content type, status, priority, and age
- **Metadata Badges**: Visual indicators for COI, health flags, new pages, and images
- **Responsive Design**: Card-based layout that works on all screen sizes
- **Error Handling**: Graceful error states and empty state messages

### UI Components
- Card-based layout with shadcn/ui components
- Expandable/collapsible diff viewer
- Status and priority badges with color coding
- Pagination controls with page info
- Loading spinners during data fetch
- Alert messages for errors

## API Reference

### Props

```typescript
interface RecentChangesFeedProps {
  /** Filters to apply to the feed */
  filters?: {
    contentType?: string[]  // ['blog', 'wiki', 'pet', 'profile']
    status?: string[]        // ['pending', 'approved', 'rejected']
    priority?: string[]      // ['low', 'normal', 'high', 'urgent']
    ageInDays?: number       // Filter items from last N days
  }
  
  /** Number of items per page (default: 10) */
  pageSize?: number
  
  /** Callback when approve button is clicked */
  onApprove?: (id: string) => void | Promise<void>
  
  /** Callback when reject button is clicked */
  onReject?: (id: string) => void | Promise<void>
  
  /** Additional CSS classes */
  className?: string
}
```

### Data Types

The component uses types from `lib/types/moderation.ts`:

```typescript
interface EditRequest {
  id: string
  contentType: ContentType
  contentId: string
  userId: string
  status: EditRequestStatus
  priority: EditRequestPriority
  changes: Record<string, any>
  reason?: string
  reviewedBy?: string
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
  metadata: EditRequestMetadata
}

interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
```

## Usage Examples

### Basic Usage

```tsx
import { RecentChangesFeed } from '@/components/admin/RecentChangesFeed'

export default function ModerationPage() {
  return (
    <RecentChangesFeed
      pageSize={20}
      onApprove={async (id) => {
        await fetch(`/api/admin/moderation/approve/${id}`, {
          method: 'POST'
        })
      }}
      onReject={async (id) => {
        await fetch(`/api/admin/moderation/reject/${id}`, {
          method: 'POST'
        })
      }}
    />
  )
}
```

### With Filters

```tsx
<RecentChangesFeed
  filters={{
    status: ['pending'],
    priority: ['high', 'urgent'],
    contentType: ['wiki', 'blog'],
    ageInDays: 7
  }}
  pageSize={15}
/>
```

### Pending Items Only

```tsx
<RecentChangesFeed
  filters={{ status: ['pending'] }}
  pageSize={10}
  onApprove={handleApprove}
  onReject={handleReject}
/>
```

### High Priority Queue

```tsx
<RecentChangesFeed
  filters={{
    priority: ['urgent', 'high'],
    status: ['pending']
  }}
  pageSize={25}
/>
```

### With Custom Styling

```tsx
<RecentChangesFeed
  className="max-w-6xl mx-auto"
  filters={{ contentType: ['wiki'] }}
  pageSize={10}
/>
```

## API Endpoint Requirements

The component expects a REST API endpoint at:

```
GET /api/admin/moderation/recent-changes
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (1-indexed) |
| `limit` | number | Items per page |
| `contentType` | string | Comma-separated content types |
| `status` | string | Comma-separated statuses |
| `priority` | string | Comma-separated priorities |
| `ageInDays` | number | Filter by age in days |

### Response Format

```typescript
{
  items: EditRequest[],
  total: number,           // Total count of items
  page: number,            // Current page number
  limit: number,           // Items per page
  totalPages: number,      // Total number of pages
  metadata?: {             // Optional metadata
    filters: {
      contentType: string[],
      status: string[],
      priority: string[],
      ageInDays: number
    },
    availableFilters: {
      contentType: string[],
      status: string[],
      priority: string[]
    }
  }
}
```

**Note**: The component expects `totalCount`, `hasNextPage`, and `hasPreviousPage` fields. The API returns `total` instead of `totalCount`. The component calculates pagination state from the available fields.

### API Implementation

The API route is implemented at `app/api/admin/moderation/recent-changes/route.ts`.

**Key Features**:
- Requires moderator role (checks via `isModerator()`)
- Validates all query parameters
- Returns 400 for invalid parameters
- Returns 403 for unauthorized access
- Includes comprehensive error handling
- Sets `Cache-Control: no-store` header
- Supports pagination (max 100 items per page)
- Default age filter: 30 days

**Example Implementation**:

```typescript
// app/api/admin/moderation/recent-changes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isModerator } from '@/lib/auth-server'
import { getRecentChanges, type QueueFilters } from '@/lib/storage/edit-requests'

export async function GET(request: NextRequest) {
  // Check moderator permission
  const currentUser = await getCurrentUser()
  if (!currentUser || !(await isModerator())) {
    return NextResponse.json(
      { error: "Unauthorized. Moderator access required." },
      { status: 403 }
    )
  }

  // Parse and validate parameters
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  
  // Build filters from query params
  const filters: QueueFilters = {
    contentType: url.searchParams.get('contentType')?.split(','),
    status: url.searchParams.get('status')?.split(','),
    priority: url.searchParams.get('priority')?.split(','),
    ageInDays: url.searchParams.get('ageInDays') 
      ? parseInt(url.searchParams.get('ageInDays')!)
      : undefined
  }
  
  // Get recent changes
  const result = await getRecentChanges(filters, { page, limit })
  
  return NextResponse.json({
    items: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    metadata: {
      filters,
      availableFilters: {
        contentType: ['blog', 'wiki', 'pet', 'profile'],
        status: ['pending', 'approved', 'rejected'],
        priority: ['low', 'normal', 'high', 'urgent']
      }
    }
  })
}
```

**Validation Rules**:
- `page`: Must be >= 1
- `limit`: Must be between 1 and 100
- `contentType`: Must be one of: blog, wiki, pet, profile
- `status`: Must be one of: pending, approved, rejected
- `priority`: Must be one of: low, normal, high, urgent
- `ageInDays`: Must be a positive integer

## Badge Color Coding

### Priority Badges
- **Urgent**: Red (destructive variant)
- **High**: Default variant
- **Normal**: Secondary variant
- **Low**: Outline variant

### Status Badges
- **Approved**: Default variant (green)
- **Rejected**: Destructive variant (red)
- **Pending**: Secondary variant (gray)

### Metadata Badges
- **COI**: Orange outline
- **Health**: Red outline
- **New Page**: Blue outline
- **Images**: Purple outline

## Integration with DiffViewer

The component uses the existing `DiffViewer` component to display changes:

```tsx
<DiffViewer
  oldValue={request.changes.oldValue || ""}
  newValue={request.changes.newValue || ""}
  leftTitle="Original"
  rightTitle="Proposed"
  showCopyButton={false}
/>
```

The diff viewer is expandable/collapsible per edit request to improve performance and UX.

## State Management

The component manages several internal states:

- `data`: Paginated result from API
- `loading`: Loading state for initial fetch
- `error`: Error message if fetch fails
- `page`: Current page number
- `expandedId`: ID of currently expanded diff
- `actionLoading`: ID of item currently being acted upon

## Error Handling

### Network Errors
Displays an alert with error message:
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

### Empty State
Shows a friendly message when no items match filters:
```tsx
<Card>
  <CardContent className="p-8 text-center text-muted-foreground">
    No edit requests found matching the current filters.
  </CardContent>
</Card>
```

## Performance Considerations

1. **Lazy Diff Loading**: Diffs are only rendered when expanded
2. **Pagination**: Limits items per page to prevent performance issues
3. **Optimistic Updates**: Action buttons disable during processing
4. **Debounced Fetching**: Re-fetches only when filters/page change

## Accessibility

- Semantic HTML with proper heading hierarchy
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly status messages
- Color-blind friendly badge variants

## Testing

### Test Suite Location
Comprehensive tests are located at:
- `tests/active/components/admin/RecentChangesFeed.test.tsx` ✅ **Implemented**

### Test Coverage
The test suite covers:
- Loading states and spinners
- Error handling and display
- Empty state rendering
- Filter application
- Pagination controls
- Approve/reject actions
- Diff expansion/collapse
- Badge rendering
- Custom className application
- Custom page size

### Running Tests

```bash
# Run all tests
npm test

# Run component tests only
npm test RecentChangesFeed

# Run with coverage
npm test -- --coverage
```

### Unit Tests
Test the component with mock data:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecentChangesFeed } from '@/components/admin/RecentChangesFeed'

test('displays edit requests', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [mockEditRequest],
        totalCount: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      })
    })
  )
  
  render(<RecentChangesFeed />)
  
  await waitFor(() => {
    expect(screen.getByText('Blog Edit')).toBeInTheDocument()
  })
})

test('calls onApprove when approve button clicked', async () => {
  const onApprove = jest.fn().mockResolvedValue(undefined)
  
  render(<RecentChangesFeed onApprove={onApprove} />)
  
  await waitFor(() => {
    expect(screen.getByText('Approve')).toBeInTheDocument()
  })
  
  fireEvent.click(screen.getByText('Approve'))
  
  expect(onApprove).toHaveBeenCalledWith('edit1')
})
```

### Integration Tests
Test with actual API endpoint:

```typescript
test('fetches and displays data from API', async () => {
  // Mock API response
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        items: [mockEditRequest],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      })
    })
  )
  
  render(<RecentChangesFeed />)
  
  await waitFor(() => {
    expect(screen.getByText('Blog Edit')).toBeInTheDocument()
  })
})
```

## Future Enhancements

1. **Bulk Actions**: Select multiple items for batch approval/rejection
2. **Real-time Updates**: WebSocket integration for live feed updates
3. **Advanced Search**: Full-text search across edit content
4. **Export**: Download filtered results as CSV/JSON
5. **Keyboard Shortcuts**: Quick actions via keyboard
6. **Customizable Columns**: User-configurable display fields
7. **Saved Filters**: Persist filter preferences
8. **Activity Timeline**: Visual timeline of edit history

## Related Documentation

- [Moderator Dashboard](./MODERATOR_DASHBOARD.md)
- [Admin Implementation Summary](./ADMIN_IMPLEMENTATION_SUMMARY.md)
- [Moderation Feature](./MODERATION-FEATURE.md)
- [Database Architecture](./DATABASE_ARCHITECTURE.md)
