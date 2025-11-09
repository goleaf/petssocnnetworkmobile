export type UserRole = "user" | "admin" | "moderator"

export type UserStatus = "active" | "muted" | "suspended" | "banned"

export interface EmailVerificationState {
  status: "pending" | "verified" | "expired"
  token?: string
  requestedAt?: string
  expiresAt?: string
  verifiedAt?: string
  // For email change flows, store the new email awaiting verification
  pendingEmail?: string
}

export interface CorporateEmailMetadata {
  domain: string
  isCorporate: boolean
  verified: boolean
  organization?: string
  requiresManualReview?: boolean
  reason?: string
}

export interface User {
  id: string
  email: string
  username: string
  handle?: string // User handle/display name
  password?: string
  fullName: string
  dateOfBirth?: string
  acceptedPoliciesAt?: string
  role?: UserRole
  roles?: UserRole[] // Array of roles for multiple role support
  reputation?: number // User reputation score
  strikes?: number // Number of strikes/warnings
  status?: UserStatus // User account status
  muteExpiry?: string // ISO date string for mute expiration
  suspendExpiry?: string // ISO date string for suspension expiration
  lastSeen?: string // ISO date string for last seen timestamp
  createdAt?: string // ISO date string for account creation (alias for joinedAt)
  passwordChangedAt?: string // ISO date string when password was last changed
  sessionInvalidatedAt?: string // ISO date string when all sessions were invalidated
  avatar?: string
  bio?: string
  location?: string
  joinedAt: string
  followers: string[]
  following: string[]
  followingPets?: string[]
  coverPhoto?: string
  lastUsernameChangeAt?: string
  usernameHistory?: Array<{
    previousUsername: string
    newUsername: string
    changedAt: string
  }>
  privacy?: {
    profile: "public" | "private" | "followers-only"
    email: "public" | "private" | "followers-only" | "never"
    phone?: "public" | "private" | "followers-only" | "never"
    avatarVisibility?: "public" | "private" | "followers-only"
    coverPhotoVisibility?: "public" | "private" | "followers-only"
    birthdayVisibility?: "public_show_year" | "public_hide_year" | "followers-only" | "private"
    ageVisibility?: "public" | "followers-only" | "private"
    location: "public" | "private" | "followers-only"
    locationGranularity?: "exact" | "region" | "country" | "hidden"
    pets: "public" | "private" | "followers-only"
    posts: "public" | "private" | "followers-only"
    followers: "public" | "private" | "followers-only"
    following: "public" | "private" | "followers-only"
    searchable: boolean
    allowFollowRequests: "public" | "followers-only"
    allowTagging: "public" | "followers-only" | "private" | "none"
    secureMessages?: boolean
    joinDateVisibility?: "public" | "followers-only" | "private"
    lastActiveVisibility?: "public" | "followers-only" | "private" | "hidden"
    messagePermissions?: "public" | "friends" | "friends-of-friends" | "following" | "none"
    likesVisibility?: "public" | "followers-only" | "private"
    sections?: ProfileSectionPrivacy
  }
  blockedUsers?: string[] // User IDs that are blocked
  restrictedUsers?: string[] // User IDs that are shadow-restricted by this user
  mutedUsers?: string[] // User IDs that are muted (soft block)
  closeFriends?: string[] // User IDs in close friends list
  occupation?: string
  website?: string
  phone?: string
  interests?: string[]
  favoriteAnimals?: string[]
  badge?: "verified" | "pro" | "shelter" | "vet" | null
  isPro?: boolean
  proExpiresAt?: string
  shelterSponsorship?: ShelterSponsorship
  moderationCaseId?: string // Link to moderation case for appeal tracker
  emailVerified?: boolean
  emailVerification?: EmailVerificationState
  corporateEmail?: CorporateEmailMetadata
  phoneVerified?: boolean
  requirePhoneVerification?: boolean
  requireEmailVerification?: boolean
  verificationResubmitAt?: string
}

export interface Pet {
  id: string
  ownerId: string
  name: string
  slug?: string // URL-friendly slug for routing
  species: "dog" | "cat" | "bird" | "rabbit" | "hamster" | "fish" | "other"
  speciesId?: string // Reference to Species (structured data)
  breed?: string // Legacy: kept for backward compatibility
  breedId?: string // Reference to Breed (structured data relationship: Pet → Breed → Species)
  age?: number
  gender?: "male" | "female"
  avatar?: string
  bio?: string
  birthday?: string
  weight?: string
  color?: string
  followers: string[]
  microchipId?: string
  photos?: string[]
  healthRecords?: HealthRecord[]
  vaccinations?: Vaccination[]
  medications?: Medication[]
  allergies?: string[]
  dietInfo?: DietInfo
  personality?: PersonalityTraits
  achievements?: Achievement[]
  friends?: string[] // Pet IDs
  friendCategories?: FriendCategory[]
  friendCategoryAssignments?: Record<string, string | null>
  favoriteThings?: FavoriteThings
  trainingProgress?: TrainingProgress[]
  vetInfo?: VetInfo
  insurance?: InsuranceInfo
  adoptionDate?: string
  spayedNeutered?: boolean
  specialNeeds?: string
  privacy?: PrivacyLevel | PetPrivacySettings
  socialCircle?: PetSocialCircle
  // Structured data support
  tags?: string[] // Topic tags (e.g., ["species:dog", "topic:training"])
  categories?: string[] // Classification categories
  properties?: Record<string, string | number | boolean> // Key-value properties
}

export type PetRelationshipType =
  | "best-friend"
  | "playmate"
  | "mentor"
  | "sibling"
  | "neighbor"
  | "adventure-buddy"
  | "training-partner"
  | "roommate"

export type PetRelationshipStatus = "active" | "pending" | "requested" | "paused" | "retired"

export interface PetRelationship {
  id: string
  petId: string
  type: PetRelationshipType
  status: PetRelationshipStatus
  since?: string
  compatibilityScore?: number
  favoriteActivities?: string[]
  story?: string
  nextPlaydateId?: string
  metDuring?: string
  sharedAchievements?: string[]
}

export type PlaydateFocus = "social" | "training" | "wellness" | "games" | "relaxation"

export interface PetVirtualPlaydate {
  id: string
  title: string
  hostPetId: string
  guestPetIds: string[]
  scheduledAt: string
  durationMinutes: number
  platform: string
  focus?: PlaydateFocus
  activities?: string[]
  status: "upcoming" | "completed" | "cancelled"
  createdBy: string
  highlights?: string[]
  relationshipBoosts?: string[]
  recordingUrl?: string
  notes?: string
}

export interface PetPlaydateInvite {
  id: string
  playdateId: string
  senderPetId: string
  recipientPetId: string
  status: "pending" | "accepted" | "declined" | "expired"
  sentAt: string
  message?: string
}

export interface SocialCircleHighlight {
  id: string
  date: string
  title: string
  description: string
  icon?: string
  relatedPetId?: string
  relationshipType?: PetRelationshipType
}

