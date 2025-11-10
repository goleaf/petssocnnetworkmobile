# Feed Components

This directory contains all components related to the content feed and timeline system.

## Components

### FeedContainer
The main container component that manages feed state, filtering, and pagination.

**Usage:**
```tsx
import { FeedContainer } from "@/components/feed/FeedContainer"

<FeedContainer
  initialPosts={posts}
  feedType="home"
  userId={user.id}
/>
```

**Props:**
- `initialPosts`: Array of PostCardData - Initial posts to display
- `feedType`: Feed type (home, explore, following, local, my-pets)
- `userId`: Current user ID for personalization

### FilterPanel
A comprehensive filter panel for customizing feed content.

**Features:**
- Content type filtering (Photos, Videos, Text Only, Polls, Shared Posts)
- Date range selection (Today, This Week, This Month, All Time, Custom)
- High quality content toggle
- Topic/hashtag filtering
- Muted words filtering
- Filter preset save/load functionality

**Usage:**
```tsx
import { FilterPanel, FeedFilters } from "@/components/feed/FilterPanel"

const [filters, setFilters] = useState<FeedFilters>({
  contentTypes: [],
  dateRange: 'all',
  highQualityOnly: false,
  topics: [],
  mutedWords: [],
})

<FilterPanel
  open={isOpen}
  onOpenChange={setIsOpen}
  filters={filters}
  onFiltersChange={setFilters}
  onApply={handleApplyFilters}
/>
```

### FeedList
Displays a list of posts with infinite scroll and load more functionality.

**Features:**
- Infinite scroll with IntersectionObserver
- Load more button after 20 posts
- DOM limit of 200 posts for performance
- Scroll position restoration
- Optimistic UI updates

### PostCard
Individual post card component displaying post content and interactions.

**Features:**
- Author information with avatar
- Post content with media
- Pet tags
- Interaction buttons (like, comment, share, save)
- Engagement counts
- Three-dot menu for actions

### PostMediaDisplay
Handles display of post media (photos and videos).

**Features:**
- Single image full-width display
- Multiple images in grid layout
- Video player with controls
- Responsive image sizing

### PostInteractionBar
Displays interaction buttons and counts for a post.

**Features:**
- Like, comment, share, bookmark buttons
- Engagement count display
- Hover tooltips
- Real-time updates

### PostActionsMenu
Three-dot menu for post actions.

**Features:**
- Report post
- Hide post
- Save post
- Additional actions

## Filter System

### Filter Types

**Content Types:**
- `photo_album` - Posts with photos
- `video` - Posts with videos
- `standard` - Text-only posts
- `poll` - Poll posts
- `shared` - Shared posts

**Date Ranges:**
- `today` - Posts from today
- `week` - Posts from the last 7 days
- `month` - Posts from the last 30 days
- `all` - All posts
- `custom` - Custom date range with start and end dates

**Other Filters:**
- `highQualityOnly` - Filter out low-quality content
- `topics` - Array of hashtags to show
- `mutedWords` - Array of words to hide posts containing them

### Filter Presets

Users can save their filter combinations as presets for quick access:

1. Configure filters
2. Click "Save Preset"
3. Enter a name
4. Preset is saved to localStorage
5. Load preset from dropdown
6. Delete preset with trash icon

### API Integration

Filters are converted to query parameters for the `/api/feed` endpoint:

```typescript
GET /api/feed?type=home&limit=20&contentTypes=photo_album,video&dateStart=2024-01-01&topics=dogs,cats&highQualityOnly=true
```

**Query Parameters:**
- `type` - Feed type
- `limit` - Number of posts to return
- `cursor` - Pagination cursor
- `contentTypes` - Comma-separated content types
- `dateStart` - ISO date string for start date
- `dateEnd` - ISO date string for end date
- `topics` - Comma-separated hashtags
- `highQualityOnly` - Boolean flag

### Client-Side Filtering

Muted words are filtered on the client side to avoid sending sensitive information to the server:

```typescript
const filteredPosts = posts.filter((post) => {
  if (!post.content) return true
  const content = post.content.toLowerCase()
  return !mutedWords.some((word) => 
    content.includes(word.toLowerCase())
  )
})
```

## Performance Considerations

### Virtualized Scrolling
The feed uses virtualized scrolling to render only visible posts plus a buffer, improving performance with large feeds.

### Lazy Loading
Media is lazy-loaded as posts scroll into view, reducing initial load time and bandwidth usage.

### Caching
- Individual posts are cached for 10 minutes
- Feed results are cached for 5 minutes
- Engagement counts are cached for 1 minute

### Pagination
Cursor-based pagination is used for efficient loading of large datasets without offset-based performance issues.

## Testing

Tests are located in `tests/active/components/`:
- `FilterPanel.test.tsx` - Filter panel component tests
- `FeedComponents.test.tsx` - Feed component tests
- `PostComposer.test.tsx` - Post composer tests

Run tests with:
```bash
npm test -- FilterPanel.test.tsx
```

## Future Enhancements

Potential improvements for the feed system:
1. Real-time updates via WebSocket
2. Pull-to-refresh on mobile
3. New posts banner
4. Virtualized list rendering
5. Advanced filtering (location, pet species, etc.)
6. Filter analytics and suggestions
7. Saved searches sync across devices
