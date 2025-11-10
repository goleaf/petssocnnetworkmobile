# Pet Stats Bar Component

## Overview

The `PetStatsBar` component displays key statistics for a pet profile in a responsive, interactive card layout. It shows followers count, photos count, posts count, and the pet's age with corresponding icons.

## Requirements

- **Requirement 8.5**: Display followers count, photos count, posts count, and age with icons
- **Requirement 8.6**: Make stats clickable to navigate to respective sections

## Features

- ✅ Displays four key statistics with icons
- ✅ Responsive layout (2 columns on mobile, 4 columns on desktop)
- ✅ Clickable stats with hover effects
- ✅ Keyboard navigation support (Enter and Space keys)
- ✅ Accessibility features (ARIA labels, proper roles)
- ✅ Singular/plural label handling
- ✅ Custom styling support via className prop

## Usage

```tsx
import { PetStatsBar } from "@/components/pet/pet-stats-bar"

function PetProfile() {
  return (
    <PetStatsBar
      followers={245}
      photos={89}
      posts={34}
      age="3 years old"
      onFollowersClick={() => {
        // Navigate to followers section
      }}
      onPhotosClick={() => {
        // Navigate to photos tab
      }}
      onPostsClick={() => {
        // Navigate to posts tab
      }}
      onAgeClick={() => {
        // Optional: Navigate to timeline or birthday info
      }}
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `followers` | `number` | Yes | Number of followers |
| `photos` | `number` | Yes | Number of photos in gallery |
| `posts` | `number` | Yes | Number of posts featuring this pet |
| `age` | `string` | Yes | Pet's age display string (e.g., "3 years old") |
| `onFollowersClick` | `() => void` | No | Callback when followers stat is clicked |
| `onPhotosClick` | `() => void` | No | Callback when photos stat is clicked |
| `onPostsClick` | `() => void` | No | Callback when posts stat is clicked |
| `onAgeClick` | `() => void` | No | Callback when age stat is clicked |
| `className` | `string` | No | Additional CSS classes for the card |

## Behavior

### Age Display

The component intelligently parses the age string to extract the numeric value:
- `"3 years old"` → displays `"3"`
- `"5 years, 3 months old"` → displays `"5"`
- `"Age unknown"` → displays `"—"`
- `"6 months old"` → displays `"6"`

### Clickability

Stats are only clickable when an `onClick` handler is provided:
- With handler: Shows hover effect, cursor pointer, keyboard navigation
- Without handler: No hover effect, default cursor, not focusable

### Responsive Layout

- **Mobile (< 640px)**: 2 columns grid
- **Desktop (≥ 640px)**: 4 columns grid

### Accessibility

- Proper ARIA labels for screen readers
- Keyboard navigation with Enter and Space keys
- Focus indicators for interactive elements
- Semantic HTML structure

## Examples

### Basic Usage (No Click Handlers)

```tsx
<PetStatsBar
  followers={100}
  photos={50}
  posts={25}
  age="2 years old"
/>
```

### With Navigation

```tsx
<PetStatsBar
  followers={245}
  photos={89}
  posts={34}
  age="3 years old"
  onFollowersClick={() => router.push("#followers")}
  onPhotosClick={() => setActiveTab("photos")}
  onPostsClick={() => setActiveTab("posts")}
/>
```

### Custom Styling

```tsx
<PetStatsBar
  followers={245}
  photos={89}
  posts={34}
  age="3 years old"
  className="shadow-lg"
/>
```

## Testing

The component includes comprehensive unit tests covering:
- Rendering all stats correctly
- Singular/plural label handling
- Click handler functionality
- Keyboard navigation
- Accessibility features
- Custom className application
- Age parsing edge cases
- Responsive layout classes

Run tests with:
```bash
npm run test -- pet-stats-bar
```

## Integration

The component is used in:
- `app/[locale]/pet/[username]/[petSlug]/page.tsx` - Main pet profile page

## Future Enhancements

Potential improvements for future iterations:
- Animated number transitions when stats change
- Tooltip showing additional information on hover
- Loading skeleton state
- Custom icon support
- Trend indicators (up/down arrows for follower growth)
