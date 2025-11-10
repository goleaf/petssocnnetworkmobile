# Post Engagement Endpoints

This directory contains API endpoints for post engagement features including likes, comments, shares, and saves.

## Endpoints

### Like Endpoints
- **POST** `/api/posts/{postId}/like` - Like or react to a post
- **DELETE** `/api/posts/{postId}/like` - Unlike a post

### Comment Endpoints
- **POST** `/api/posts/{postId}/comments` - Create a comment
- **GET** `/api/posts/{postId}/comments` - Get comments for a post

### Share Endpoints
- **POST** `/api/posts/{postId}/share` - Share a post
- **GET** `/api/posts/{postId}/share` - Get share list

### Save Endpoints
- **POST** `/api/posts/{postId}/save` - Save a post to collection
- **DELETE** `/api/posts/{postId}/save` - Unsave a post
- **GET** `/api/posts/{postId}/save` - Check save status

## Features

- ✅ Real-time updates via WebSocket
- ✅ Cache invalidation on changes
- ✅ Notification dispatch
- ✅ Engagement counter management
- ✅ Threaded comments with replies
- ✅ @mention support in comments
- ✅ Multiple reaction types (like, love, haha, wow, sad, angry, paw)
- ✅ Named collections for saved posts
- ✅ Pagination support

## Authentication

All endpoints require authentication via `x-user-id` header (placeholder).

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate action)
- `500` - Internal Server Error

## Related Files

- `lib/repositories/post-repository.ts` - Post data access layer
- `lib/services/websocket-service.ts` - Real-time updates
- `lib/scalability/cache-layer.ts` - Caching layer
- `lib/notifications.ts` - Notification system