export interface PetSocialCircleOverview {
  totalFriends?: number
  bestFriends?: number
  playdateHours?: number
  matchesThisMonth?: number
}

export interface PetSocialCircle {
  overview?: PetSocialCircleOverview
  relationships: PetRelationship[]
  playdates: PetVirtualPlaydate[]
  invites?: PetPlaydateInvite[]
  highlights?: SocialCircleHighlight[]
}

export type FriendRequestStatus = "pending" | "accepted" | "declined" | "cancelled"

export interface FriendRequest {
  id: string
  senderPetId: string
  receiverPetId: string
  status: FriendRequestStatus
  createdAt: string
  updatedAt?: string
}

export interface BlogPostMediaLink {
  url: string
  title?: string
}

export interface BlogPostMedia {
  images: string[]
  videos: string[]
  links: BlogPostMediaLink[]
}

// Poll types for blog posts
export interface BlogPostPollOption {
  id: string
  text: string
  voteCount: number
}

export interface BlogPostPoll {
  question: string
  options: BlogPostPollOption[]
  allowMultiple: boolean
  totalVotes: number
  expiresAt?: string
  isClosed?: boolean
}

export interface BlogPostPollVote {
  userId: string
  optionIds: string[]
  votedAt: string
}

// Location types for blog posts
export interface BlogPostLocation {
  name?: string
  address: string
  latitude: number
  longitude: number
  placeId?: string // Reference to Place if it exists
  leashRequired?: boolean
  permitRequired?: boolean
  additionalInfo?: string
}

// Post template types
export type BlogPostTemplate = "lost-found" | "adoption-story" | "health-update" | "training-tip" | "adventure-story" | "general"

export type BlogPostQueueStatus = "draft" | "review" | "scheduled" | "published" | "flagged"

// Content lifecycle status for wiki articles and blog posts
export type ContentLifecycleStatus = "draft" | "review" | "published" | "flagged"

// Sensitive topic categories that require flagged revisions
export type SensitiveTopicCategory = "health" | "regulatory"

// User preference for viewing sensitive content
export type ContentViewPreference = "stable" | "latest"

// User preferences for content viewing
export interface UserContentPreferences {
  userId: string
  sensitiveContentViewPreference?: ContentViewPreference // Preference for viewing sensitive content (stable vs latest)
  defaultToStableForHealth?: boolean // Default to stable view for health topics
  defaultToStableForRegulatory?: boolean // Default to stable view for regulatory topics
  updatedAt: string
}

// Flagged revision status
export type FlaggedRevisionStatus = "pending" | "reviewing" | "approved" | "rejected" | "resolved"

// Flagged revision for sensitive topics
export interface FlaggedRevision {
  id: string
  revisionId: string // ID of the WikiRevision or BlogPost revision
  articleId: string // ID of the WikiArticle or BlogPost
  articleType: "wiki" | "blog"
  category: SensitiveTopicCategory // "health" | "regulatory"
  status: FlaggedRevisionStatus
  priority: "low" | "medium" | "high" | "urgent"
  flaggedBy?: string // User ID who flagged this revision
  flaggedAt: string // ISO timestamp
  flagReason: string // Reason for flagging
  assignedTo?: string // User ID assigned to review
  reviewedBy?: string // User ID who reviewed
  reviewedAt?: string // ISO timestamp of review
  reviewNotes?: string // Notes from reviewer
  resolvedAt?: string // ISO timestamp when resolved
  resolution?: "approved" | "rejected" | "modified"
}

// Audit log for flagged revisions
export interface FlaggedRevisionAuditLog {
  id: string
  flaggedRevisionId: string
  action: "created" | "assigned" | "reviewed" | "approved" | "rejected" | "resolved" | "updated"
  performedBy: string // User ID
  performedAt: string // ISO timestamp
  notes?: string
  changes?: Record<string, unknown> // Field changes
}

// Blog Series & Reading Lists
export interface BlogSeries {
  id: string
  title: string
  description?: string
  authorId: string
  slug: string
  posts: string[] // BlogPost IDs in order
  coverImage?: string
  createdAt: string
  updatedAt: string
  published: boolean
}

