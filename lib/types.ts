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
  wikiArticleId?: string // For wiki articles
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
