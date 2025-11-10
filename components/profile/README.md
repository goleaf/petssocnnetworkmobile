# Profile Components

This directory contains components for the user profile system, including profile editing, photo management, mention functionality, and contact verification.

## Mention System

The mention system allows users to reference other users in their bio and other text fields using the `@username` syntax.

### Components

#### MentionAutocomplete

A component that provides autocomplete functionality for @mentions in textarea fields.

**Features:**
- Triggers dropdown on `@` symbol
- Shows followers and friends with profile photos
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Debounced search (150ms)
- Clickable user selection
- Automatic cursor positioning after insertion

**Usage:**

```tsx
import { MentionAutocomplete } from "@/components/profile/mention-autocomplete"
import { useRef } from "react"

function MyComponent() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState("")

  const handleSearchUsers = async (query: string) => {
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
    const data = await response.json()
    return data.users
  }

  return (
    <>
      <textarea ref={textareaRef} value={value} onChange={(e) => setValue(e.target.value)} />
      <MentionAutocomplete
        textareaRef={textareaRef}
        value={value}
        onChange={setValue}
        onSearchUsers={handleSearchUsers}
      />
    </>
  )
}
```

**Props:**
- `textareaRef`: Reference to the textarea element
- `value`: Current textarea value
- `onChange`: Callback when value changes (with mention inserted)
- `onSearchUsers`: Async function to fetch users for mentions
- `className`: Optional className for the dropdown

#### MentionText

A component that renders text with @mentions as clickable links.

**Features:**
- Parses `@username` patterns
- Renders mentions as blue links
- Links to user profile pages
- Preserves surrounding text

**Usage:**

```tsx
import { MentionText } from "@/components/profile/mention-text"

function MyComponent() {
  return (
    <MentionText text="Hello @johndoe and @janedoe!" />
  )
}
```

**Props:**
- `text`: The text to render with mentions
- `className`: Optional className for the container

### API Endpoint

#### GET /api/users/search

Searches users for mentions based on followers and friends.

**Query Parameters:**
- `q`: Search query (username or full name)
- `limit`: Maximum number of results (default: 10)

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatar": "/avatar.jpg"
    }
  ]
}
```

**Authentication:** Required (returns 401 if not authenticated)

**Filtering:**
- Only returns followers and users you're following
- Excludes blocked and muted users
- Prioritizes mutual friends (followers you also follow)

### Utility Functions

#### lib/utils/mention-utils.ts

Provides utility functions for working with mentions:

- `parseMentions(text)`: Parse text and convert mentions to JSX links
- `extractMentions(text)`: Extract all usernames from text
- `hasMentions(text)`: Check if text contains mentions
- `countMentions(text)`: Count number of mentions
- `isValidMention(mention)`: Validate mention format

### Styling

Mentions are styled with:
- Blue color: `text-blue-600 dark:text-blue-400`
- Hover underline: `hover:underline`
- Font weight: `font-medium`
- Smooth transitions: `transition-colors`

### Keyboard Navigation

When the mention dropdown is open:
- **Arrow Down**: Move to next user
- **Arrow Up**: Move to previous user
- **Enter/Tab**: Select highlighted user
- **Escape**: Close dropdown

### Integration Example

See `components/profile/edit-tabs/about-me-tab.tsx` for a complete integration example with the bio textarea.

### Testing

Tests are located in:
- `tests/active/components/profile/mention-autocomplete.test.tsx`
- `tests/active/components/profile/mention-text.test.tsx`

Run tests with:
```bash
npm test -- tests/active/components/profile/mention-autocomplete.test.tsx
npm test -- tests/active/components/profile/mention-text.test.tsx
```

## Contact Verification System

The contact verification system provides secure email and phone number management with verification workflows.

### Components

#### EmailChangeModal

A modal dialog for changing email addresses with password verification.

**Features:**
- Current email display (read-only)
- New email input with format validation
- Password field for security verification
- Real-time validation with error messages
- Success state with confirmation message
- Loading states during submission
- Automatic modal close after success
- Prevents duplicate email addresses

**Usage:**

```tsx
import { EmailChangeModal } from "@/components/profile/email-change-modal"

