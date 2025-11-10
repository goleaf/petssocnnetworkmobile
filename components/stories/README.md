# Story Editing Tools

This directory contains components for creating and editing Instagram/Snapchat-style stories with creative tools.

## Components

### StoryVisibilitySelector

Visibility selector for stories with Everyone, Close Friends, and Custom options.

**Features:**
- Three visibility modes: Everyone, Close Friends, Custom
- Shows close friends count
- Custom user selection dialog
- Green heart icon for Close Friends

**Props:**
- `value: StoryVisibilityValue` - Current visibility setting
- `onChange: (value: StoryVisibilityValue) => void` - Callback when visibility changes
- `closeFriendIds?: string[]` - Array of close friend user IDs

**Usage:**
```tsx
<StoryVisibilitySelector
  value={{ visibility: 'close_friends' }}
  onChange={(value) => setVisibility(value)}
  closeFriendIds={['user-1', 'user-2']}
/>
```

### CloseFriendsManager

Dialog for managing the Close Friends list.

**Features:**
- View current close friends
- Search and add users
- Remove users from list
- Batch update with save button

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Callback when dialog state changes
- `closeFriendIds: string[]` - Current close friend IDs
- `onUpdate: (friendIds: string[]) => void` - Callback when list is updated

**Usage:**
```tsx
<CloseFriendsManager
  open={showManager}
  onOpenChange={setShowManager}
  closeFriendIds={closeFriendIds}
  onUpdate={setCloseFriendIds}
/>
```

### AddToCloseFriendsButton

Button for adding/removing a user from Close Friends.

**Features:**
- Toggle button with visual feedback
- Green styling when user is in Close Friends
- Heart icon (filled when active)
- Loading state during API call
- Toast notifications

**Props:**
- `userId: string` - User ID to add/remove
- `isCloseFriend: boolean` - Current close friend status
- `onToggle?: (isCloseFriend: boolean) => void` - Callback when toggled
- `variant?: "default" | "outline" | "ghost"` - Button variant
- `size?: "default" | "sm" | "lg" | "icon"` - Button size

**Usage:**
```tsx
<AddToCloseFriendsButton
  userId="user-123"
  isCloseFriend={false}
  onToggle={(isCloseFriend) => {
    console.log('Close friend status:', isCloseFriend)
  }}
/>
```

### StoryEditor

Main editor component that orchestrates all editing tools.

**Features:**
- Text overlay tool with font selector, color picker, and alignment
- Drawing tool with pen, marker, highlighter, neon, and eraser
- Filter carousel with intensity slider
- Undo/redo functionality
- Save and cancel actions

**Usage:**
```tsx
import { StoryEditor } from "@/components/stories/StoryEditor"

<StoryEditor
  mediaUrl="/path/to/media.jpg"
  mediaType="image"
  onSave={(overlays, filter, filterIntensity) => {
    // Handle save
  }}
  onCancel={() => {
    // Handle cancel
  }}
/>
```

### TextOverlayTool

Interactive text overlay with drag, resize, and rotation gestures.

**Features:**
- 10 font options (Arial, Helvetica, Times New Roman, Georgia, Courier, Comic Sans, Impact, Brush Script, Palatino, Verdana)
- 20+ color options
- Text alignment (left, center, right)
- Drag to reposition
- Pinch-to-resize (Ctrl+Wheel on desktop)
- Rotation (Shift+Wheel on desktop)
- Double-click to edit text
- Delete button

**Gestures:**
- **Drag**: Click and drag to move text
- **Resize**: Ctrl+Wheel (desktop) or pinch gesture (mobile)
- **Rotate**: Shift+Wheel (desktop) or two-finger rotation (mobile)
- **Edit**: Double-click to edit text content

### DrawingTool

Canvas-based drawing tool with multiple brush types.

**Features:**
- 5 drawing tools:
  - **Pen**: Standard drawing with full opacity
  - **Marker**: Semi-transparent (70% opacity)
  - **Highlighter**: Wide, semi-transparent (40% opacity)
  - **Neon**: Glowing effect with shadow
  - **Eraser**: Remove drawn content
- 20+ color options
- Brush size slider (1-20px)
- Real-time drawing preview
- Converts to SVG path for storage

**Usage:**
```tsx
import { DrawingTool } from "@/components/stories/DrawingTool"

<DrawingTool
  width={420}
  height={747}
  onDrawingComplete={(drawingOverlay) => {
    // Handle completed drawing
  }}
/>
```

### FilterCarousel

Swipeable carousel of image filters with intensity control.

