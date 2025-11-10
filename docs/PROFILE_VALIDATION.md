# Profile Validation System

## Overview

The profile validation system provides comprehensive input validation for all user profile data using Zod schemas. This ensures data integrity, security, and a consistent user experience across the application.

## Location

All validation schemas are located in: `lib/validations/profile-schemas.ts`

## Validation Schemas

### Basic Information

#### Full Name (`fullNameSchema`)
- **Length**: 2-100 characters
- **Format**: Letters, spaces, hyphens, and apostrophes only
- **Example**: "John O'Brien-Smith"

#### Display Name (`displayNameSchema`)
- **Length**: 1-50 characters
- **Format**: Any Unicode characters including emojis
- **Optional**: Yes

#### Username (`usernameSchema`)
- **Length**: 3-20 characters
- **Format**: Must start with a letter, alphanumeric + underscore/hyphen
- **Case**: Automatically converted to lowercase
- **Example**: "john_doe123"

#### Date of Birth (`dateOfBirthSchema`)
- **Format**: ISO 8601 datetime string
- **Validation**: Must be at least 13 years old
- **Optional**: Yes

#### Gender (`genderSchema`)
- **Options**: male, female, non-binary, custom, prefer-not-to-say
- **Custom Gender**: Up to 50 characters when "custom" is selected

### Bio and Interests

#### Bio (`bioSchema`)
- **Length**: Maximum 1000 characters
- **Hashtags**: Maximum 10 hashtags allowed
- **Optional**: Yes

#### Interests (`interestsSchema`)
- **Per Interest**: 1-30 characters
- **Total**: Maximum 30 interests
- **Optional**: Yes

### Contact Information

#### Email (`emailSchema`)
- **Format**: Valid email address
- **Case**: Automatically converted to lowercase
- **Required**: Yes (for email changes)

#### Phone Number (`phoneSchema`)
- **Format**: International format with country code (E.164)
- **Pattern**: `+[1-9][0-9]{1,14}`
- **Example**: "+12025551234"
- **Optional**: Yes

#### Website URL (`websiteUrlSchema`)
- **Format**: Valid URL with http:// or https://
- **Example**: "https://example.com"
- **Optional**: Yes

#### Social Media Handles
Each platform has specific validation:

- **Instagram** (`instagramHandleSchema`): Letters, numbers, dots, underscores (1-50 chars)
- **Twitter** (`twitterHandleSchema`): Letters, numbers, underscores (1-50 chars)
- **TikTok** (`tiktokHandleSchema`): Letters, numbers, dots, underscores (1-50 chars)
- **YouTube** (`youtubeHandleSchema`): Letters, numbers, underscores, hyphens (1-50 chars)
- **Facebook** (`facebookHandleSchema`): Letters, numbers, dots (1-50 chars)

### Location

#### Country (`countrySchema`)
- **Length**: 2-100 characters
- **Optional**: Yes

#### State/Region (`stateSchema`)
- **Length**: Maximum 100 characters
- **Optional**: Yes

#### City (`citySchema`)
- **Length**: Maximum 100 characters
- **Optional**: Yes

#### Timezone (`timezoneSchema`)
- **Format**: IANA timezone identifier (e.g., "America/New_York")
- **Pattern**: `[A-Za-z_]+/[A-Za-z_]+`
- **Optional**: Yes

### Privacy Settings

#### Profile Visibility (`profileVisibilitySchema`)
- **Options**: public, friends, private, custom

#### Field Visibility (`visibilityLevelSchema`)
- **Options**: everyone, friends, only_me, never

#### Birthday Visibility (`birthdayVisibilitySchema`)
- **Options**: everyone, friends, only_me, hide_year

#### Location Visibility (`locationVisibilitySchema`)
- **Options**: exact, state, country, hidden

#### Message Permissions (`messagePermissionsSchema`)
- **Options**: everyone, friends, friends_of_friends, following, no_one

#### Tag Permissions (`tagPermissionsSchema`)
- **Options**: everyone, friends, only_me, no_one

### Special Operations

#### Username Change (`usernameChangeSchema`)
- **Fields**:
  - `newUsername`: Valid username (see username validation)
  - `password`: Required for security verification