function ContactTab() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleEmailChange = async (newEmail: string, password: string) => {
    // API call to change email
    await fetch('/api/users/me/email/change', {
      method: 'POST',
      body: JSON.stringify({ newEmail, password })
    })
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Change Email</Button>
      <EmailChangeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentEmail="user@example.com"
        onSubmit={handleEmailChange}
      />
    </>
  )
}
```

**Props:**
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback when modal should close
- `currentEmail`: Current email address (displayed read-only)
- `onSubmit`: Async function to handle email change (receives newEmail and password)

#### PhoneVerificationModal

A two-step modal for adding/changing phone numbers with OTP verification.

**Features:**
- International phone format with country code dropdown
- 20 common country codes with flag emojis
- Phone number validation (7-15 digits)
- Two-step flow: phone entry → OTP verification
- 6-digit OTP input with numeric keyboard
- Resend OTP functionality
- Success state with confirmation
- Error handling for both steps
- Loading states during submission

**Usage:**

```tsx
import { PhoneVerificationModal } from "@/components/profile/phone-verification-modal"

function ContactTab() {
  const [isOpen, setIsOpen] = useState(false)
  
  const handlePhoneSubmit = async (phoneNumber: string, countryCode: string) => {
    // API call to send OTP
    await fetch('/api/users/me/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, countryCode })
    })
  }
  
  const handleVerifyOTP = async (otp: string) => {
    // API call to verify OTP
    await fetch('/api/users/me/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp })
    })
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Add Phone</Button>
      <PhoneVerificationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentPhone="+1 555 123 4567"
        onSubmit={handlePhoneSubmit}
        onVerifyOTP={handleVerifyOTP}
      />
    </>
  )
}
```

**Props:**
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback when modal should close
- `currentPhone`: Optional current phone number (displayed read-only)
- `onSubmit`: Async function to send OTP (receives phoneNumber and countryCode)
- `onVerifyOTP`: Async function to verify OTP (receives otp string)

#### ContactTab (Enhanced)

The ContactTab component now includes verification status indicators and modal integration.

**New Features:**
- Email field shows verification status (verified checkmark or unverified warning)
- "Change Email" link opens EmailChangeModal
- Phone field shows verification status
- "Add Phone" or "Change Phone" link opens PhoneVerificationModal
- Disabled inputs for email and phone (changed via modals only)
- Contextual help text based on verification status
- Visual indicators using CheckCircle2 and AlertCircle icons

**Form Data Structure:**
```typescript
{
  email: string
  emailVerified: boolean
  phone?: string
  phoneVerified?: boolean
  website?: string
  country: string
  city: string
  socialMedia?: {
    instagram?: string
    twitter?: string
    youtube?: string
  }
}
```

### Demo Component

A demo component is available for testing the contact verification UI:

```tsx
import { ContactTabDemo } from "@/components/profile/contact-tab-demo"

// Use in a page
<ContactTabDemo />
```

### API Integration

The contact verification system requires the following API endpoints:

#### Email Change
- **POST** `/api/users/[userId]/email/change`
  - Body: `{ newEmail: string, password: string }`
  - Response: `{ success: boolean, message?: string }`

#### Phone OTP
- **POST** `/api/users/[userId]/phone/send-otp`
  - Body: `{ phoneNumber: string, countryCode: string }`
  - Response: `{ success: boolean, message?: string }`

- **POST** `/api/users/[userId]/phone/verify-otp`
  - Body: `{ otp: string }`
  - Response: `{ success: boolean, verified: boolean }`

### Styling

Verification status indicators use:
- **Verified**: Green color with CheckCircle2 icon
- **Unverified**: Amber color with AlertCircle icon
- **Error states**: Red border on inputs with destructive color
- **Success states**: Green CheckCircle2 icon with confirmation message

### Accessibility

- All modals are keyboard navigable
- Proper ARIA labels and roles
- Focus management on modal open/close
- Screen reader friendly status indicators
- Semantic HTML structure

### Mobile Considerations

- Responsive design with mobile-first approach
- Numeric keyboard for OTP input (`inputMode="numeric"`)
- Touch-friendly button sizes
- Proper viewport handling for modals

### Documentation

See `components/profile/CONTACT_TAB_VERIFICATION.md` for detailed implementation notes and requirements fulfilled.