export interface ReadingList {
  id: string
  userId: string
  name: string
  description?: string
  postIds: string[] // BlogPost IDs
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// Author Page Information
export interface AuthorInfo {
  byline?: string // Short author bio/description
  vetBadge?: boolean // Whether author is a verified veterinarian
  contactLinks?: {
    email?: string
    website?: string
    social?: {
      twitter?: string
      instagram?: string
      facebook?: string
      linkedin?: string
    }
  }
  credentials?: string[] // Professional credentials (e.g., ["DVM", "PhD"])
  specialization?: string[] // Areas of expertise
}

// MDX Callout Types
export type CalloutType = "vet-tip" | "safety-warning" | "checklist" | "info" | "note"

export interface MDXCallout {
  type: CalloutType
  title?: string
  content: string
  items?: string[] // For checklist type
}

// Blog Section Promotion
export interface BlogSectionPromotion {
  id: string
  postId: string
  blockId: string // Content block identifier within the post
  sectionContent: string
  citations?: string[]
  wikiSlug?: string // Generated wiki article slug
  status: "pending" | "approved" | "rejected" | "published"
  promotedBy: string // User ID
  promotedAt: string
  wikiArticleId?: string // Created wiki article ID
}

export interface BlogPost {
  id: string
  petId: string
  authorId: string
  title: string
  content: string
  slug?: string // URL-friendly slug (generated from title)
  seriesId?: string // ID of BlogSeries this post belongs to
  seriesOrder?: number // Order within the series
  coverImage?: string
  tags: string[]
  categories: string[]
  likes: string[] // Kept for backward compatibility
  reactions?: Record<ReactionType, string[]> // User IDs who reacted with each type
  createdAt: string
  updatedAt: string
  privacy?: "public" | "private" | "followers-only"
  privacyCircle?: PrivacyCircle
  isDraft?: boolean // Deprecated: use queueStatus instead
  queueStatus?: BlogPostQueueStatus // Draft → Review → Scheduled → Published → Flagged workflow
  scheduledAt?: string // ISO timestamp when post should be published
  reviewedBy?: string // User ID who reviewed/approved
  reviewedAt?: string // ISO timestamp of review
  reviewNotes?: string // Admin notes during review
  // Content lifecycle fields for sensitive topics
  isSensitiveTopic?: boolean // Whether this post covers sensitive topics (health, regulatory)
  sensitiveCategories?: SensitiveTopicCategory[] // Categories of sensitive topics
  flaggedRevisionId?: string // Reference to FlaggedRevision if flagged
  featuredOnHomepage?: boolean // Whether post is featured on homepage
  relatedWikiIds?: string[] // Array of WikiArticle IDs to attach
  hashtags?: string[]
  isPromoted?: boolean
  promotedUntil?: string
  promotionStatus?: "pending" | "approved" | "rejected"
  promotionBudget?: number
  media?: BlogPostMedia
  poll?: PostPoll
  placeId?: string
  reports?: ArticleReport[] // User reports on this article
  coiFlags?: COIFlag[] // Conflict of Interest flags
  // New fields for series, author, and MDX
  seriesId?: string // ID of BlogSeries this post belongs to
  seriesOrder?: number // Order within the series (1-based)
  authorInfo?: AuthorInfo // Author page information
  mdxCallouts?: MDXCallout[] // MDX callouts in the content
  sectionPromotions?: BlogSectionPromotion[] // Sections promoted to wiki
}

export type ReactionType = "like" | "love" | "laugh" | "wow" | "sad" | "angry"

export type PostAnalyticsPeriod = 7 | 30 | 90 | "lifetime"

export interface PostEngagementBreakdown {
  reactions: number
  comments: number
  shares: number
  saves: number
  linkClicks: number
}

export interface PostReactionBreakdown {
  type: ReactionType
  value: number
}

export interface PostDailyMetric {
  date: string
  views: number
  impressions: number
  engagements: number
  reach: number
}

export interface PostAudienceSegment {
  label: string
  value: number
}

export interface PostTrafficSource {
  source: string
  value: number
}

export interface PostPerformanceTrend {
  viewsChange: number
  engagementsChange: number
  reachChange: number
}

export interface PostAnalytics {
  postId: string
  period: PostAnalyticsPeriod
  totalViews: number
  totalImpressions: number
  reach: number
  uniqueViewers: number
  totalEngagements: number
  engagementRate: number
  clickThroughRate: number
  averageViewDuration: number
  breakdown: PostEngagementBreakdown
  reactionsByType: PostReactionBreakdown[]
  dailyPerformance: PostDailyMetric[]
  audienceSegments: PostAudienceSegment[]
  trafficSources: PostTrafficSource[]
  trend: PostPerformanceTrend
}

export type CommentStatus = "published" | "pending" | "hidden"

export type CommentFlagReason = "spam" | "abuse" | "off-topic" | "other"

export interface CommentFlag {
  userId: string
  reason: CommentFlagReason
  message?: string
  flaggedAt: string
}

export interface CommentModeration {
  status: CommentStatus
  updatedAt: string
  updatedBy: string
  note?: string
}

export interface Comment {
  id: string
  postId?: string // For blog posts
  wikiArticleId?: string // For wiki articles
  petPhotoId?: string // For pet photos (format: petId:photoIndex)
  userId: string
  content: string
  createdAt: string
  updatedAt?: string
  parentCommentId?: string // For replies
  reactions?: Record<ReactionType, string[]> // User IDs who reacted with each type
  format?: "markdown" | "plaintext"
  status?: CommentStatus
  flags?: CommentFlag[]
  moderation?: CommentModeration
  editedBy?: string
}

export interface WikiArticle {
  id: string
  title: string
  slug: string
  category: "care" | "health" | "training" | "nutrition" | "behavior" | "breeds"
  subcategory?: string
  species?: string[]
  content: string
  coverImage?: string
  authorId: string
  views: number
  likes: string[]
  createdAt: string
  updatedAt: string
  reports?: ArticleReport[] // User reports on this article
  coiFlags?: COIFlag[] // Conflict of Interest flags
  breedData?: any // Breed infobox data with computed tags (only for breeds category)
  // Content lifecycle fields
  lifecycleStatus?: ContentLifecycleStatus // Draft → Review → Publish → Flagged workflow
  isSensitiveTopic?: boolean // Whether this article covers sensitive topics (health, regulatory)
  sensitiveCategories?: SensitiveTopicCategory[] // Categories of sensitive topics
  reviewedBy?: string // User ID who reviewed/approved
  reviewedAt?: string // ISO timestamp of review
  reviewNotes?: string // Admin notes during review
  flaggedRevisionId?: string // Reference to FlaggedRevision if flagged
  stableRevisionId?: string // ID of the stable revision (for sensitive topics)
  latestRevisionId?: string // ID of the latest revision (may be flagged)
}

export type HealthConditionSeverity = "mild" | "moderate" | "severe" | "critical"
export type HealthConditionUrgency = "routine" | "urgent" | "emergency"

export interface HealthCondition {
  id: string
  title: string
  slug: string
  affectedSpecies: string[] // e.g., ["dog", "cat"]
  affectedBreeds?: string[] // Specific breeds affected
  symptoms: string[] // List of symptoms
  severity: HealthConditionSeverity
  urgencyFlag: boolean // "seek vet now?" flag
  typicalOnsetAge?: {
    min?: number // Minimum age in months
    max?: number // Maximum age in months
    unit: "weeks" | "months" | "years"
  }
  causes: string[] // List of causes
  risks: string[] // Risk factors
  diagnosis: string // Diagnosis information
  treatmentOptions: string[] // Treatment options
  recovery: string // Recovery information
  prognosis: string // Prognosis information
  prevention: string[] // Prevention measures
  references: Array<{
    id: string
    title: string
    url: string
    publisher?: string
    date?: string
  }>
  reviewer?: {
    vetId: string
    vetName: string
    licenseNumber?: string
    credentials?: string[]
  }
  reviewDate?: string // ISO date string
  createdAt: string
  updatedAt: string
  coverImage?: string
  tags?: string[]
}

export interface Activity {
  id: string
  userId: string
  type: "follow" | "like" | "comment" | "post"
  targetId: string
  targetType: "user" | "pet" | "post" | "wiki"
  createdAt: string
}

export interface HealthRecord {
  id: string
  date: string
  type: "checkup" | "illness" | "injury" | "surgery" | "other"
  title: string
  description: string
  veterinarian?: string
  attachments?: string[]
}

export interface Vaccination {
  id: string
  name: string
  date: string
  nextDue?: string
  veterinarian?: string
  batchNumber?: string
}

export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  prescribedBy?: string
  notes?: string
}

export interface DietInfo {
  foodBrand?: string
  foodType?: string
  portionSize?: string
  feedingSchedule?: string[]
  treats?: string[]
  restrictions?: string[]
}

export interface PersonalityTraits {
  energyLevel?: 1 | 2 | 3 | 4 | 5
  friendliness?: 1 | 2 | 3 | 4 | 5
  trainability?: 1 | 2 | 3 | 4 | 5
  playfulness?: 1 | 2 | 3 | 4 | 5
  independence?: 1 | 2 | 3 | 4 | 5
  traits?: string[]
}

export type AchievementCategory =
  | "milestone"
  | "training"
  | "competition"
  | "service"
  | "health"
  | "community"
  | "adventure"
  | "social"
  | "wellness"

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedAt: string
  type?: AchievementCategory
  highlight?: boolean
}

export interface FavoriteThings {
  toys?: string[]
  activities?: string[]
  places?: string[]
  foods?: string[]
}