#### Email Change (`emailChangeSchema`)
- **Fields**:
  - `newEmail`: Valid email address
  - `password`: Required for security verification

#### Phone Verification (`phoneVerificationSchema`, `otpVerificationSchema`)
- **Phone Verification**:
  - `phone`: Valid international phone number
- **OTP Verification**:
  - `phone`: Valid international phone number
  - `otp`: 6-digit numeric code

#### User Blocking/Restricting
- **Block User** (`blockUserSchema`): Requires `targetUserId`
- **Restrict User** (`restrictUserSchema`): Requires `targetUserId`

## Composite Schemas

### Profile Basic Info (`profileBasicInfoSchema`)
Combines: fullName, displayName, username, dateOfBirth, showAge, showBirthYear, gender, customGender

**Special Validation**: If gender is "custom", customGender must be provided

### Profile Bio (`profileBioSchema`)
Combines: bio, interests

### Profile Contact (`profileContactSchema`)
Combines: email, phone, websiteUrl, socialLinks, country, state, city, timezone

### Complete Profile Update (`profileUpdateSchema`)
Combines all profile sections for comprehensive updates with all fields optional

## Usage Examples

### Basic Validation

```typescript
import { usernameSchema, emailSchema } from '@/lib/validations/profile-schemas'

// Validate username
const result = usernameSchema.safeParse('john_doe')
if (!result.success) {
  console.error(result.error.errors)
}

// Validate email
const emailResult = emailSchema.safeParse('user@example.com')
```

### Form Validation with React Hook Form

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { profileBasicInfoSchema } from '@/lib/validations/profile-schemas'

const form = useForm({
  resolver: zodResolver(profileBasicInfoSchema),
  defaultValues: {
    fullName: '',
    username: '',
    // ...
  }
})
```

### API Route Validation

```typescript
import { profileUpdateSchema } from '@/lib/validations/profile-schemas'

export async function PUT(request: Request) {
  const body = await request.json()
  
  const result = profileUpdateSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.errors },
      { status: 400 }
    )
  }
  
  // Process validated data
  const validatedData = result.data
  // ...
}
```

## Error Messages

All schemas provide user-friendly error messages:

- **Length errors**: "Username must be at least 3 characters"
- **Format errors**: "Username must start with a letter and contain only letters, numbers, underscores, and hyphens"
- **Required errors**: "Full name is required"
- **Custom validation**: "You must be at least 13 years old"

## Security Features

1. **Strict Mode**: All schemas use `.strict()` to prevent unexpected fields
2. **Sanitization**: Automatic trimming and case normalization where appropriate
3. **Type Safety**: Full TypeScript type inference from schemas
4. **Server-Side Validation**: All schemas can be used on both client and server

## Type Exports

All schemas export corresponding TypeScript types:

```typescript
import type {
  ProfileBasicInfo,
  ProfileBio,
  ProfileContact,
  PrivacySettings,
  UsernameChange,
  EmailChange,
  // ... etc
} from '@/lib/validations/profile-schemas'
```

## Requirements Coverage

This validation system covers the following requirements from the user profile system specification:

- **2.1-2.7**: Basic info validation (name, username, DOB, gender)
- **3.1-3.8**: Bio validation (rich text, mentions, hashtags, URLs)
- **4.1-4.5**: Interests validation
- **5.1-5.6**: Contact info validation (email, phone, website, social)
- **6.1-6.5**: Location validation
- **9.1-9.6**: Privacy settings validation
- **10.1-10.5**: User blocking/restricting validation
- **12.3-12.4**: Username change validation

## Testing

All validation schemas should be tested with:
- Valid inputs
- Invalid inputs (too short, too long, wrong format)
- Edge cases (empty strings, special characters, Unicode)
- Boundary conditions (exactly at min/max length)

Example test:

```typescript
import { usernameSchema } from '@/lib/validations/profile-schemas'

describe('usernameSchema', () => {
  it('accepts valid usernames', () => {
    expect(usernameSchema.safeParse('john_doe').success).toBe(true)
  })
  
  it('rejects usernames starting with numbers', () => {
    expect(usernameSchema.safeParse('123john').success).toBe(false)
  })
  
  it('rejects usernames that are too short', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false)
  })
})
```

---

*Last updated: November 10, 2025*