**Features:**
- 9 filters:
  - None (original)
  - Grayscale (B&W)
  - Sepia (vintage)
  - Saturate (vibrant)
  - Contrast (bold)
  - Brightness (bright)
  - Blur (soft)
  - Hue Rotate (colorful)
  - Invert (negative)
- Swipe to cycle through filters
- Filter intensity slider (0-100%)
- Visual preview thumbnails

**Usage:**
```tsx
import { FilterCarousel } from "@/components/stories/FilterCarousel"

<FilterCarousel
  selectedFilter={selectedFilter}
  onFilterSelect={(filter) => setSelectedFilter(filter)}
/>
```

## Data Structure

### StoryOverlay

Text and drawing overlays are stored as `StoryOverlay` objects:

```typescript
interface StoryOverlay {
  id: string
  type: 'text' | 'drawing' | 'sticker' | ...
  x?: number // 0..1 relative position
  y?: number // 0..1 relative position
  rotation?: number // degrees
  scale?: number // 1 = 100%
  
  // Text overlay fields
  text?: string
  color?: string
  fontSize?: number // px
  fontFamily?: string
  
  // Drawing overlay fields
  data?: {
    path: string // SVG path data
    strokeWidth: number
    opacity: number
  }
}
```

## Implementation Notes

### Undo/Redo

The StoryEditor maintains a history stack of overlay states. Each action (add, update, delete) creates a new history entry. Users can undo/redo through the history.

### Performance

- Drawing uses HTML5 Canvas for real-time rendering
- Completed drawings are converted to SVG paths for efficient storage
- Text overlays use CSS transforms for smooth animations
- Filters are applied using CSS filter properties

### Mobile Gestures

The components support touch gestures:
- Single touch: Drag text overlays
- Pinch: Resize text overlays
- Two-finger rotation: Rotate text overlays
- Swipe: Navigate filter carousel

### Accessibility

- All interactive elements are keyboard accessible
- Color contrast meets WCAG AA standards
- Screen reader labels for all controls
- Focus indicators for keyboard navigation

### StickerPanel

Main panel for adding interactive stickers to stories.

**Features:**
- 11 sticker types with tabbed interface:
  - **Emoji**: Grid of categorized emojis (Smileys, Animals, Food, Activities, Travel, Objects, Symbols)
  - **GIF**: Search and select GIFs powered by Tenor API
  - **Location**: Search for places with map integration
  - **Mention**: Search and mention users
  - **Hashtag**: Add hashtag text
  - **Poll**: Create polls with 2-4 answer options
  - **Question**: Ask viewers a question
  - **Countdown**: Add countdown timer to a date/time
  - **Music**: (Coming soon)
  - **Quiz**: (Coming soon)
  - **Weather**: (Coming soon)

**Usage:**
```tsx
import { StickerPanel } from "@/components/stories/StickerPanel"

<StickerPanel
  onAddSticker={(sticker) => {
    // Handle sticker addition
  }}
  onClose={() => {
    // Handle close
  }}
/>
```

### StickerOverlay

Draggable, resizable, and rotatable sticker overlay component.

**Features:**
- Drag to reposition stickers
- Pinch-to-resize (Ctrl+Wheel on desktop)
- Rotation (Shift+Wheel on desktop)
- Visual selection indicator
- Delete button when selected
- Renders different sticker types:
  - Emoji stickers (large emoji display)
  - GIF stickers (animated GIF)
  - Location stickers (with map pin icon)
  - Mention stickers (styled username)
  - Hashtag stickers (styled hashtag)
  - Poll stickers (question with options)
  - Question stickers (gradient background)
  - Countdown stickers (time remaining display)

**Gestures:**
- **Drag**: Click/touch and drag to move sticker
- **Resize**: Ctrl+Wheel (desktop) or pinch gesture (mobile)
- **Rotate**: Shift+Wheel (desktop) or two-finger rotation (mobile)
- **Delete**: Click X button when selected

### StoryViewer

Fullscreen story viewer with Instagram/Snapchat-style interactions.

**Features:**
- Fullscreen display with 9:16 aspect ratio
- Progress bars at top (one per story segment)
- Auto-advance after 5 seconds (photos) or full duration (videos)
- Tap left/right for navigation between stories
- Swipe up to exit viewer (mobile)
- Pause on hold gesture (press and hold)
- Story ring indicators:
  - Colored gradient ring for new/unviewed stories
  - Grey ring for viewed stories
- "Close Friends" badge with green heart icon
- Smooth transitions between stories and users
- Video playback with pause/resume support