export interface FriendCategory {
  id: string
  name: string
  description?: string
}

export interface TrainingProgress {
  id: string
  skill: string
  level: "beginner" | "intermediate" | "advanced" | "mastered"
  startedAt: string
  completedAt?: string
  notes?: string
}

export interface VetInfo {
  clinicName?: string
  veterinarianName?: string
  phone?: string
  address?: string
  emergencyContact?: string
}

export interface InsuranceInfo {
  provider?: string
  policyNumber?: string
  coverage?: string
  expiryDate?: string
}

export type PrivacyLevel = "public" | "private" | "followers-only"

export type PrivacyCircle = "followers-only" | "group-only" | "close-friends"

export interface PetPrivacySettings {
  visibility: PrivacyLevel
  interactions: PrivacyLevel
}

export type ProfileSection = "basics" | "statistics" | "friends" | "pets" | "activity"

export interface ProfileSectionPrivacy {
  basics: PrivacyLevel
  statistics: PrivacyLevel
  friends: PrivacyLevel
  pets: PrivacyLevel
  activity: PrivacyLevel
}

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "mention"
  | "post"
  | "friend_request"
  | "friend_request_accepted"
  | "friend_request_declined"
  | "friend_request_cancelled"
  | "message"
  | "watch_update"

export type NotificationPriority = "low" | "normal" | "high" | "urgent"

export type NotificationCategory = "social" | "community" | "system" | "promotions" | "reminders"

export type NotificationChannel = "in_app" | "email" | "push" | "digest"

export interface NotificationAction {
  id: string
  label: string
  action: "view" | "accept" | "decline" | "dismiss" | "custom"
  targetUrl?: string
  metadata?: Record<string, unknown>
  requiresConfirmation?: boolean
}

export interface NotificationDeliveryStatus {
  channel: NotificationChannel
  status: "pending" | "scheduled" | "delivered" | "failed" | "skipped"
  lastUpdatedAt: string
  scheduledFor?: string
  errorMessage?: string
}

export type NotificationHistoryEventType =
  | "created"
  | "delivered"
  | "read"
  | "deleted"
  | "action"
  | "batched"
  | "digest_scheduled"

export interface NotificationHistoryEntry {
  id: string
  notificationId: string
  userId: string
  type: NotificationHistoryEventType
  timestamp: string
  channel?: NotificationChannel
  detail?: Record<string, unknown>
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  actorId: string
  targetId: string
  targetType: "user" | "pet" | "post" | "wiki"
  message: string
  read: boolean
  createdAt: string
  updatedAt?: string
  priority?: NotificationPriority
  category?: NotificationCategory
  channels?: NotificationChannel[]
  deliveries?: NotificationDeliveryStatus[]
  batchKey?: string
  batchCount?: number
  digestScheduledFor?: string
  actions?: NotificationAction[]
  metadata?: Record<string, unknown>
}

export type NotificationFrequency = "real-time" | "hourly" | "daily" | "weekly"

export interface NotificationChannelPreferences {
  enabled: boolean
  frequency: NotificationFrequency
  categories: NotificationCategory[]
  priorityThreshold: NotificationPriority
}

export interface NotificationTypePreference {
  enabled: boolean
  channels: NotificationChannel[]
  priority?: NotificationPriority
  muteUntil?: string
}

export interface NotificationDigestPreferences {
  enabled: boolean
  interval: "daily" | "weekly"
  timeOfDay: string
  categories: NotificationCategory[]
  includeUnreadOnly: boolean
}

export interface NotificationQuietHours {
  enabled: boolean
  start: string
  end: string
  timezone: string
}

export interface NotificationSettings {
  userId: string
  channelPreferences: Partial<Record<NotificationChannel, NotificationChannelPreferences>>
  typePreferences: Partial<Record<NotificationType, NotificationTypePreference>>
  digestSchedule: NotificationDigestPreferences
  quietHours?: NotificationQuietHours
  mutedCategories?: NotificationCategory[]
  updatedAt: string
}

export interface Draft {
  id: string
  userId: string
  type: "blog" | "wiki"
  title: string
  content: string
  metadata?: any
  lastSaved: string
  createdAt: string
}

export interface ScheduledPost {
  id: string
  userId: string
  title: string
  contentType: "blog" | "feed" | "story"
  scheduledAt: string
  status: "scheduled" | "published" | "missed" | "canceled"
  targetAudience?: string
  petId?: string
  postId?: string
  notes?: string
  performanceScore?: number
  recommendationReason?: string
  createdAt: string
  updatedAt: string
}

export interface Shelter {
  id: string
  name: string
  description: string
  location: string
  website?: string
  phone?: string
  email?: string
  logo?: string
  coverImage?: string
  animalsCount?: number
  species?: string[]
  verified: boolean
  sponsorshipTiers: SponsorshipTier[]
  sponsors: string[] // User IDs
  createdAt: string
}

export interface SponsorshipTier {
  id: string
  name: string
  amount: number
  benefits: string[]
  badge?: string
}

export interface ShelterSponsorship {
  shelterId: string
  tierId: string
  startDate: string
  endDate?: string
  amount: number
  recurring: boolean
}

export interface PromotedPost {
  postId: string
  userId: string
  budget: number
  duration: number // days
  targetAudience?: {
    species?: string[]
    location?: string[]
    interests?: string[]
  }
  impressions: number
  clicks: number
  status: "pending" | "approved" | "rejected" | "active" | "completed"
  startDate?: string
  endDate?: string
  createdAt: string
  reviewedBy?: string
  reviewNotes?: string
}

export type GroupType = "open" | "closed" | "secret"

export type GroupContentVisibility = "everyone" | "members"

export interface GroupVisibilitySettings {
  discoverable: boolean
  content: GroupContentVisibility
}

export interface GroupCategory {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  subcategories?: Array<{
    id: string
    name: string
  }>
}

export interface Group {
  id: string
  name: string
  slug: string
  description: string
  type: GroupType
  categoryId: string
  subcategoryId?: string
  ownerId: string
  coverImage?: string
  avatar?: string
  memberCount: number
  topicCount: number
  postCount: number
  tags?: string[]
  rules?: string[]
  createdAt: string
  updatedAt: string
  isFeatured?: boolean
  welcomeMessage?: string
  visibility?: GroupVisibilitySettings
}

export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupMemberRole
  joinedAt: string
  status?: "active" | "pending" | "banned"
  permissions?: {
    canPost?: boolean
    canComment?: boolean
    canCreateTopic?: boolean
    canCreatePoll?: boolean
    canCreateEvent?: boolean
    canModerate?: boolean
    canManageMembers?: boolean
    canManageSettings?: boolean
  }
}

export type GroupTopicStatus = "active" | "locked" | "archived"

