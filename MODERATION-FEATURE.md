# Media Moderation Feature

## Overview
This feature implements content moderation for uploaded images and videos, including automatic flagging, manual review queue, and blur-on-warning functionality.

## Features Implemented

### 1. Automatic Content Moderation
- **Location**: `lib/moderation.ts`
- Automatically moderates uploaded images/videos
- Returns moderation scores and flags content that needs review
- Currently uses mock moderation service (ready for integration with AWS Rekognition, Google Cloud Vision, etc.)

### 2. Moderation Queue System
- **API Routes**:
  - `GET /api/moderation/queue` - Get all items in moderation queue
  - `POST /api/moderation/review` - Review and update moderation status
  - `POST /api/moderation/blur-toggle` - Toggle blur-on-warning setting

### 3. Manual Review UI
- **Location**: `app/admin/moderation/page.tsx`
- Admin interface for reviewing flagged content
- Features:
  - View all flagged items in a table
  - Preview media with blur overlay
  - Approve/reject/flag actions
  - View moderation scores and reasons
  - Toggle blur-on-warning per item

### 4. Blur-on-Warning Toggle
- **Components**:
  - `components/moderation/blurred-media.tsx` - Blurs flagged content with reveal option
  - `components/moderation/blur-toggle.tsx` - User setting to enable/disable blur
- **Integration**: Added to Settings page (`app/settings/page.tsx`)
- Users can toggle blur-on-warning in their settings
- Flagged content is automatically blurred when setting is enabled

### 5. Upload Integration
- **Location**: `lib/storage-upload.ts`
- Upload flow automatically moderates images after upload
- Returns moderation status in `ImageUploadResult`
- Non-blocking: upload succeeds even if moderation fails

## Type Definitions

Added to `lib/types.ts`:
- `MediaModerationStatus` - Status types: pending, approved, rejected, flagged, reviewed
- `ModerationReason` - Reason types: graphic_content, inappropriate, violence, explicit, other
- `MediaModeration` - Full moderation record interface
- `ModerationQueueItem` - Queue item interface
- `ModerationReviewAction` - Review action interface

## Components

### BlurredMedia
Renders images/videos with blur overlay when flagged. Features:
- Blur effect with reveal button
- Respects user's blur-on-warning setting
- Shows moderation reason
- Supports both images and videos

### BlurToggle
User setting component for enabling/disabling blur-on-warning:
- Persists setting in localStorage
- Broadcasts changes via custom events
- Integrated into Settings page

### ModerationStatusBadge
Displays moderation status with appropriate icons and colors.

## Hooks

### useModeration
**Location**: `lib/hooks/use-moderation.ts`
Hook to check moderation status for media:
```typescript
const { moderation, isFlagged, shouldBlur, loading } = useModeration({
  mediaUrl: 'https://example.com/image.jpg',
  blurOnWarningEnabled: true,
});
```

## Testing

Test files created:
- `components/moderation/__tests__/blurred-media.test.tsx` - Component tests
- `lib/__tests__/moderation.test.ts` - Service tests

## Usage

### Using BlurredMedia Component
```tsx
import { BlurredMedia } from '@/components/moderation/blurred-media';

<BlurredMedia
  src={imageUrl}
  alt="Description"
  blurOnWarning={true}
  isFlagged={isFlagged}
  moderationReason="graphic_content"
  width={800}
  height={600}
  type="image"
/>
```

### Using Moderation Service
```typescript
import { ContentModerationService, queueMediaForModeration } from '@/lib/moderation';

const service = new ContentModerationService({
  autoModerate: true,
  blurOnWarning: true,
  threshold: 0.7,
});

const result = await service.moderateMedia(imageUrl, 'image');
const moderation = await queueMediaForModeration(imageUrl, 'image', result);
```

## Admin Access

Access the moderation queue at: `/admin/moderation`

## Future Enhancements

1. **Database Integration**: Replace in-memory queue with database persistence
2. **Real Moderation API**: Integrate with AWS Rekognition, Google Cloud Vision, or Azure Content Moderator
3. **Batch Operations**: Add bulk approve/reject actions
4. **Filtering**: Add filters by status, reason, date range
5. **Statistics**: Add moderation statistics dashboard
6. **Notifications**: Notify admins of new flagged content
7. **Video Moderation**: Full video moderation support (currently placeholder)

## Notes

- Moderation service currently uses mock/random scores for demonstration
- In production, replace `ContentModerationService.moderateMedia()` with actual API calls
- The queue uses in-memory storage; consider migrating to database for production
- All moderation operations are non-blocking to ensure uploads always succeed

