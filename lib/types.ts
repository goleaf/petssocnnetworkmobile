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
  location?: string
  joinedAt: string
  followers: string[]
  following: string[]
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
  favoriteThings?: FavoriteThings
  trainingProgress?: TrainingProgress[]
  vetInfo?: VetInfo
  insurance?: InsuranceInfo
  adoptionDate?: string
  spayedNeutered?: boolean
  specialNeeds?: string
  privacy?: "public" | "private" | "followers-only"
}

export interface FeedPost {
  id: string
  petId: string
  authorId: string
  content: string
  images?: string[]
  likes: string[] // Kept for backward compatibility
  reactions?: Record<ReactionType, string[]> // User IDs who reacted with each type
  createdAt: string
  updatedAt: string
  privacy?: "public" | "private" | "followers-only"
  hashtags?: string[]
}

export interface BlogPost {
  id: string
  petId: string
  authorId: string
  title: string
  content: string
  coverImage?: string
  tags: string[]
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
}

export type ReactionType = "like" | "love" | "laugh" | "wow" | "sad" | "angry"

export interface Comment {
  id: string
  postId?: string // For blog posts
  feedPostId?: string // For feed posts
  wikiArticleId?: string // For wiki articles
  petPhotoId?: string // For pet photos (format: petId:photoIndex)
  userId: string
  content: string
  createdAt: string
  updatedAt?: string
  parentCommentId?: string // For replies
  reactions?: Record<ReactionType, string[]> // User IDs who reacted with each type
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

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedAt: string
}

export interface FavoriteThings {
  toys?: string[]
  activities?: string[]
  places?: string[]
  foods?: string[]
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

export interface Notification {
  id: string
  userId: string
  type: "follow" | "like" | "comment" | "mention" | "post"
  actorId: string
  targetId: string
  targetType: "user" | "pet" | "post" | "wiki"
  message: string
  read: boolean
  createdAt: string
}

export interface NotificationSettings {
  userId: string
  email: {
    follows: boolean
    likes: boolean
    comments: boolean
    mentions: boolean
    posts: boolean
  }
  inApp: {
    follows: boolean
    likes: boolean
    comments: boolean
    mentions: boolean
    posts: boolean
  }
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

// Group Types
export type GroupType = "open" | "closed" | "secret"

export type GroupMemberRole = "owner" | "admin" | "moderator" | "member"

export type GroupTopicStatus = "active" | "locked" | "archived"

export type EventRSVPStatus = "going" | "maybe" | "not-going"

export type GroupResourceType = "document" | "link" | "file"

export type GroupActivityType = "post" | "topic" | "comment" | "poll" | "event" | "join" | "leave" | "role_change"

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
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupMemberRole
  joinedAt: string
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

export interface GroupTopic {
  id: string
  groupId: string
  authorId: string
  title: string
  content: string
  parentTopicId?: string // For nested topics/threads
  isPinned: boolean
  isLocked: boolean
  status: GroupTopicStatus
  viewCount: number
  commentCount: number
  reactions?: Record<ReactionType, string[]>
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface GroupPoll {
  id: string
  groupId: string
  topicId?: string // Optional - polls can be in topics or standalone
  authorId: string
  question: string
  options: PollOption[]
  allowMultiple: boolean
  expiresAt?: string
  isClosed: boolean
  voteCount: number
  createdAt: string
  updatedAt: string
}

export interface PollOption {
  id: string
  text: string
  voteCount: number
}

export interface PollVote {
  id: string
  userId: string
  pollId: string
  optionIds: string[] // Can be multiple if allowMultiple is true
  votedAt: string
}

export interface GroupEvent {
  id: string
  groupId: string
  authorId: string
  title: string
  description: string
  startDate: string
  endDate?: string
  location?: string
  locationUrl?: string
  rsvpRequired: boolean
  maxAttendees?: number
  attendeeCount: number
  coverImage?: string
  isCancelled: boolean
  createdAt: string
  updatedAt: string
}

export interface EventRSVP {
  id: string
  userId: string
  eventId: string
  status: EventRSVPStatus
  respondedAt: string
  notes?: string
}

export interface GroupResource {
  id: string
  groupId: string
  title: string
  type: GroupResourceType
  url?: string // For links
  filePath?: string // For uploaded files (stored as reference)
  description?: string
  uploadedBy: string
  category?: string
  tags?: string[]
  downloadCount?: number
  createdAt: string
}

export interface GroupActivity {
  id: string
  groupId: string
  userId: string
  type: GroupActivityType
  targetId?: string // ID of the target (topic, poll, event, etc.)
  targetType?: "topic" | "poll" | "event" | "resource" | "member"
  metadata?: Record<string, any>
  timestamp: string
}

export interface GroupSubcategory {
  id: string
  name: string
  slug: string
  categoryId: string
  groupCount?: number
}

export interface GroupCategory {
  id: string
  name: string
  slug: string
  description: string
  icon?: string
  groupCount: number
  color?: string
  createdAt: string
  subcategories?: GroupSubcategory[]
}

export interface GroupMetrics {
  // Member metrics
  totalMembers: number
  newMembersThisWeek: number
  newMembersThisMonth: number
  activeMembers: number // Members active in last 7 days
  inactiveMembers: number // Members not active in last 30 days
  
  // Engagement metrics
  totalTopics: number
  topicsThisWeek: number
  topicsThisMonth: number
  totalComments: number
  commentsThisWeek: number
  commentsThisMonth: number
  
  // Content metrics
  totalPolls: number
  pollsThisWeek: number
  pollsThisMonth: number
  totalEvents: number
  eventsThisWeek: number
  eventsThisMonth: number
  totalResources: number
  resourcesThisWeek: number
  resourcesThisMonth: number
  
  // Participation metrics
  pollParticipationRate: number // Percentage of members who voted in polls
  eventAttendanceRate: number // Percentage of members who RSVP'd to events
  averagePollVotes: number
  averageEventRSVPs: number
  
  // Activity timeline (last 7 days)
  dailyActivity: Array<{
    date: string
    topics: number
    comments: number
    polls: number
    events: number
    resources: number
    newMembers: number
  }>
  
  // Period range
  periodStart: string
  periodEnd: string
}

export interface GroupWarning {
  id: string
  groupId: string
  userId: string
  issuedBy: string // Moderator/Admin user ID
  level: 1 | 2 | 3 // Warning level (1 = minor, 2 = moderate, 3 = severe)
  reason: string
  notes?: string
  createdAt: string
}

export interface GroupBan {
  id: string
  groupId: string
  userId: string
  bannedBy: string // Moderator/Admin user ID
  reason: string
  expiresAt?: string // If null, permanent ban
  isActive: boolean
  createdAt: string
}

export interface ModerationAction {
  id: string
  groupId: string
  actionType: "ban" | "unban" | "warn" | "remove_member" | "change_role" | "approve_content" | "reject_content" | "delete_content"
  targetId: string // User ID or content ID
  targetType: "member" | "topic" | "poll" | "event" | "resource" | "comment"
  performedBy: string // Moderator/Admin user ID
  reason?: string
  metadata?: Record<string, any>
  timestamp: string
}