export interface GroupTopic {
  id: string
  groupId: string
  authorId: string
  title: string
  content: string
  parentTopicId?: string
  isPinned?: boolean
  isLocked?: boolean
  status?: GroupTopicStatus
  tags?: string[]
  reactions?: Record<ReactionType, string[]>
  lastActivityAt?: string
  viewCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
}

export interface PollOption {
  id: string
  text: string
  voteCount: number
}

export interface PostPoll {
  question: string
  options: PollOption[]
  allowMultiple?: boolean
  expiresAt?: string
  isClosed?: boolean
}

export interface GroupPoll {
  id: string
  groupId: string
  authorId: string
  question: string
  description?: string
  options: PollOption[]
  allowMultiple: boolean
  voteCount: number
  isClosed?: boolean
  createdAt: string
  updatedAt: string
  expiresAt?: string
}

export interface PollVote {
  id: string
  pollId: string
  userId: string
  optionIds: string[]
  votedAt: string
}

export type EventRSVPStatus = "going" | "maybe" | "not-going"

export interface EventLocationShare {
  latitude?: number
  longitude?: number
  accuracy?: number
  label?: string
  method?: "device" | "manual"
  sharedAt: string
}

export interface EventRSVP {
  id: string
  eventId: string
  userId: string
  status: EventRSVPStatus
  respondedAt: string
  shareLocation?: boolean
  locationShare?: EventLocationShare
}

export type GroupEventType = "adoption-drive" | "meetup" | "vaccination-clinic" | "other"

export interface GroupEvent {
  id: string
  groupId: string
  authorId: string
  title: string
  description: string
  eventType?: GroupEventType
  location?: string
  startDate: string
  endDate?: string
  coverImage?: string
  attendeeCount: number
  maxAttendees?: number
  tags?: string[]
  isCancelled?: boolean
  rsvpRequired?: boolean
  meetingUrl?: string
  address?: string
  createdAt: string
  updatedAt: string
  locationSharingEnabled?: boolean
  locationSharingDescription?: string
  reminderSent?: boolean // Whether reminder has been sent
  reminderSentAt?: string // When reminder was sent
}

export interface GroupResource {
  id: string
  groupId: string
  title: string
  description?: string
  url?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  type?: "link" | "file" | "note"
  tags?: string[]
}

export interface GroupActivity {
  id: string
  groupId: string
  userId: string
  type: "topic" | "comment" | "poll" | "event" | "resource" | "member"
  targetId: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface GroupWarning {
  id: string
  groupId: string
  userId: string
  issuedBy: string
  level: 1 | 2 | 3
  reason: string
  notes?: string
  createdAt: string
}

export interface GroupBan {
  id: string
  groupId: string
  userId: string
  bannedBy: string
  reason?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface ModerationAction {
  id: string
  groupId: string
  actionType:
    | "warn"
    | "ban"
    | "unban"
    | "approve_content"
    | "reject_content"
    | "delete_content"
    | "remove_member"
    | "other"
  targetId?: string
  targetType?: "user" | "topic" | "poll" | "event" | "resource" | "member" | "other"
  performedBy: string
  reason?: string
  timestamp: string
}

export interface GroupMetrics {
  totalMembers: number
  newMembersThisWeek: number
  newMembersThisMonth: number
  activeMembers: number
  inactiveMembers: number
  totalTopics: number
  topicsThisWeek: number
  topicsThisMonth: number
  totalComments: number
  commentsThisWeek: number
  commentsThisMonth: number
  totalPolls: number
  pollsThisWeek: number
  pollsThisMonth: number
  totalEvents: number
  eventsThisWeek: number
  eventsThisMonth: number
  totalResources: number
  resourcesThisWeek: number
  resourcesThisMonth: number
  pollParticipationRate: number
  eventAttendanceRate: number
  averagePollVotes: number
  averageEventRSVPs: number
  dailyActivity: Array<{
    date: string
    topics: number
    comments: number
    polls: number
    events: number
    resources: number
    newMembers: number
  }>
  periodStart: string
  periodEnd: string
}

export type MessageReadMap = Record<string, string | null>

export type MessageAttachmentType = "image" | "video" | "document" | "link"

export interface MessageAttachment {
  id: string
  type: MessageAttachmentType
  name: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
}

export type ConversationType = "direct" | "group" | "support" | "pet"

export interface Conversation {
  id: string
  participantIds: string[]
  createdAt: string
  updatedAt: string
  lastMessageId?: string
  title?: string
  tags?: string[]
  snippet?: string
  isArchived?: boolean
  unreadCounts?: Record<string, number>
  type?: ConversationType
  petContext?: {
    petId: string
    name: string
    avatar?: string
  }
  pinned?: boolean
  muted?: boolean
}

export type MessageDeliveryStatus = "sent" | "delivered" | "read"

export interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  readAt: MessageReadMap
  attachments?: MessageAttachment[]
  status?: MessageDeliveryStatus
  isSystem?: boolean
}

export interface ConversationTypingIndicator {
  conversationId: string
  userId: string
  lastActiveAt: string
}

export interface MessageSearchResult {
  conversationId: string
  messageId: string
  senderId: string
  content: string
  createdAt: string
}

export interface Source {
  id: string
  title: string
  url: string
  publisher?: string
  date?: string
  license?: string
  brokenAt?: string // Timestamp when link was detected as broken
  isValid?: boolean // Whether the URL is valid (checked via API)
  lastChecked?: string // Timestamp when URL was last validated
}

export interface Citation {
  id: string // Unique citation ID (e.g., "1", "2", "citation-needed")
  sourceId?: string // Reference to a Source, if applicable
  url?: string // Direct URL if no source is referenced
  text?: string // Citation text/note
  locator?: string // Location reference (e.g., "p. 42", "section 3.2", "timestamp 1:23")
  isCitationNeeded?: boolean // Flag for "citation needed" tags
}

export interface LinkValidationResult {
  url: string
  isValid: boolean
  statusCode?: number
  error?: string
  checkedAt: string
}

export type OrganizationType = "clinic" | "shelter" | "rescue" | "non-profit" | "other"

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  verifiedAt?: string
  website?: string
  locGeo?: {
    latitude: number
    longitude: number
  }
}

export interface ExpertProfile {
  id: string
  userId: string
  credential: string
  licenseNo?: string
  region?: string
  status: "pending" | "verified" | "expired" | "revoked"
  verifiedAt?: string
  expiresAt?: string
  revokedAt?: string
  documents?: Array<{
    name: string
    url: string
    type: string
    uploadedAt: string
  }>
  reviewNotes?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
}

export interface ExpertVerificationRequest {
  id: string
  userId: string
  status: "pending" | "approved" | "rejected"
  credential: string
  credentialFileUrls: string[]
  licenseNo?: string
  region?: string
  reviewedBy?: string
  reviewedAt?: string
  reason?: string
  createdAt: string
  updatedAt: string
}

export type PlaceModerationStatus = "pending" | "approved" | "rejected"
export type PlaceType = "dog_park" | "trail" | "beach" | "pet_friendly_venue"
export type LeashRule = "required" | "optional" | "prohibited" | "off_leash_allowed"

