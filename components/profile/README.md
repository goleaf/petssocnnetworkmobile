# Profile Components

This directory contains components related to user profile display and management.

## ProfileCompletionWidget

A visual widget that displays the user's profile completion percentage with a circular progress indicator and actionable checklist.

### Features

- **Circular Progress Indicator**: Visual representation of completion percentage
- **Color-Coded Progress**: 
  - Red (0-30%): "Get started on your profile"
  - Yellow (31-60%): "You're making progress!"
  - Green (61-100%): "Looking good!" / "Profile complete!"
- **Interactive Checklist**: Shows incomplete items with checkmarks/X marks
- **Clickable Navigation**: Each item can navigate to the relevant section
- **Motivational Messages**: Context-aware tips based on completion level

### Usage

```tsx
import { ProfileCompletionWidget } from '@/components/profile/profile-completion-widget'

function ProfilePage({ user, petsCount }) {
  const handleNavigate = (section: string) => {
    // Navigate to the appropriate settings section
    router.push(`/settings/profile?tab=${section}`)
  }

  return (
    <ProfileCompletionWidget
      user={user}
      petsCount={petsCount}
      onNavigate={handleNavigate}
    />
  )
}
```

### Props

- `user` (User): The user object containing profile data
- `petsCount` (number, optional): Number of pets the user has added
- `onNavigate` ((section: string) => void, optional): Callback when a checklist item is clicked
- `className` (string, optional): Additional CSS classes

### Completion Calculation

The widget calculates completion based on weighted values:

- Profile photo: 10%
- Cover photo: 5%
- Bio (50+ chars): 15%
- Location: 5%
- Date of birth: 5%
- Phone verified: 10%
- Email verified: 10%
- Interests (3+): 10%
- At least one pet: 20%
- Contact info: 5%
- Social links: 5%

**Total: 100%**

### Sections

The component recognizes these navigation sections:

- `basic-info`: Profile photo, cover photo, date of birth
- `about-me`: Bio, interests
- `contact`: Location, phone, email, website, social links
- `pets`: Pet management

### Testing

Tests are located in `tests/active/components/profile-completion-widget.test.tsx`

Run tests with:
```bash
npm run test -- profile-completion-widget
```

### Example

See `profile-completion-widget-example.tsx` for a complete integration example.