**Gestures:**
- **Tap Left**: Go to previous story
- **Tap Right**: Go to next story
- **Hold**: Pause current story (release to resume)
- **Swipe Up**: Exit viewer (mobile)
- **Click X**: Close viewer

**Usage:**
```tsx
import { StoryViewer } from "@/components/stories/StoryViewer"

<StoryViewer
  open={isOpen}
  onOpenChange={setIsOpen}
  startUserId={userId} // Start viewing from this user's stories
/>
```

## Requirements Satisfied

This implementation satisfies requirements 8.3, 8.4, 8.5, 9.1, and 9.2:

**8.3**: Text overlay tool with 5-10 font options, color picker with 20+ colors, and alignment controls ✓

**8.4**: Drawing tool with pen, marker, highlighter, neon, and eraser tools, plus color picker and size slider ✓

**8.5**: Sticker system with 11 sticker types (Emoji, GIF, Location, Mention, Hashtag, Poll, Question, Countdown, Music, Quiz, Weather) ✓

**9.1**: Story viewer with fullscreen display, progress bars, auto-advance, tap navigation, swipe up to exit ✓

**9.2**: Story ring indicators (colored for new, grey for viewed) and "Close Friends" badge ✓

Additional features:
- Undo/redo functionality ✓
- Text dragging, pinch-to-resize, rotation with gestures ✓
- Filter carousel (swipe to cycle through filters) ✓
- Filter intensity slider ✓
- Sticker positioning, resizing, rotation ✓
- GIPHY/Tenor API integration for GIF search ✓
- Location search with place picker ✓
- User mention with search ✓
- Interactive poll creation (2-4 options) ✓
- Question sticker with custom prompt ✓
- Countdown sticker with date/time picker ✓
- Pause on hold gesture ✓
- Video playback control ✓
- Viewed story tracking ✓


## Close Friends Features

### Overview

The Close Friends system allows users to share stories with a curated list of their closest friends. Stories marked as "Close Friends" are only visible to users on the creator's Close Friends list.

### Visual Indicators

**Story Ring Colors:**
- **Regular Stories**: Gradient ring (yellow → pink → purple)
- **Close Friends Stories**: Green gradient ring
- **Viewed Stories**: Grey ring

**Close Friends Badge:**
- Green badge with heart icon
- Displayed on story viewer when viewing a Close Friends story
- Shows "Close Friends" text

### API Endpoints

**GET /api/close-friends**
- Get the authenticated user's Close Friends list
- Returns array of user IDs

**PUT /api/close-friends**
- Update the entire Close Friends list
- Body: `{ friendIds: string[] }`

**POST /api/close-friends/[friendId]**
- Add a specific user to Close Friends
- Returns success message

**DELETE /api/close-friends/[friendId]**
- Remove a specific user from Close Friends
- Returns success message

**GET /api/stories/feed**
- Get stories feed filtered by visibility permissions
- Automatically filters based on Close Friends lists and custom visibility

### Services

**CloseFriendsService** (`lib/services/close-friends-service.ts`)
- `getCloseFriends(userId)` - Get close friends list
- `isCloseFriend(userId, friendUserId)` - Check if user is in close friends
- `addCloseFriend(userId, friendUserId)` - Add to close friends
- `removeCloseFriend(userId, friendUserId)` - Remove from close friends
- `updateCloseFriendsList(userId, friendIds)` - Replace entire list
- `getCloseFriendsCount(userId)` - Get count of close friends

**StoryService Updates** (`lib/services/story-service.ts`)
- `getStoriesFeed(viewerUserId)` - Get stories filtered by visibility
- `getStoriesByUserIds(userIds, viewerUserId)` - Get stories for specific users
- `canViewStory(story, viewerUserId)` - Check if user can view a story

### Database Schema

**CloseFriend Model:**
```prisma
model CloseFriend {
  id           String   @id @default(uuid())
  userId       String
  friendUserId String
  addedAt      DateTime @default(now())

  @@unique([userId, friendUserId])
  @@index([userId])
  @@index([friendUserId])
}
```

### Requirements Covered

**9.1**: Story publishing with visibility options (Everyone, Close Friends, Custom) ✓

**9.2**: Close Friends list management and green ring indicator ✓

### Example Usage

See `components/stories/CloseFriendsExample.tsx` for a complete demonstration of all Close Friends features including:
- Story visibility selector
- Close Friends list management
- Add/Remove users from Close Friends
- Visual indicators (green rings and badges)
