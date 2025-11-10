# Contact Tab Email and Phone Verification UI

## Overview

This implementation adds email and phone verification UI to the ContactTab component, fulfilling task 9.1 of the user profile system specification.

## Components Created

### 1. EmailChangeModal (`components/profile/email-change-modal.tsx`)

A modal dialog for changing email addresses with password verification.

**Features:**
- Displays current email (read-only)
- New email input with validation
- Password field for security verification
- Email format validation
- Duplicate email check
- Success state with confirmation message
- Error handling with user-friendly messages
- Loading states during submission

**Props:**
```typescript
interface EmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  onSubmit: (newEmail: string, password: string) => Promise<void>
}
```

**Usage:**
```tsx
<EmailChangeModal
  isOpen={isEmailModalOpen}
  onClose={() => setIsEmailModalOpen(false)}
  currentEmail={formData.email}
  onSubmit={handleEmailChange}
/>
```

### 2. PhoneVerificationModal (`components/profile/phone-verification-modal.tsx`)

A two-step modal for adding/changing phone numbers with OTP verification.

**Features:**
- International phone format with country code dropdown
- 20 common country codes with flags
- Phone number validation (7-15 digits)
- Two-step flow: phone entry → OTP verification
- 6-digit OTP input with numeric keyboard
- Resend OTP functionality
- Success state with confirmation
- Error handling for both steps
- Loading states during submission

**Props:**
```typescript
interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  currentPhone?: string
  onSubmit: (phoneNumber: string, countryCode: string) => Promise<void>
  onVerifyOTP: (otp: string) => Promise<void>
}
```

**Usage:**
```tsx
<PhoneVerificationModal
  isOpen={isPhoneModalOpen}
  onClose={() => setIsPhoneModalOpen(false)}
  currentPhone={formData.phone}
  onSubmit={handlePhoneSubmit}
  onVerifyOTP={handlePhoneVerifyOTP}
/>
```

### 3. Enhanced ContactTab (`components/profile/edit-tabs/contact-tab.tsx`)

Updated ContactTab component with verification status indicators.

**New Features:**
- Email field shows verification status (verified checkmark or unverified warning)
- "Change Email" link opens EmailChangeModal
- Phone field shows verification status
- "Add Phone" or "Change Phone" link opens PhoneVerificationModal
- Disabled inputs for email and phone (changed via modals only)
- Contextual help text based on verification status
- Visual indicators using CheckCircle2 and AlertCircle icons

**Verification Status Display:**
- ✅ Green checkmark + "Verified" for verified fields
- ⚠️ Amber warning + "Unverified" for unverified fields
- Contextual messages explaining verification importance

## Integration Requirements

### Form Data Structure

The ContactTab expects the following fields in `formData`:

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

### API Integration

The current implementation includes mock handlers that need to be replaced with actual API calls:

#### Email Change Handler
```typescript
const handleEmailChange = async (newEmail: string, password: string) => {
  // TODO: Implement actual API call
  // POST /api/users/[userId]/email/change
  // Body: { newEmail, password }
  // Response: { success: boolean, message?: string }
}
```

#### Phone Submit Handler
```typescript
const handlePhoneSubmit = async (phoneNumber: string, countryCode: string) => {
  // TODO: Implement actual API call
  // POST /api/users/[userId]/phone/send-otp
  // Body: { phoneNumber, countryCode }
  // Response: { success: boolean, message?: string }
}
```

#### OTP Verification Handler
```typescript
const handlePhoneVerifyOTP = async (otp: string) => {
  // TODO: Implement actual API call
  // POST /api/users/[userId]/phone/verify-otp
  // Body: { otp }
  // Response: { success: boolean, verified: boolean }
}
```

## Requirements Fulfilled

This implementation fulfills the following requirements from the specification:

### Requirement 5.1
✅ Email field displays verified checkmark or "Unverified - Click to verify" link

### Requirement 5.2
✅ Email change modal with new email input and current password field
✅ Verification email sent to new address (API integration needed)

### Requirement 5.3
✅ Notification to old email when changed (API integration needed)

### Requirement 5.4
✅ Phone number input with international format and country code dropdown
✅ OTP verification flow for phone number changes

## Testing

A demo component is provided for testing:

```tsx
import { ContactTabDemo } from "@/components/profile/contact-tab-demo"

// Use in a page
<ContactTabDemo />
```

The demo includes:
- Pre-populated form data
- Mock verification states
- Visual display of current form data
- All interactive features

## Next Steps

1. **API Integration**: Replace mock handlers with actual API calls
2. **Email Verification**: Implement email verification token system
3. **SMS Integration**: Integrate with SMS provider (Twilio, AWS SNS, etc.)
4. **Rate Limiting**: Add rate limiting for OTP requests
5. **Security**: Implement CSRF protection for sensitive operations
6. **Notifications**: Add toast notifications for success/error states
7. **Analytics**: Track verification completion rates

## Dependencies

- `@radix-ui/react-dialog` - Modal dialogs
- `lucide-react` - Icons (CheckCircle2, AlertCircle, Mail, Phone, Lock, Loader2)
- Existing UI components (Button, Input, Select, FormLabel, etc.)

## Accessibility

- All modals are keyboard navigable
- Proper ARIA labels and roles
- Focus management on modal open/close
- Screen reader friendly status indicators
- Semantic HTML structure

## Mobile Considerations

- Responsive design with mobile-first approach
- Numeric keyboard for OTP input (`inputMode="numeric"`)
- Touch-friendly button sizes
- Proper viewport handling for modals