export interface PlaceHours {
  monday?: { open: string; close: string; closed?: boolean }
  tuesday?: { open: string; close: string; closed?: boolean }
  wednesday?: { open: string; close: string; closed?: boolean }
  thursday?: { open: string; close: string; closed?: boolean }
  friday?: { open: string; close: string; closed?: boolean }
  saturday?: { open: string; close: string; closed?: boolean }
  sunday?: { open: string; close: string; closed?: boolean }
  notes?: string // Additional hours information
}

export interface PlaceUserReport {
  id: string
  userId: string
  reportType: "crowding" | "cleanliness"
  rating: number // 1-5 scale
  comment?: string
  reportedAt: string
}

export interface Place {
  id: string
  name: string
  type: PlaceType
  address: string
  lat: number
  lng: number
  hours?: PlaceHours
  leashRule?: LeashRule
  amenities: string[]
  rules: string[]
  hazards?: string[] // Safety concerns and potential dangers
  fenced?: boolean // Whether the area is fenced
  smallDogArea?: boolean // Separate area for small dogs
  waterStation?: boolean // Water available on-site
  parkingInfo?: string // Parking availability and details
  permitRequired?: boolean // Whether a permit is required
  photos?: string[] // Photo URLs for the place
  userReports?: PlaceUserReport[] // User-reported crowding and cleanliness
  moderationStatus: PlaceModerationStatus
  createdAt: string
  updatedAt: string
}

export interface PlacePhoto {
  id: string
  placeId: string
  url: string
  caption?: string
  uploadedById: string
  createdAt: string
}

// Offline Cache Types
export interface CachedArticle {
  id: string
  type: "blog" | "wiki"
  data: BlogPost | WikiArticle
  cachedAt: string
  lastAccessed: string
  accessCount: number
}

export interface CachedImage {
  url: string
  blob: Blob
  cachedAt: string
  lastAccessed: string
  accessCount: number
  size: number
}

export interface SyncStatus {
  isOnline: boolean
  lastSyncAt?: string
  pendingSyncCount: number
  syncInProgress: boolean
  lastError?: string
}

export interface OfflineRead {
  articleId: string
  articleType: "blog" | "wiki"
  readAt: string
  progress?: number // 0-100
}

// Re-Review Request System for Wiki Articles
export interface ReReviewRequest {
  id: string
  articleId: string
  requestedBy: string // User ID who requested the re-review
  status: "pending" | "in_progress" | "completed" | "cancelled"
  reason?: string // Optional reason provided by requester
  assignedTo?: string // Expert user ID assigned to review
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes?: string // Notes from the reviewer
}

export interface Product {
  id: string
  name: string
  brand?: string
  category: string
  description?: string
  price?: number
  currency: string
  imageUrl?: string
  tags: string[]
  inStock: boolean
  rating?: number
  reviewCount: number
  isRecalled: boolean
  recallNotice?: string
  safetyNotices: string[]
  createdAt: string
  updatedAt: string
}

export type WikiRevisionStatus = "draft" | "stable" | "deprecated"

export interface WikiRevision {
  id: string
  articleId: string
  content: string
  status: WikiRevisionStatus
  authorId: string
  createdAt: string
  updatedAt: string
  verifiedBy?: string
  summary?: string
  reasonForChange?: string // Reason for making this revision
}

// Re-Review Request System for Wiki Articles
export interface ReReviewRequest {
  id: string
  articleId: string
  requestedBy: string // User ID who requested the re-review
  status: "pending" | "in_progress" | "completed" | "cancelled"
  reason?: string // Optional reason provided by requester
  assignedTo?: string // Expert user ID assigned to review
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes?: string // Notes from the reviewer
}

export interface Product {
  id: string
  name: string
  brand?: string
  category: string
  description?: string
  price?: number
  currency: string
  imageUrl?: string
  tags: string[]
  inStock: boolean
  rating?: number
  reviewCount: number
  isRecalled: boolean
  recallNotice?: string
  safetyNotices: string[]
  createdAt: string
  updatedAt: string
}

export type WikiRevisionStatus = "draft" | "stable" | "deprecated"

export interface WikiRevision {
  id: string
  articleId: string
  content: string
  status: WikiRevisionStatus
  authorId: string
  createdAt: string
  updatedAt: string
  verifiedBy?: string
  summary?: string
  reasonForChange?: string // Reason for making this revision
}


// Media Moderation Types
export type MediaModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged' | 'reviewed';

export type ModerationReason = 'graphic_content' | 'inappropriate' | 'violence' | 'explicit' | 'other';

export interface MediaModeration {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  status: MediaModerationStatus;
  moderationScore?: number; // 0-1 confidence score
  reason?: ModerationReason;
  autoFlagged: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  blurOnWarning: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    fileSize?: number;
  };
}

export interface ModerationQueueItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  status: MediaModerationStatus;
  moderationScore: number;
  reason?: ModerationReason;
  createdAt: Date;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    fileSize?: number;
  };
}

export interface ModerationReviewAction {
  action: 'approve' | 'reject' | 'flag';
  reason?: ModerationReason;
  notes?: string;
}

// Moderation Reports Types
export type ReportType = 'spam' | 'abuse' | 'misinfo' | 'graphic';
export type ReportStatus = 'open' | 'triaged' | 'closed';
export type ReportAge = 'last-hour' | 'last-day' | 'last-week' | 'last-month' | 'all';
export type ReporterReputation = 'high' | 'medium' | 'low' | 'all';

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  reporterReputation?: ReporterReputation;
  subjectType: 'post' | 'comment' | 'media' | 'wiki';
  subjectId: string;
  subjectContent?: string; // Preview of reported content
  reason: string;
  type: ReportType;
  status: ReportStatus;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  evidence?: EvidenceItem[];
  actorHistory?: ActorHistoryItem[];
  actions: ModerationActionItem[];
}

export interface EvidenceItem {
  id: string;
  type: 'image' | 'video' | 'text' | 'link';
  url?: string;
  content?: string;
  thumbnail?: string;
}

