export type UserRole = "user" | "admin" | "moderator"

export interface User {
  id: string
  email: string
  username: string
  password?: string
  fullName: string
  role?: UserRole
  avatar?: string
  bio?: string
  location?: string // Text description (e.g., "San Francisco, CA")
  locationGrid?: string // Grid identifier for obfuscated locations (for non-public profiles)
  locationPrecise?: {
    // PRECISE COORDINATES SHOULD ONLY BE STORED FOR PUBLIC PROFILES
    // Never stored for private or followers-only location privacy
    latitude: number
    longitude: number
  }
  joinedAt: string
  followers: string[]
  following: string[]
  followingPets?: string[]
  privacy?: {
    profile: "public" | "private" | "followers-only"
    email: "public" | "private" | "followers-only"
    location: "public" | "private" | "followers-only"
    pets: "public" | "private" | "followers-only"
    posts: "public" | "private" | "followers-only"
    followers: "public" | "private" | "followers-only"
    following: "public" | "private" | "followers-only"
    searchable: boolean
    allowFollowRequests: "public" | "followers-only"
    allowTagging: "public" | "followers-only" | "private"
    secureMessages?: boolean
    sections?: ProfileSectionPrivacy
  }
  blockedUsers?: string[] // User IDs that are blocked
  occupation?: string
  website?: string
  phone?: string
  interests?: string[]
  favoriteAnimals?: string[]
  badge?: "verified" | "pro" | "shelter" | "vet" | null
  isPro?: boolean
  proExpiresAt?: string
  shelterSponsorship?: ShelterSponsorship
}

export interface Pet {
  id: string
  ownerId: string
  name: string
  slug?: string // URL-friendly slug for routing
  species: "dog" | "cat" | "bird" | "rabbit" | "hamster" | "fish" | "other"
  breed?: string
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

export interface BlogPost {
  id: string
  petId: string
  authorId: string
  title: string
  content: string
  coverImage?: string
  tags: string[]
  categories: string[]
  likes: string[] // Kept for backward compatibility
  reactions?: Record<ReactionType, string[]> // User IDs who reacted with each type
  createdAt: string
  updatedAt: string
  privacy?: "public" | "private" | "followers-only"
  isDraft?: boolean
  hashtags?: string[]
  isPromoted?: boolean
  promotedUntil?: string
  promotionStatus?: "pending" | "approved" | "rejected"
  promotionBudget?: number
  media?: BlogPostMedia
  brandAffiliation?: {
    disclosed: boolean
    organizationName?: string
    organizationType?: "brand" | "organization" | "sponsor" | "affiliate"
    lastEditDisclosure?: boolean // Whether disclosure was provided on last edit
    disclosureMissing?: boolean // Flag for moderation if disclosure is missing
  }
  disableWikiLinks?: boolean // Per-post opt-out for wiki term auto-linking
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
  brandAffiliation?: {
    disclosed: boolean
    organizationName?: string
    organizationType?: "brand" | "organization" | "sponsor" | "affiliate"
    lastEditDisclosure?: boolean // Whether disclosure was provided on last edit
    disclosureMissing?: boolean // Flag for moderation if disclosure is missing
  }
}

// Editorial Discussion - separate from public comments, for editorial/administrative discussions
export interface EditorialDiscussion {
  id: string
  articleId: string // Blog post ID
  articleType: "blog" // Currently only for blog posts, can be extended to "wiki" later
  userId: string
  content: string
  createdAt: string
  updatedAt?: string
  parentDiscussionId?: string // For replies within editorial discussions
  reactions?: Record<ReactionType, string[]> // User IDs who reacted with each type
  format?: "markdown" | "plaintext"
  editedBy?: string
}

export type WikiRevisionStatus = "draft" | "stable" | "deprecated"

export interface WikiRevision {
  id: string
  articleId: string
  content: string
  status: WikiRevisionStatus
  authorId: string
  verifiedBy?: string // Expert userId who verified (for health content)
  createdAt: string
  updatedAt: string
  healthData?: HealthArticleData // Health-specific data for health category articles
}

// Health-specific fields for health category wiki articles
export type UrgencyLevel = "emergency" | "urgent" | "routine"

export interface HealthArticleData {
  symptoms: string[]
  urgency: UrgencyLevel
  onsetAge?: string | number // Age when condition typically appears
  riskFactors: string[]
  diagnosisMethods: string[]
  treatments: string[]
  prevention: string[]
  lastReviewedDate?: string // ISO date string
  expertReviewer?: string // User ID of expert who reviewed
}

export type TranslationStatus = "draft" | "published" | "review" | "outdated"

export interface WikiTranslation {
  id: string
  articleId: string
  languageCode: string // ISO 639-1 code (e.g., "en", "ar", "es")
  title?: string
  content?: string
  status: TranslationStatus
  translatorId?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
  baseVersion?: string // Reference to the base language version used
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
  tags?: string[] // Tags for related articles and link graph
  relatedArticles?: string[] // Explicitly related article IDs
  createdAt: string
  updatedAt: string
  currentRevisionId?: string
  stableRevisionId?: string // ID of the approved/stable revision
  revisions?: WikiRevision[]
  baseLanguage?: string // Default: "en"
  approvedAt?: string // Timestamp when stable version was approved
  healthData?: HealthArticleData // Health-specific data (only for health category)
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

export interface GroupEvent {
  id: string
  groupId: string
  authorId: string
  title: string
  description: string
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
  metadata?: Record<string, any>
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
  userId: string
  credential: string
  licenseNo?: string
  region?: string
  verifiedAt?: string
  credentialFileUrls?: string[] // URLs of uploaded credential files
}

export type ExpertVerificationStatus = "pending" | "approved" | "rejected"

export interface ExpertVerificationRequest {
  id: string
  userId: string
  status: ExpertVerificationStatus
  credential: string // e.g., "DVM", "Veterinary Technician", "Animal Behaviorist"
  licenseNo?: string
  region?: string
  credentialFileUrls: string[] // URLs of uploaded credential files
  reason?: string // Reason for rejection (if rejected)
  reviewedBy?: string // Admin/moderator user ID who reviewed
  reviewedAt?: string // Timestamp of review
  createdAt: string // When the request was created
  updatedAt: string // When the request was last updated
}

export type PlaceModerationStatus = "pending" | "approved" | "rejected"

export interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  fenced: boolean
  smallDogArea: boolean
  waterStation: boolean
  amenities: string[]
  rules: string[]
  hazards: string[]
  parkingInfo?: string
  photos: string[]
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

// Flagged Revisions Queue for Health/Regulatory Content
export type FlaggedRevisionStatus = "flagged" | "pending" | "approved" | "rejected"

export interface FlaggedRevision {
  id: string
  revisionId: string
  articleId: string
  flaggedBy?: string // User who flagged the revision (optional - can be auto-flagged)
  flaggedAt: string
  status: FlaggedRevisionStatus
  flagReason?: string // Reason why it was flagged
  reviewedBy?: string // Admin/moderator who reviewed
  reviewedAt?: string // Timestamp of review
  rationale?: string // Rationale for approve/reject decision
  priority?: "low" | "medium" | "high" | "urgent"
  category?: "health" | "regulatory" // Content category
  notes?: string // Additional notes
  createdAt: string
  updatedAt: string
}

export interface FlaggedRevisionAuditLog {
  id: string
  flaggedRevisionId: string
  action: "flagged" | "approved" | "rejected" | "status_changed" | "priority_changed" | "note_added"
  performedBy: string
  performedAt: string
  rationale?: string // Rationale for the action
  previousStatus?: FlaggedRevisionStatus
  newStatus?: FlaggedRevisionStatus
  previousPriority?: string
  newPriority?: string
  metadata?: Record<string, unknown>
}

// Search Analytics Types
export type SearchAnalyticsEventType = "query" | "result_click" | "zero_result"

export type SearchContentType = "user" | "pet" | "blog" | "wiki" | "hashtag" | "shelter" | "group" | "event" | "all"

export interface SearchQueryFilters {
  species?: string[]
  location?: string
  breed?: string
  category?: string[]
  gender?: string[]
  tags?: string[]
  types?: string[]
  nearby?: boolean
  ageMin?: number
  ageMax?: number
  dateFrom?: string
  dateTo?: string
  verified?: boolean
}

export interface SearchAnalyticsEvent {
  id: string
  eventType: SearchAnalyticsEventType
  schemaVersion: string // Event schema version for backward compatibility
  sessionId: string // Anonymized session identifier
  timestamp: string
  
