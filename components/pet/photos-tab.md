# PhotosTab Component

## Overview

The `PhotosTab` component displays a responsive photo gallery for pet profiles with an integrated lightbox viewer. It supports lazy loading, keyboard navigation, slideshow mode, and photo downloads.

## Features

### Photo Grid
- **Responsive Layout**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Lazy Loading**: Photos load as they enter the viewport using the `LazyImage` component
- **Primary Badge**: Displays a "Primary" badge on the main profile photo
- **Caption Overlay**: Shows photo captions on hover
- **Accessibility**: Full keyboard navigation and ARIA labels

### Lightbox Viewer
- **Full-Screen Display**: Optimized photo viewing experience
- **Navigation**: Arrow buttons and keyboard shortcuts (←/→ keys)
- **Slideshow Mode**: Auto-advance every 3 seconds with play/pause controls
- **Thumbnail Strip**: Quick navigation between photos
- **Photo Counter**: Shows current position (e.g., "2 / 5")
- **Caption Display**: Shows photo captions in the lightbox header
- **Download Option**: Allows downloading photos (configurable via privacy settings)
- **Keyboard Support**: 
  - `←` Previous photo
  - `→` Next photo
  - `Esc` Close lightbox

## Usage

```tsx
import { PhotosTab } from "@/components/pet/photos-tab"

function PetProfilePage() {
  const photos = [
    {
      id: "photo-1",
      url: "https://example.com/photo1.jpg",
      thumbnailUrl: "https://example.com/photo1-thumb.jpg",
      optimizedUrl: "https://example.com/photo1-optimized.webp",
      caption: "Playing in the park",
      uploadedAt: "2024-01-01T00:00:00Z",
      isPrimary: true,
      order: 0,
    },
    // ... more photos
  ]

  return (
    <PhotosTab
      photos={photos}
      petName="Max"
      canDownload={true}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `photos` | `PetPhoto[]` | Required | Array of photo objects to display |
| `petName` | `string` | Required | Name of the pet (used in alt text and downloads) |
| `canDownload` | `boolean` | `true` | Whether to show the download button in lightbox |
| `className` | `string` | `undefined` | Additional CSS classes for the grid container |

### PetPhoto Interface

```typescript
interface PetPhoto {
  id: string                // Unique photo identifier
  url: string              // Full-size photo URL
  thumbnailUrl?: string    // Thumbnail URL (150x150)
  optimizedUrl?: string    // Optimized/WebP URL
  caption?: string         // Optional photo caption
  uploadedAt: string       // ISO timestamp
  isPrimary: boolean       // Whether this is the primary profile photo
  order: number           // Display order (0-based)
}
```

## Implementation Details

### Photo Sorting
Photos are automatically sorted by their `order` property to ensure consistent display regardless of the input array order.

### Lazy Loading
The component uses the `LazyImage` component which:
- Loads images 200px before they enter the viewport
- Shows a placeholder while loading
- Supports responsive image sizes

### Slideshow Behavior
- Auto-advances every 3 seconds when active
- Wraps around from last to first photo
- Automatically stops when lightbox is closed
- Cleans up intervals on component unmount

### Download Functionality
When a user clicks the download button:
1. Fetches the full-size image
2. Creates a blob URL
3. Triggers a download with filename: `{petName}-photo-{photoId}.jpg`
4. Cleans up the blob URL after download

### Accessibility Features
- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support in both grid and lightbox
- **Focus Management**: Proper focus handling when opening/closing lightbox
- **Screen Reader Support**: Descriptive text for all actions
- **Alt Text**: Meaningful alt text for all images

## Privacy Considerations

The `canDownload` prop should be set based on the pet profile's privacy settings:

```typescript
const canDownload = 
  pet.privacy.visibility === 'public' || 
  (pet.privacy.sections?.photos === 'public' && isFollower) ||
  isOwner
```

## Performance

- **Lazy Loading**: Only loads visible images
- **Optimized Images**: Uses WebP format when available
- **Responsive Images**: Serves appropriate sizes based on viewport
- **Efficient Re-renders**: Uses `useCallback` for event handlers
- **Cleanup**: Properly cleans up intervals and event listeners

## Empty State

When no photos are provided, displays a friendly message:
```
No photos yet. Add some photos to showcase {petName}!
```

## Browser Support

- Modern browsers with ES6+ support
- Requires support for:
  - CSS Grid
  - Intersection Observer (for lazy loading)
  - Dialog/Modal (via Radix UI)

## Related Components

- `LazyImage` - Lazy loading image component
- `Dialog` - Modal dialog from Radix UI
- `Button` - UI button component

## Requirements Satisfied

This component satisfies the following requirements from the Pet Profile System spec:

- **Requirement 9.3**: Photos tab with responsive grid layout (3 columns desktop, 2 tablet, 1 mobile)
- **Requirement 9.4**: Lightbox viewer with navigation arrows, slideshow mode, captions, download option, and lazy loading

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Selection**: Multi-select mode for batch operations
2. **Photo Editing**: In-browser crop/rotate tools
3. **Zoom**: Pinch-to-zoom support on mobile
4. **Sharing**: Direct social media sharing
5. **Comments**: Per-photo comment threads
6. **Reactions**: Like/love reactions on photos
7. **Tagging**: Tag other pets in photos
8. **Filters**: Apply Instagram-style filters
9. **Metadata**: Display EXIF data (date, location, camera)
10. **Comparison**: Side-by-side photo comparison view