export interface ActorHistoryItem {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface ModerationActionItem {
  id: string;
  reportId: string;
  actorId: string;
  actorName?: string;
  type: 'warn' | 'mute' | 'shadowban' | 'suspend' | 'reject' | 'approve';
  reason?: string;
  metadata?: {
    muteDays?: number;
    escalateToSenior?: boolean;
  };
  createdAt: string;
}

export interface BulkActionRequest {
  reportIds: string[];
  action: 'warn' | 'mute' | 'shadowban' | 'suspend' | 'reject' | 'approve';
  reason: string;
  template?: string;
  escalateToSenior?: boolean;
  muteDays?: number;
}

export interface ReportFilters {
  type?: ReportType | 'all';
  status?: ReportStatus | 'all';
  age?: ReportAge;
  reporterReputation?: ReporterReputation;
}

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent"

export type AnnouncementDismissalPolicy = "session" | "permanent" | "temporary" | "never"

export type AnnouncementStatus = "draft" | "active" | "expired" | "archived"

export interface Announcement {
  id: string
  title: string
  content: string
  priority: AnnouncementPriority
  status: AnnouncementStatus
  dismissalPolicy: AnnouncementDismissalPolicy
  startDate?: string // ISO timestamp - when to start showing
  endDate?: string // ISO timestamp - when to stop showing
  createdBy: string
  createdAt: string
  updatedAt: string
  targetAudience?: "all" | "logged-in" | "logged-out"
  actionUrl?: string
  actionText?: string
  variant?: "info" | "warning" | "success" | "error"
}

export interface AnnouncementDismissal {
  announcementId: string
  userId?: string // undefined for anonymous users (session-based)
  dismissedAt: string
  expiresAt?: string // For temporary dismissals
}

// Reporting and Moderation Types

export type ArticleReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "inappropriate"
  | "copyright"
  | "impersonation"
  | "hate_speech"
  | "self_harm"
  | "animal_abuse"
  | "violence"
  | "illegal"
  | "other"

export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed"
export type ReportPriority = "low" | "medium" | "high" | "urgent"
export type ReportSeverity = "low" | "medium" | "high" | "critical"
export type ReportCategory = "content" | "behavior" | "safety" | "policy" | "other"

export interface ArticleReport {
  id: string
  reporterId: string
  reason: ArticleReportReason
  message?: string
  reportedAt: string
  status: ReportStatus
  priority?: ReportPriority
  assignedTo?: string
  notes?: string
  resolvedAt?: string
}

export interface COIFlag {
  id: string
  flaggedBy: string
  flaggedAt: string
  reason: string
  details?: string
  severity: ReportSeverity
  status: "active" | "resolved" | "dismissed"
  relatedEntities?: string[]
}

// Prisma-based Reporting System Types

export interface ReportReason {
  id: string
  code: string
  name: string
  description?: string
  category: ReportCategory
  severity: ReportSeverity
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentReport {
  id: string
  reporterId: string
  contentType: string // "blog_post", "article", "comment", "place", "product", etc.
  contentId: string
  reasonId: string
  customReason?: string
  description?: string
  status: ReportStatus
  priority: ReportPriority
  assignedTo?: string
  notes?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  reason?: ReportReason
}

export interface ModerationQueue {
  id: string
  contentType: string
  contentId: string
  priority: ReportPriority
  reportedBy: string[]
  reportCount: number
  autoFlagged: boolean
  autoReason?: string
  status: "pending" | "in_review" | "resolved"
  assignedTo?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
}

export interface SoftDeleteAudit {
  id: string
  contentType: string
  contentId: string
  deletedBy: string
  reason?: string
  metadata?: Record<string, unknown>
  deletedAt: string
  restoredAt?: string
  restoredBy?: string
}

export interface ModerationActionLog {
  id: string
  action: "approve" | "reject" | "delete" | "warn" | "ban" | "restore" | "other"
  contentType: string
  contentId: string
  performedBy: string
  reason?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// Edit Request System for Content Moderation
export type EditRequestType = "blog" | "wiki" | "pet" | "user"

export type EditRequestStatus = "pending" | "approved" | "rejected"

export interface EditRequest {
  id: string
  type: EditRequestType
  contentId: string // ID of the content being edited
  authorId: string // User who made the edit
  reporterId?: string // User who reported the content (for edits triggered by reports)
  status: EditRequestStatus
  originalData: Record<string, unknown> // Original content data
  editedData: Record<string, unknown> // New content data
  changesSummary: string // Human-readable summary of changes
  reason?: string // Reason for rejection (if rejected)
  reviewedBy?: string // Admin/moderator who reviewed
  reviewedAt?: string // Timestamp of review
  createdAt: string // When the edit was requested
  priority?: "low" | "medium" | "high" // Manual priority assignment
}

export interface EditRequestAuditLog {
  id: string
  editRequestId: string
  action: "created" | "approved" | "rejected" | "priority_changed"
  performedBy: string
  performedAt: string
  reason?: string
  metadata?: Record<string, unknown>
}


// Privacy Request Types
export type PrivacyRequestType = "data_export" | "data_deletion" | "content_takedown"

export type PrivacyRequestStatus = "pending" | "in_progress" | "completed" | "rejected" | "cancelled"

export interface PrivacyRequest {
  id: string
  userId: string
  type: PrivacyRequestType
  status: PrivacyRequestStatus
  requestedAt: string // When the request was submitted
  startedAt?: string // When processing began
  completedAt?: string // When request was fully processed
  slaDeadline: string // SLA deadline for completion
  slaWarningThreshold: number // Minutes before deadline to show warning
  assignedTo?: string // Admin user ID handling the request
  priority: "low" | "normal" | "high" | "urgent" // Based on SLA time remaining
  metadata?: {
    petId?: string // For content takedown requests
    contentId?: string // For content takedown requests
    contentType?: "post" | "wiki" | "comment" | "photo" // For content takedown
    exportFormat?: "json" | "csv" // For data export
    reason?: string // For content takedown or deletion
  }
  notes?: string // Internal admin notes
  adminNotes?: string[] // Array of admin notes with timestamps
  rejectionReason?: string // If status is rejected
}

export interface PrivacyRequestMetrics {
  totalRequests: number
  pendingRequests: number
  inProgressRequests: number
  completedRequests: number
  overdueRequests: number
  averageCompletionTime: number // In hours
  slaComplianceRate: number // Percentage of requests completed within SLA
  requestsByType: Record<PrivacyRequestType, number>
  requestsByPriority: Record<string, number>
}

export interface SessionDevice {
  deviceId: string
  userId: string
  name: string // Device name (e.g., "iPhone 13", "Chrome on Windows")
  type: "mobile" | "tablet" | "desktop" | "other"
  os?: string // Operating system
  browser?: string // Browser name
  ip?: string // IP address
  lastActivity: string // ISO timestamp
  createdAt: string // ISO timestamp
  isCurrent: boolean // Whether this is the current session
}

export type WebhookStatus = "active" | "paused" | "failed"
export type WebhookHttpMethod = "POST" | "PUT" | "PATCH"

export interface WebhookDelivery {
  id: string
  webhookId: string
  status: "pending" | "success" | "failed"
  attempts: number
  maxAttempts: number
  responseCode?: number
  responseBody?: string
  errorMessage?: string
  createdAt: string
  deliveredAt?: string
}

export interface Webhook {
  id: string
  name: string
  url: string
  method: WebhookHttpMethod
  status: WebhookStatus
  secret?: string // HMAC secret
  events: string[] // Event types to trigger webhook
  retryCount: number // Number of retry attempts (default: 3)
  retryDelay: number // Delay between retries in milliseconds (default: 1000)
  timeout: number // Request timeout in milliseconds (default: 30000)
  headers?: Record<string, string> // Custom headers
  createdAt: string
  updatedAt: string
  lastDeliveryAt?: string
  lastDeliveryStatus?: "success" | "failed"
  deliveryHistory?: WebhookDelivery[]
}

export interface ApiKey {
  id: string
  name: string
  key: string // Full API key (only shown once on creation)
  keyPrefix: string // First 8 characters for display
  scopes: string[] // Permissions/scopes
  lastUsedAt?: string
  expiresAt?: string
  createdAt: string
  isActive: boolean
}

export interface IntegrationSettings {
  webhooks: Webhook[]
  apiKeys: ApiKey[]
}

export type PinnedItemType = "post" | "pet" | "wiki"

export interface PinnedItem {
  id: string
  type: PinnedItemType
  itemId: string
  pinnedAt: string
  title?: string
  description?: string
  image?: string
}

export type CareGuideCategory = "nutrition" | "grooming" | "enrichment" | "senior-care" | "puppy-kitten-care"

export type CareGuideFrequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "as-needed" | "seasonal"

export interface CareGuideStep {
  id: string
  order: number
  title: string
  description: string
  duration?: string // e.g., "5-10 minutes"
  tips?: string[]
  warnings?: string[]
}

export interface EquipmentItem {
  id: string
  name: string
  description?: string
  required: boolean
  alternatives?: string[]
}

export interface CommonMistake {
  id: string
  title: string
  description: string
  consequences?: string
  howToAvoid: string
}

export interface SeasonalityNote {
  season: "spring" | "summer" | "fall" | "winter" | "all-seasons"
  notes: string
  adjustments?: string[]
}

export interface CareGuide {
  id: string
  title: string
  slug: string
  category: CareGuideCategory
  species: ("dog" | "cat" | "bird" | "rabbit" | "hamster" | "fish" | "other")[]
  description: string
  coverImage?: string
  steps: CareGuideStep[]
  frequency: CareGuideFrequency
  frequencyDetails?: string // Additional frequency notes
  equipment: EquipmentItem[]
  commonMistakes: CommonMistake[]
  seasonalityNotes?: SeasonalityNote[]
  authorId?: string
  views: number
  likes: string[]
  createdAt: string
  updatedAt: string
  tags?: string[]
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedTime?: string // Total time estimate
}

export interface TranslationGlossary {
  id: string
  sourceTerm: string // Term in source language (usually English)
  targetLanguage: string // Language code (e.g., "es", "fr")
  targetTerm: string // Translated term
  context?: string // Optional context or usage notes
  category?: string // Optional category (e.g., "medical", "breed", "care")
  createdAt: string
  updatedAt: string
  createdBy?: string // User ID who created the entry
}

// ==================== MODERATION & REVIEWER TOOLS TYPES ====================

export type ChangeType = "create" | "edit" | "delete" | "revert" | "move" | "protect" | "unprotect"

export type ChangeStatus = "pending" | "approved" | "rejected" | "auto-approved"

export type QueueType = "new-pages" | "flagged-health" | "coi-edits" | "image-reviews"

export type TriageCategory = "needs-maps" | "outdated-laws" | "needs-citations" | "needs-medical-review" | "needs-legal-review" | "needs-translation" | "pending-expert-review"

export interface ContentDiff {
  field: string
  oldValue: string | null
  newValue: string | null
  diffHtml?: string // HTML representation of the diff
}

export interface RecentChange {
  id: string
  type: ChangeType
  status: ChangeStatus
  contentType: "wiki" | "blog" | "post" | "pet-profile" | "article"
  contentId: string
  contentTitle: string
  contentSlug?: string
  changes: ContentDiff[]
  summary?: string // Edit summary/comment
  changedBy: string // User ID
  changedByName?: string // User display name
  changedAt: string
  reviewedBy?: string // Moderator/Reviewer ID
  reviewedAt?: string
  reviewComment?: string
  tags?: string[]
  triageCategories?: TriageCategory[]
  flaggedFor?: QueueType[]
  isMinor?: boolean
  isRevert?: boolean
  revertedChangeId?: string
}

export interface QueueItem {
  id: string
  queueType: QueueType
  changeId: string
  priority: "low" | "medium" | "high" | "urgent"
  assignedTo?: string // Moderator/Reviewer ID
  assignedAt?: string
  createdAt: string
  updatedAt: string
  status: "pending" | "in-progress" | "resolved" | "dismissed"
  notes?: string
  change: RecentChange
}

export interface BulkOperation {
  id: string
  type: "revert" | "range-block" | "approve" | "reject" | "assign-category"
  targetIds: string[] // Change IDs or user IDs
  filters?: {
    contentType?: RecentChange["contentType"]
    changedBy?: string
    dateRange?: {
      from: string
      to: string
    }
    tags?: string[]
    triageCategories?: TriageCategory[]
  }
  performedBy: string
  performedAt: string
  result: {
    succeeded: number
    failed: number
    errors?: Array<{ id: string; error: string }>
  }
  metadata?: Record<string, unknown>
}

export interface RangeBlock {
  id: string
  ipRange: string // e.g., "192.168.1.0/24" or "10.0.0.0-10.0.0.255"
  reason: string
  expiresAt?: string
  createdAt: string
  createdBy: string
  isActive: boolean
  affectedChanges?: string[] // Change IDs affected by this block
}

export interface LinkRule {
  id: string
  domain: string // e.g., "example.com" or "*.example.com" for wildcard
  pattern?: string // Regex pattern for more complex matching
  type: "whitelist" | "blacklist"
  reason?: string
  createdAt: string
  createdBy: string
  isActive: boolean
  appliesTo: ("wiki" | "blog" | "post" | "comment" | "all")[]
}

export interface DetectedLink {
  url: string
  domain: string
  rule?: LinkRule // Matching rule if any
  status: "allowed" | "blocked" | "warning" | "unknown"
  detectedAt: string
  detectedIn: {
    contentType: RecentChange["contentType"]
    contentId: string
    field: string
  }
}

export interface HiddenCategory {
  id: string
  name: string
  slug: string
  description?: string
  color?: string // Hex color for UI display
  icon?: string
  isActive: boolean
  createdAt: string
  createdBy: string
  itemCount?: number // Number of items assigned to this category
}

export interface CategoryAssignment {
  id: string
  categoryId: string
  contentType: RecentChange["contentType"]
  contentId: string
  assignedBy: string
  assignedAt: string
  notes?: string
}

export interface ModerationStats {
  recentChanges: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  queues: {
    [K in QueueType]: {
      pending: number
      inProgress: number
      resolved: number
    }
  }
  bulkOperations: {
    last24Hours: number
    last7Days: number
  }
  links: {
    whitelisted: number
    blacklisted: number
    detected: number
    blocked: number
  }
  categories: {
    total: number
    assignments: number
  }
}
