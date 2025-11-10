// Account Settings Types
// Types for managing user account settings, privacy, notifications, and security

export type PrivacyLevel = "public" | "private" | "followers-only" | "friends-only" | "no-one"

export interface PrivacySettings {
  // Profile visibility
  profile: PrivacyLevel
  email: PrivacyLevel
  phone?: PrivacyLevel
  birthday?: "public_show_year" | "public_hide_year" | "followers-only" | "private"
  age?: PrivacyLevel
  location: PrivacyLevel
  onlineStatus?: boolean
  
  // Content visibility
  pets: PrivacyLevel
  posts: PrivacyLevel
  followers: PrivacyLevel
  following: PrivacyLevel
  
  // Interaction permissions
  allowTagging: PrivacyLevel
  tagReviewRequired?: boolean
  tagNotifications?: boolean
  allowMentions: PrivacyLevel
  
  // Search and discoverability
  searchable: boolean
  searchIndexingEnabled?: boolean
  showInSearch?: boolean
  showInRecommendations?: boolean
  
  // Profile sections
  sections?: {
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

export type NotificationFrequency = "real-time" | "hourly" | "daily" | "weekly"
export type NotificationPriorityThreshold = "low" | "normal" | "high" | "urgent"
export type NotificationChannel = "in_app" | "push" | "email" | "sms" | "digest"

export interface NotificationChannelPreference {
  enabled: boolean
  frequency: NotificationFrequency
  priorityThreshold: NotificationPriorityThreshold
  categories: string[]
}

export interface QuietHoursSettings {
  enabled: boolean
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  days: number[] // 0-6, Sunday-Saturday
  allowCritical: boolean
}

export interface NotificationPreviewSettings {
  showPreviews: boolean
  showOnLockScreen: boolean
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
  quietHours: QuietHoursSettings
  previewSettings: NotificationPreviewSettings
}

export type DeviceType = "mobile" | "tablet" | "desktop"

export interface SessionInfo {
  id: string
  token: string
  customName?: string
  deviceName?: string
  deviceType?: DeviceType
  os?: string
  browser?: string
  ip?: string
  city?: string
  country?: string
  createdAt: string
  lastActivityAt: string
  expiresAt: string
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

export type AccountDeletionReason =
  | "privacy_concerns"
  | "not_useful"
  | "too_many_notifications"
  | "found_alternative"
  | "temporary_break"
  | "other"

export interface AccountDeletionRequest {
  userId: string
  password: string
  reason: AccountDeletionReason
  otherReason?: string
}
