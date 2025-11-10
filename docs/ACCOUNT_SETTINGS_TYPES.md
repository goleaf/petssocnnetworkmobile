# Account Settings Type System

## Overview

The account settings type system provides comprehensive TypeScript types for managing user account security, privacy preferences, notification settings, and session management. All types are defined in `lib/types/settings.ts` and exported through `lib/types/index.ts`.

## Core Types

### Privacy Levels

```typescript
type PrivacyLevel = "public" | "private" | "followers-only" | "friends-only" | "no-one"
```

Used throughout the system to control visibility and access permissions.

### PrivacySettings

Comprehensive interface for managing all privacy-related settings:

- **Profile visibility**: Control who can see profile, email, phone, birthday, age, location, online status
- **Content visibility**: Control visibility of pets, posts, followers, and following lists
- **Interaction permissions**: Control who can tag, mention, and interact with the user
- **Search controls**: Control search engine indexing, internal search visibility, and recommendations
- **Profile sections**: Granular control over basics, statistics, friends, pets, and activity sections

### MessagingPrivacySettings

Controls for direct messaging privacy:

- `whoCanMessage`: Who can send direct messages
- `readReceipts`: Show when messages are read
- `typingIndicators`: Show when user is typing
- `allowForwarding`: Allow others to forward messages

### NotificationSettings

Multi-channel notification preferences:

- **Channel preferences**: Separate settings for in-app, push, email, SMS, and digest
- **Frequency options**: Real-time, hourly, daily, or weekly delivery
- **Priority thresholds**: Low, normal, high, or urgent
- **Category filtering**: Per-channel category selection
- **Quiet hours**: Time-based notification suppression with critical exception handling
- **Preview settings**: Control notification content visibility on lock screens

### SessionInfo

Session tracking with device and location information:

- Session identification and tokens
- Device information (name, type, OS, browser)
- Geolocation data (IP, city, country)
- Activity timestamps (created, last activity, expiration)
- Revocation status and current session flag

### Request Types

#### EmailChangeRequest
- User ID and new email address
- Current password for verification
- Verification email flag

#### PasswordChangeRequest
- User ID
- Current password for verification
- New password

#### AccountDeletionRequest
- User ID and password
- Deletion reason (privacy_concerns, not_useful, too_many_notifications, found_alternative, temporary_break, other)
- Optional custom reason text

## Usage Examples

### Privacy Settings

```typescript
import { PrivacySettings, PrivacyLevel } from '@/lib/types/settings'

const userPrivacy: PrivacySettings = {
  profile: 'public',
  email: 'friends-only',
  phone: 'private',
  birthday: 'public_hide_year',
  location: 'followers-only',
  onlineStatus: true,
  pets: 'public',
  posts: 'public',
  followers: 'public',
  following: 'friends-only',
  allowTagging: 'friends-only',
  tagReviewRequired: true,
  allowMentions: 'followers-only',
  searchable: true,
  searchIndexingEnabled: true,
  showInSearch: true,
  showInRecommendations: true
}
```

### Notification Settings

```typescript
import { NotificationSettings } from '@/lib/types/settings'

const notifications: NotificationSettings = {
  userId: 'user123',
  channelPreferences: {
    push: {
      enabled: true,
      frequency: 'real-time',
      priorityThreshold: 'normal',
      categories: ['interactions', 'social', 'messages']
    },
    email: {
      enabled: true,
      frequency: 'daily',
      priorityThreshold: 'high',
      categories: ['system', 'security']
    },
    // ... other channels
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6], // All days
    allowCritical: true
  },
  previewSettings: {
    showPreviews: true,
    showOnLockScreen: false
  }
}
```

### Session Management

```typescript
import { SessionInfo } from '@/lib/types/settings'

const session: SessionInfo = {
  id: 'session123',
  token: 'secure-token',
  customName: 'My iPhone',
  deviceName: 'iPhone 14 Pro',
  deviceType: 'mobile',
  os: 'iOS 17',
  browser: 'Safari',
  ip: '192.168.1.1',
  city: 'San Francisco',
  country: 'United States',
  createdAt: '2024-01-01T00:00:00Z',
  lastActivityAt: '2024-01-01T12:00:00Z',
  expiresAt: '2024-01-08T00:00:00Z',
  revoked: false,
  isCurrent: true
}
```

## Integration with Database

These types align with the Prisma schema models:

- `User.privacy` (JSON) → `PrivacySettings`
- `User.notificationSettings` (JSON) → `NotificationSettings`
- `Session` model → `SessionInfo`
- `EmailVerification` model → `EmailChangeRequest`

See `docs/DATABASE_ARCHITECTURE.md` for database schema details.

## Related Documentation

- [Account Settings Requirements](.kiro/specs/account-settings/requirements.md)
- [Account Settings Tasks](.kiro/specs/account-settings/tasks.md)
- [Database Architecture](./DATABASE_ARCHITECTURE.md)
- [Features List](../doc/FEATURES.md)
- [Changelog](../doc/CHANGELOG.md)

## Type Safety Benefits

1. **Compile-time validation**: TypeScript catches type errors before runtime
2. **IDE autocomplete**: Full IntelliSense support for all settings
3. **Refactoring safety**: Changes to types are tracked across the codebase
4. **Documentation**: Types serve as living documentation
5. **Consistency**: Ensures consistent data structures across frontend and backend

## Next Steps

With types in place, the next implementation tasks are:

1. Email change functionality with verification workflow
2. Password change with session invalidation
3. Session management UI and API endpoints
4. Account deletion with grace period
5. Privacy settings UI and enforcement
6. Notification settings UI and delivery logic

See `.kiro/specs/account-settings/tasks.md` for the complete implementation plan.
