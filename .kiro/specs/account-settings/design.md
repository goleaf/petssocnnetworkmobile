# Design Document

## Overview

The Account Settings system provides a comprehensive interface for users to manage their account security, privacy preferences, notification settings, and profile customization. The system is built on Next.js 14 with App Router, using React Server Components where appropriate and Client Components for interactive features. The design leverages the existing authentication infrastructure, Prisma ORM for database operations, and follows the established patterns in the codebase.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Settings UI │  │  Dialogs &   │  │  Form        │      │
│  │  Components  │  │  Modals      │  │  Validation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Server      │  │  API Routes  │  │  Middleware  │      │
│  │  Actions     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth        │  │  Privacy     │  │  Notification│      │
│  │  Services    │  │  Services    │  │  Services    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Prisma      │  │  Session     │  │  Email       │      │
│  │  Client      │  │  Store       │  │  Queue       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
│  Users | Sessions | EmailVerifications | NotificationPrefs  │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The settings system follows a modular component structure:

- **Page Component** (`app/[locale]/settings/page.tsx`): Main container, already exists with basic functionality
- **Settings Sections**: Organized into logical cards (Account, Privacy, Notifications, etc.)
- **Reusable Components**: Privacy selectors, switches, dialogs from existing UI library
- **Server Actions**: Handle mutations and sensitive operations
- **API Routes**: Handle file uploads and external integrations

## Components and Interfaces

### 1. Database Schema Extensions

Extend the existing Prisma schema to support new settings features:

```prisma
model User {
  id                    String    @id @default(uuid())
  username              String    @unique
  email                 String    @unique
  emailVerified         Boolean   @default(false)
  passwordHash          String
  passwordChangedAt     DateTime?
  sessionInvalidatedAt  DateTime?
  
  // Privacy settings (JSON field)
  privacy               Json?
  
  // Notification preferences
  notificationSettings  Json?
  
  // Blocked users
  blockedUsers          String[]
  mutedUsers            String[]
  
  // Search and discoverability
  searchIndexingEnabled Boolean   @default(true)
  showInSearch          Boolean   @default(true)
  showInRecommendations Boolean   @default(true)
  
  // Account deletion
  deletionScheduledAt   DateTime?
  deletionReason        String?
  
  // Relations
  emailVerifications    EmailVerification[]
  sessions              Session[]
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([email])
  @@index([username])
  @@index([deletionScheduledAt])
  @@map("users")
}

model EmailVerification {
  id            String    @id @default(uuid())
  userId        String
  pendingEmail  String
  token         String    @unique
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("email_verifications")
}

model Session {
  id              String    @id @default(uuid())
  userId          String
  token           String    @unique
  customName      String?
  deviceName      String?
  deviceType      String?   // mobile, tablet, desktop
  os              String?
  browser         String?
  ip              String?
  city            String?
  country         String?
  revoked         Boolean   @default(false)
  createdAt       DateTime  @default(now())
  lastActivityAt  DateTime  @default(now())
  expiresAt       DateTime
  
  @@index([userId])
  @@index([token])
  @@index([revoked])
  @@index([expiresAt])
  @@map("sessions")
}

model BlockedUser {
  id          String    @id @default(uuid())
  userId      String
  blockedId   String
  blockedAt   DateTime  @default(now())
  
  @@unique([userId, blockedId])
  @@index([userId])
  @@index([blockedId])
  @@map("blocked_users")
}

model MutedUser {
  id        String    @id @default(uuid())
  userId    String
  mutedId   String
  mutedAt   DateTime  @default(now())
  
  @@unique([userId, mutedId])
  @@index([userId])
  @@index([mutedId])
  @@map("muted_users")
}
```

### 2. TypeScript Interfaces

