# Data Access Repositories

This directory contains data access layer repositories that provide a clean interface for database operations using Prisma.

## PostRepository

The `PostRepository` provides comprehensive CRUD operations and query methods for the posts table in the content feed system.

### Features

- **CRUD Operations**: Create, read, update, and soft delete posts
- **Batch Operations**: Fetch multiple posts efficiently to avoid N+1 queries
- **Filtering**: Filter posts by author, type, visibility, date range, hashtags, and pet tags
- **Pagination**: Cursor-based pagination for infinite scroll
- **Engagement Tracking**: Methods to increment/decrement engagement counters
- **Relevance Scoring**: Update and batch update relevance scores for feed ranking
- **Trending Analysis**: Get trending hashtags from recent posts

### Usage Examples

```typescript
import { postRepository } from '@/lib/repositories';

// Create a post
const post = await postRepository.createPost({
  authorUserId: 'user-123',
  textContent: 'Hello world! #pets',
  hashtags: ['pets'],
  visibility: 'public',
});

// Get a single post
const post = await postRepository.getPost('post-id');

// Get posts with pagination
const { posts, nextCursor, hasMore } = await postRepository.getPosts(
  {
    authorUserIds: ['user-1', 'user-2'],
    excludeDeleted: true,
  },
  {
    limit: 20,
    cursor: 'last-post-id',
  }
);

// Batch fetch posts (avoids N+1 queries)
const posts = await postRepository.batchGetPosts(['post-1', 'post-2', 'post-3']);

// Update engagement counters
await postRepository.incrementLikesCount('post-id');
await postRepository.incrementCommentsCount('post-id');

// Update relevance score for ranking
await postRepository.updateRelevanceScore('post-id', 0.85);

// Get trending hashtags
const trending = await postRepository.getTrendingHashtags(10);
```

### Filtering Options

The repository supports comprehensive filtering:

```typescript
interface PostFilters {
  authorUserIds?: string[];        // Filter by authors
  postTypes?: string[];            // Filter by post type
  visibility?: string[];           // Filter by visibility level
  dateRange?: {                    // Filter by date range
    start?: Date;
    end?: Date;
  };
  hashtags?: string[];             // Filter by hashtags
  petTags?: string[];              // Filter by pet tags
  excludeDeleted?: boolean;        // Exclude soft-deleted posts (default: true)
}
```

### Pagination

Cursor-based pagination is used for efficient infinite scroll:

```typescript
interface PaginationOptions {
  limit?: number;      // Number of posts to fetch (default: 20)
  cursor?: string;     // Post ID to start from (for next page)
}
```

The response includes:
- `posts`: Array of post objects
- `nextCursor`: ID to use for fetching the next page
- `hasMore`: Boolean indicating if more posts are available

### Performance Considerations

1. **Batch Operations**: Use `batchGetPosts()` and `batchGetPostsWithCounts()` when fetching multiple posts to avoid N+1 queries
2. **Cursor Pagination**: More efficient than offset pagination for large datasets
3. **Selective Fetching**: Use filters to reduce the amount of data fetched
4. **Engagement Counters**: Denormalized counters avoid expensive COUNT queries
5. **Indexes**: The schema includes indexes on frequently queried fields

### Testing

Tests are located in `tests/active/lib/repositories/post-repository.test.ts` and cover:
- CRUD operations
- Filtering and pagination
- Batch operations
- Engagement counter updates
- Relevance score updates
- Trending hashtag analysis

Run tests with:
```bash
npm test -- tests/active/lib/repositories/post-repository.test.ts
```