  // Query Information
  query?: string // Original query (may be scrubbed)
  normalizedQuery?: string // Normalized version for aggregation
  hasQuery: boolean // Whether a text query was provided
  
  // Filter Information
  filters?: SearchQueryFilters
  hasFilters: boolean // Whether any filters were applied
  filterCount: number // Number of filter categories applied
  
  // Result Information
  resultCount?: number
  isZeroResult?: boolean // True if no results returned
  contentType?: SearchContentType // Type of content being searched
  clickedResultType?: SearchContentType // Type of result clicked (for CTR)
  clickedResultId?: string // Result ID clicked (hashed/anonymized)
  
  // User Context (anonymized)
  isAuthenticated: boolean
  userSegment?: string // Anonymized user segment classification
  
  // Metadata
  metadata?: Record<string, unknown>
}

export interface SearchAnalyticsAggregation {
  period: "day" | "week" | "month"
  startDate: string
  endDate: string
  
  // Query Metrics
  totalQueries: number
  uniqueQueries: number
  averageQueryLength?: number
  
  // Zero Result Metrics
  zeroResultQueries: number
  zeroResultRate: number // Percentage of queries with zero results
  topZeroResultQueries: Array<{
    query: string
    count: number
  }>
  
  // CTR Metrics
  totalResultClicks: number
  clickThroughRate: number // Percentage of impressions that resulted in clicks
  clicksByContentType: Record<SearchContentType, number>
  
  // Content Type Breakdown
  queriesByContentType: Record<SearchContentType, number>
  topContentTypes: Array<{
    type: SearchContentType
    queries: number
  }>
  
  // Filter Usage
  filterUsageCount: number
  averageFiltersPerQuery: number
  mostUsedFilters: Array<{
    filterType: string
    count: number
  }>
  
  // Trend Data
  dailyBreakdown?: Array<{
    date: string
    queries: number
    zeroResults: number
    clicks: number
    ctr: number
  }>
}

export interface SearchAnalyticsSummary {
  totalQueries: number
  totalZeroResultQueries: number
  totalClicks: number
  overallCTR: number
  overallZeroResultRate: number
  period: SearchAnalyticsAggregation["period"]
  generatedAt: string
}

export interface WatchEntry {
  id: string
  userId: string
  targetId: string
  targetType: "post" | "wiki"
  watchEvents: string[] // ["update", "comment", "reaction"]
  enabled: boolean
  createdAt: string
  updatedAt: string
}