```typescript
// lib/types/settings.ts

export interface PrivacySettings {
  profile: PrivacyLevel
  email: PrivacyLevel
  location: PrivacyLevel
  pets: PrivacyLevel
  posts: PrivacyLevel
  followers: PrivacyLevel
  following: PrivacyLevel
  searchable: boolean
  allowFollowRequests: PrivacyLevel
  allowTagging: PrivacyLevel
  allowMentions: PrivacyLevel
  secureMessages: boolean
  sections: {
    basics: PrivacyLevel
    statistics: PrivacyLevel
    friends: PrivacyLevel
    pets: PrivacyLevel
    activity: PrivacyLevel
  }
}

export interface MessagingPrivacySettings {
  whoCanMessage: PrivacyLevel
  readReceipts: boolean
  typingIndicators: boolean
  allowForwarding: boolean
}

export interface NotificationChannelPreference {
  enabled: boolean
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly'
  priorityThreshold: 'low' | 'normal' | 'high' | 'urgent'
  categories: string[]
}

export interface NotificationSettings {
  userId: string
  channelPreferences: {
    in_app: NotificationChannelPreference
    push: NotificationChannelPreference
    email: NotificationChannelPreference
    sms: NotificationChannelPreference
    digest: NotificationChannelPreference
  }
  quietHours: {
    enabled: boolean
    startTime: string // HH:mm format
    endTime: string
    days: number[] // 0-6, Sunday-Saturday
    allowCritical: boolean
  }
  previewSettings: {
    showPreviews: boolean
    showOnLockScreen: boolean
  }
}

export interface SessionInfo {
  token: string
  customName?: string
  deviceName?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  os?: string
  browser?: string
  ip?: string
  city?: string
  country?: string
  createdAt: string
  lastActivityAt: string
  revoked: boolean
  isCurrent: boolean
}

export interface EmailChangeRequest {
  userId: string
  newEmail: string
  currentPassword: string
  sendVerification: boolean
}

export interface PasswordChangeRequest {
  userId: string
  currentPassword: string
  newPassword: string
}

export interface AccountDeletionRequest {
  userId: string
  password: string
  reason: string
  otherReason?: string
}
```

### 3. Server Actions

Create server actions for secure mutations:

```typescript
// lib/actions/account.ts

'use server'

import { getCurrentUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

export async function requestEmailChangeAction(request: EmailChangeRequest) {
  const user = await getCurrentUser()
  if (!user || user.id !== request.userId) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Verify current password
  const passwordValid = await compare(request.currentPassword, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: 'Invalid password' }
  }
  
  // Check if email is already in use
  const existingUser = await prisma.user.findUnique({
    where: { email: request.newEmail }
  })
  if (existingUser) {
    return { success: false, error: 'Email already in use' }
  }
  
  // Generate verification token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  // Store verification request
  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      pendingEmail: request.newEmail,
      token,
      expiresAt
    }
  })
  
  if (request.sendVerification) {
    // Send verification email to new address
    await sendEmail({
      to: request.newEmail,
      subject: 'Verify your new email address',
      html: `Click here to verify: ${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`
    })
    
    // Send notification to old email
    await sendEmail({
      to: user.email,
      subject: 'Email change requested',
      html: `A request was made to change your email. Cancel: ${process.env.NEXT_PUBLIC_BASE_URL}/cancel-email-change?token=${token}`
    })
  }
  
  return { success: true }
}

export async function updatePasswordAction(request: PasswordChangeRequest) {
  const user = await getCurrentUser()
  if (!user || user.id !== request.userId) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Verify current password
  const passwordValid = await compare(request.currentPassword, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: 'Invalid current password' }
  }
  
  // Hash new password
  const passwordHash = await hash(request.newPassword, 12)
  
  // Update password and invalidate all other sessions
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      sessionInvalidatedAt: new Date()
    }
  })
  
  // Revoke all sessions except current
  await prisma.session.updateMany({
    where: {
      userId: user.id,
      token: { not: getCurrentSessionToken() }
    },
    data: { revoked: true }
  })
  
  // Send notification email
  await sendEmail({
    to: user.email,
    subject: 'Password changed',
    html: 'Your password was successfully changed.'
  })
  
  return { success: true }
}

export async function requestAccountDeletionAction(request: AccountDeletionRequest) {
  const user = await getCurrentUser()
  if (!user || user.id !== request.userId) {
    return { success: false, error: 'Unauthorized' }
  }
  
  // Verify password
  const passwordValid = await compare(request.password, user.passwordHash)
  if (!passwordValid) {
    return { success: false, error: 'Invalid password' }
  }
  
  // Schedule deletion for 30 days from now
  const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      deletionScheduledAt: deletionDate,
      deletionReason: request.reason === 'other' ? request.otherReason : request.reason
    }
  })
  
  // Revoke all sessions
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { revoked: true }
  })
  
  // Send confirmation email with restore link
  const restoreToken = randomBytes(32).toString('hex')
  await sendEmail({
    to: user.email,
    subject: 'Account deletion scheduled',
    html: `Your account will be deleted on ${deletionDate.toLocaleDateString()}. Restore: ${process.env.NEXT_PUBLIC_BASE_URL}/restore-account?token=${restoreToken}`
  })
  
  return { success: true }
}
```

```typescript
// lib/actions/sessions.ts

'use server'

import { getCurrentUser } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import UAParser from 'ua-parser-js'

export async function getActiveSessionsAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Unauthorized', sessions: [] }
  }
  
  const sessions = await prisma.session.findMany({
    where: {
      userId: user.id,
      revoked: false,
      expiresAt: { gt: new Date() }
    },
    orderBy: { lastActivityAt: 'desc' }
  })
  
  const currentToken = getCurrentSessionToken()
  
  return {
    success: true,
    sessions: sessions.map(s => ({
      ...s,
      isCurrent: s.token === currentToken
    }))
  }
}

export async function logoutSessionAction(token: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  await prisma.session.update({
    where: { token },
    data: { revoked: true }
  })
  
  return { success: true }
}

export async function logoutAllOtherSessionsAction() {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  const currentToken = getCurrentSessionToken()
  
  await prisma.session.updateMany({
    where: {
      userId: user.id,
      token: { not: currentToken }
    },
    data: { revoked: true }
  })
  
  return { success: true }
}

export async function renameSessionDeviceAction(token: string, customName: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }
  
  await prisma.session.update({
    where: { token },
    data: { customName }
  })
  
  return { success: true }
}

function getCurrentSessionToken(): string {
  // Extract from cookie
  const cookieStore = headers().get('cookie')
  // Parse and return session token
  return '' // Implementation details
}
```

### 4. Privacy Service

```typescript
// lib/services/privacy.ts

import { prisma } from '@/lib/prisma'
import type { PrivacySettings, PrivacyLevel } from '@/lib/types'

export async function updatePrivacySettings(userId: string, settings: PrivacySettings) {
  await prisma.user.update({
    where: { id: userId },
    data: { privacy: settings as any }
  })
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { privacy: true }
  })
  
  return user?.privacy as PrivacySettings || getDefaultPrivacySettings()
}

export function canViewProfile(viewerId: string | null, targetUserId: string, privacyLevel: PrivacyLevel): boolean {
  if (!viewerId) {
    return privacyLevel === 'public'
  }
  
  if (viewerId === targetUserId) {
    return true
  }
  
  // Check relationship and privacy level
  // Implementation based on followers, friends, etc.
  return true
}

export async function blockUser(userId: string, blockedId: string) {
  await prisma.blockedUser.create({
    data: { userId, blockedId }
  })
  
  // Remove follower relationships
  // Remove from feeds
}

export async function unblockUser(userId: string, blockedId: string) {
  await prisma.blockedUser.deleteMany({
    where: { userId, blockedId }
  })
}

export async function muteUser(userId: string, mutedId: string) {
  await prisma.mutedUser.create({
    data: { userId, mutedId }
  })
}

export async function unmuteUser(userId: string, mutedId: string) {
  await prisma.mutedUser.deleteMany({
    where: { userId, mutedId }
  })
}

function getDefaultPrivacySettings(): PrivacySettings {
  return {
    profile: 'public',
    email: 'private',
    location: 'followers-only',
    pets: 'public',
    posts: 'public',
    followers: 'public',
    following: 'public',
    searchable: true,
    allowFollowRequests: 'public',
    allowTagging: 'public',
    allowMentions: 'public',
    secureMessages: true,
    sections: {
      basics: 'public',
      statistics: 'public',
      friends: 'public',
      pets: 'public',
      activity: 'public'
    }
  }
}
```

### 5. Notification Service

```typescript
// lib/services/notifications.ts

import { prisma } from '@/lib/prisma'
import type { NotificationSettings } from '@/lib/types'

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationSettings: true }
  })
  
  return user?.notificationSettings as NotificationSettings || getDefaultNotificationSettings(userId)
}

export async function updateNotificationSettings(userId: string, settings: NotificationSettings) {
  await prisma.user.update({
    where: { id: userId },
    data: { notificationSettings: settings as any }
  })
}

export function shouldSendNotification(
  settings: NotificationSettings,
  channel: string,
  category: string,
  priority: string
): boolean {
  const channelPref = settings.channelPreferences[channel]
  
  if (!channelPref?.enabled) {
    return false
  }
  
  // Check quiet hours
  if (settings.quietHours.enabled && !settings.quietHours.allowCritical) {
    const now = new Date()
    const currentTime = `${now.getHours()}:${now.getMinutes()}`
    const currentDay = now.getDay()
    
    if (
      settings.quietHours.days.includes(currentDay) &&
      isWithinTimeRange(currentTime, settings.quietHours.startTime, settings.quietHours.endTime)
    ) {
      return false
    }
  }
  
  // Check priority threshold
  const priorityLevels = ['low', 'normal', 'high', 'urgent']
  const requiredIndex = priorityLevels.indexOf(channelPref.priorityThreshold)
  const actualIndex = priorityLevels.indexOf(priority)
  
  if (actualIndex < requiredIndex) {
    return false
  }
  
  // Check category filter
  if (channelPref.categories.length > 0 && !channelPref.categories.includes(category)) {
    return false
  }
  
  return true
}

function isWithinTimeRange(current: string, start: string, end: string): boolean {
  // Implementation for time range checking
  return false
}

function getDefaultNotificationSettings(userId: string): NotificationSettings {
  return {
    userId,
    channelPreferences: {
      in_app: {
        enabled: true,
        frequency: 'real-time',
        priorityThreshold: 'low',
        categories: []
      },
      push: {
        enabled: true,
        frequency: 'real-time',
        priorityThreshold: 'normal',
        categories: []
      },
      email: {
        enabled: true,
        frequency: 'daily',
        priorityThreshold: 'normal',
        categories: []
      },
      sms: {
        enabled: false,
        frequency: 'real-time',
        priorityThreshold: 'urgent',
        categories: []
      },
      digest: {
        enabled: true,
        frequency: 'daily',
        priorityThreshold: 'low',
        categories: []
      }
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      allowCritical: true
    },
    previewSettings: {
      showPreviews: true,
      showOnLockScreen: true
    }
  }
}
```

## Data Models

### Privacy Settings JSON Structure

```json
{
  "profile": "public",
  "email": "private",
  "location": "followers-only",
  "pets": "public",
  "posts": "public",
  "followers": "public",
  "following": "public",
  "searchable": true,
  "allowFollowRequests": "public",
  "allowTagging": "public",
  "allowMentions": "public",
  "secureMessages": true,
  "sections": {
    "basics": "public",
    "statistics": "public",
    "friends": "public",
    "pets": "public",
    "activity": "public"
  }
}
```

### Notification Settings JSON Structure

```json
{
  "userId": "user-id",
  "channelPreferences": {
    "in_app": {
      "enabled": true,
      "frequency": "real-time",
      "priorityThreshold": "low",
      "categories": []
    },
    "push": {
      "enabled": true,
      "frequency": "real-time",
      "priorityThreshold": "normal",
      "categories": ["interactions", "social"]
    },
    "email": {
      "enabled": true,
      "frequency": "daily",
      "priorityThreshold": "normal",
      "categories": []
    },
    "sms": {
      "enabled": false,
      "frequency": "real-time",
      "priorityThreshold": "urgent",
      "categories": ["system"]
    },
    "digest": {
      "enabled": true,
      "frequency": "daily",
      "priorityThreshold": "low",
      "categories": []
    }
  },
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "07:00",
    "days": [0, 1, 2, 3, 4, 5, 6],
    "allowCritical": true
  },
  "previewSettings": {
    "showPreviews": true,
    "showOnLockScreen": false
  }
}
```

## Error Handling

### Validation Errors

- Email format validation using regex
- Password strength validation (minimum 8 characters, complexity requirements)
- Session token validation
- Privacy level validation

### Authentication Errors

- Invalid password errors
- Expired session errors
- Unauthorized access errors
- Token expiration errors

### Database Errors

- Unique constraint violations (email already exists)
- Foreign key violations
- Transaction failures
- Connection errors

### Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: Record<string, string>
}

