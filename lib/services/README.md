# Services

This directory contains business logic services that orchestrate data access and implement core features.

## Feed Service

**File:** `feed-service.ts`

The FeedService orchestrates feed generation and ranking for the content feed system.

### Features

- **Multiple Feed Types:**
  - `home`: Ranked feed using RankingEngine (posts from followed users/pets)
  - `explore`: Discovery feed for trending and high-quality content
  - `following`: Chronological feed from followed users
  - `local`: Geographic-based feed from nearby locations
  - `my-pets`: Posts tagged with user's pets

- **Feed Filtering:**
  - Content types (photos, videos, text, polls, etc.)
  - Date range filtering
  - Topic/hashtag filtering
  - Pet ID filtering
  - High quality only filter

- **Smart Ranking:**
  - Integrates with RankingEngine for home feed
  - Applies engagement, recency, affinity, and diversity signals
  - Filters muted users and words

- **Performance:**
  - Batch fetches author and pet data to avoid N+1 queries
  - Cursor-based pagination
  - Enriches posts with author and pet information

### Usage

```typescript
import { feedService } from '@/lib/services/feed-service';

// Get home feed
const feed = await feedService.getFeed(userId, {
  type: 'home',
  limit: 20,
  cursor: 'post-id-cursor',
  filters: {
    contentTypes: ['photo', 'video'],
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-12-31'),
    },
    topics: ['dogs', 'cats'],
    highQualityOnly: true,
  },
});
```

### API Endpoint

**GET /api/feed**

Query Parameters:
- `type`: Feed type (home, explore, following, local, my-pets) - default: home
- `limit`: Number of posts (1-50) - default: 20
- `cursor`: Pagination cursor
- `contentTypes`: Comma-separated content types
- `dateStart`: ISO date string for start date
- `dateEnd`: ISO date string for end date
- `topics`: Comma-separated hashtags
- `petIds`: Comma-separated pet IDs
- `highQualityOnly`: Boolean for high quality filter

Example:
```
GET /api/feed?type=home&limit=20&contentTypes=photo,video&topics=dogs,cats
```

Response:
```json
{
  "posts": [
    {
      "id": "post-id",
      "authorUserId": "user-id",
      "textContent": "Post content",
      "media": [...],
      "author": {
        "id": "user-id",
        "username": "username",
        "fullName": "Full Name",
        "avatar": "avatar-url"
      },
      "pet": {
        "id": "pet-id",
        "name": "Pet Name",
        "avatar": "avatar-url",
        "species": "dog"
      },
      "_count": {
        "likes": 10,
        "comments": 5,
        "shares": 2,
        "saves": 3,
        "views": 100
      }
    }
  ],
  "nextCursor": "next-post-id",
  "hasMore": true
}
```

## Ranking Engine

**File:** `ranking-engine.ts`

The RankingEngine computes relevance scores for posts based on multiple signals.

### Signals

1. **Engagement Score** (Requirement 4.1)
   - Likes: 20%
   - Comments: 30%
   - Shares: 25%
   - Saves: 15%

2. **Recency Decay** (Requirement 4.2)
   - Under 1 hour: 1.0x
   - 1-3 hours: 0.9x
   - 3-6 hours: 0.7x
   - 6-12 hours: 0.5x
   - 12-24 hours: 0.3x
   - 1-2 days: 0.1x
   - Over 2 days: 0.05x

3. **Affinity Boost** (Requirement 4.3)
   - Based on user-author relationship strength
   - Considers interaction frequency and types

4. **Content Type Boost** (Requirement 4.4)
   - Boosts preferred content types (up to 50%)

5. **Diversity Injection** (Requirement 4.5)
   - Prevents same-user domination
   - Max 3 consecutive posts from same author in 10 positions

6. **Negative Signals** (Requirement 4.5)
   - Filters muted users
   - Filters hidden posts
   - Filters posts with muted words

### Usage

```typescript
import { rankingEngine } from '@/lib/services/ranking-engine';

// Compute score for single post
const score = rankingEngine.computeScore(post, context);

// Batch compute with diversity
const scores = rankingEngine.batchComputeScores(posts, context);
```

## Story Service

**File:** `story-service.ts`

The StoryService handles story creation, validation, and lifecycle management for 24-hour ephemeral content.

### Features

- **Story Creation:**
  - Validates media constraints (photos max 10MB, videos max 100MB and 15 seconds)
  - Creates story records with 24-hour expiry
  - Stores stickers as JSONB data
  - Supports multiple visibility levels (everyone, close_friends, custom)

- **Media Validation:**
  - Photo size limit: 10MB
  - Video size limit: 100MB
  - Video duration limit: 15 seconds

- **Privacy Controls:**
  - Everyone: Public stories visible to all
  - Close Friends: Only visible to curated close friends list
  - Custom: Visible to specific user list

- **Story Management:**
  - Get active stories (not expired, not deleted)
  - Delete stories (soft delete)
  - Archive stories for permanent storage
  - Check view permissions based on visibility

### Usage

```typescript
import { storyService } from '@/lib/services/story-service';

// Create a story
const story = await storyService.createStory({
  creatorUserId: 'user-id',
  mediaUrl: 'https://cdn.example.com/story.jpg',
  mediaType: 'photo',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  mediaDimensions: { width: 1080, height: 1920 },
  caption: 'My story caption',
  stickers: [
    {
      type: 'poll',
      position: { x: 0.5, y: 0.7 },
      content: { question: 'What do you think?', options: ['Yes', 'No'] }
    }
  ],
  visibility: 'close_friends',
});

// Validate media before upload
const validation = storyService.validateMedia('video', 95000000, 14);
if (!validation.valid) {
  console.error(validation.errors);
}

// Get active stories
const stories = await storyService.getActiveStories('user-id');

// Check if user can view story
const canView = await storyService.canViewStory(story, 'viewer-id');
```

### API Endpoint

**POST /api/stories**

Request Body:
```json
{
  "mediaUrl": "https://cdn.example.com/story.jpg",
  "mediaType": "photo",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "mediaDimensions": { "width": 1080, "height": 1920 },
  "fileSize": 5242880,
  "caption": "My story caption",
  "stickers": [
    {
      "type": "poll",
      "position": { "x": 0.5, "y": 0.7 },
      "size": 1,
      "rotation": 0,
      "content": {
        "question": "What do you think?",
        "options": ["Yes", "No"]
      }
    }
  ],
  "visibility": "everyone",
  "isSensitiveContent": false
}
```

Response:
```json
{
  "success": true,
  "story": {
    "id": "story-id",
    "creatorUserId": "user-id",
    "mediaUrl": "https://cdn.example.com/story.jpg",
    "mediaType": "photo",
    "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
    "mediaDimensions": { "width": 1080, "height": 1920 },
    "caption": "My story caption",
    "stickers": [...],
    "visibility": "everyone",
    "viewsCount": 0,
    "uniqueViewersCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-02T00:00:00.000Z",
    "isArchived": false
  }
}
```

## Requirements Satisfied

- ✅ Requirement 1.1: Feed types (Home, Explore, Following, Local, My Pets)
- ✅ Requirement 1.2: Feed display and navigation
- ✅ Requirement 13.1: Backend API for feed generation
- ✅ Requirement 4.1: Engagement score calculation
- ✅ Requirement 4.2: Recency decay
- ✅ Requirement 4.3: Affinity calculation
- ✅ Requirement 4.4: Content type preferences
- ✅ Requirement 4.5: Diversity and negative signals
- ✅ Requirement 9.1: Story publishing with visibility controls
- ✅ Requirement 13.4: Story creation with 24-hour expiry and JSONB stickers