interface SuccessResponse<T = void> {
  success: true
  data?: T
}
```

## Testing Strategy

### Unit Tests

1. **Privacy Service Tests**
   - Test privacy level checks
   - Test blocking/unblocking users
   - Test muting/unmuting users
   - Test default settings generation

2. **Notification Service Tests**
   - Test notification filtering by channel
   - Test quiet hours logic
   - Test priority threshold filtering
   - Test category filtering

3. **Validation Tests**
   - Test email format validation
   - Test password strength validation
   - Test privacy level validation

### Integration Tests

1. **Email Change Flow**
   - Test complete email change process
   - Test verification token generation
   - Test email sending
   - Test cancellation flow

2. **Password Change Flow**
   - Test password update
   - Test session invalidation
   - Test notification sending

3. **Session Management**
   - Test session listing
   - Test session logout
   - Test bulk logout
   - Test device renaming

4. **Account Deletion**
   - Test deletion scheduling
   - Test grace period
   - Test restore functionality

### E2E Tests

1. **Settings Page Navigation**
   - Test sidebar navigation
   - Test section visibility
   - Test form interactions

2. **Privacy Settings**
   - Test privacy level changes
   - Test blocking users
   - Test search visibility toggles

3. **Notification Settings**
   - Test channel toggles
   - Test quiet hours configuration
   - Test preview settings

4. **Account Security**
   - Test email change flow
   - Test password change flow
   - Test session management
   - Test account deletion flow

## Security Considerations

1. **Password Security**
   - Use bcrypt with cost factor 12
   - Enforce password complexity requirements
   - Invalidate sessions on password change

2. **Session Security**
   - Use secure, httpOnly cookies
   - Implement session expiration
   - Track session activity
   - Support session revocation

3. **Email Verification**
   - Use cryptographically secure tokens
   - Implement token expiration (24 hours)
   - Send notifications to old email
   - Support cancellation

4. **Account Deletion**
   - Require password confirmation
   - Implement multi-step confirmation
   - Provide 30-day grace period
   - Send restore link

5. **Privacy Enforcement**
   - Check privacy levels on all data access
   - Respect blocking relationships
   - Filter muted content from feeds
   - Enforce search visibility settings

6. **Rate Limiting**
   - Limit email change requests
   - Limit password change attempts
   - Limit session creation
   - Limit API calls

## Performance Considerations

1. **Database Optimization**
   - Index frequently queried fields (userId, token, email)
   - Use JSON fields for flexible settings storage
   - Implement connection pooling
   - Use transactions for multi-step operations

2. **Caching Strategy**
   - Cache privacy settings in memory
   - Cache notification preferences
   - Cache session data
   - Invalidate cache on updates

3. **Query Optimization**
   - Use select to fetch only needed fields
   - Batch related queries
   - Use database-level filtering
   - Implement pagination for lists

4. **Client-Side Optimization**
   - Debounce form inputs
   - Implement optimistic updates
   - Use React.memo for expensive components
   - Lazy load heavy components

## Migration Strategy

1. **Database Migration**
   - Create new tables (EmailVerification, Session, BlockedUser, MutedUser)
   - Add new columns to User table
   - Migrate existing privacy data to new format
   - Create indexes

2. **Data Migration**
   - Migrate existing blocked users to new table
   - Generate default privacy settings for existing users
   - Generate default notification settings
   - Create sessions for active users

3. **Rollout Plan**
   - Deploy database changes first
   - Deploy backend services
   - Deploy frontend components
   - Monitor for errors
   - Gradual rollout to users

## Monitoring and Observability

1. **Metrics to Track**
   - Email change request rate
   - Password change success rate
   - Session creation rate
   - Account deletion rate
   - Privacy setting changes
   - Notification delivery rate

2. **Logging**
   - Log all authentication events
   - Log privacy setting changes
   - Log session management actions
   - Log account deletion requests
   - Log email verification attempts

3. **Alerts**
   - Alert on high email change failure rate
   - Alert on high password change failure rate
   - Alert on unusual session activity
   - Alert on high account deletion rate
   - Alert on email delivery failures
