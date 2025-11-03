import type {
  Activity,
  BlogPost,
  BlogPostMedia,
  Comment,
  CommentFlag,
  CommentFlagReason,
  CommentModeration,
  CommentStatus,
  EditRequest,
  EditRequestAuditLog,
  EditorialDiscussion,
  EventLocationShare,
  EventRSVP,
  ExpertProfile,
  ExpertVerificationRequest,
  FriendCategory,
  FriendRequest,
  Group,
  GroupActivity,
  GroupBan,
  GroupCategory,
  GroupEvent,
  GroupMember,
  GroupPoll,
  GroupResource,
  GroupType,
  GroupVisibilitySettings,
  GroupTopic,
  GroupTopicStatus,
  GroupWarning,
  Organization,
  Pet,
  PetPlaydateInvite,
  PetRelationship,
  PetSocialCircle,
  PetSocialCircleOverview,
  PetVirtualPlaydate,
  PrivacyLevel,
  PollVote,
  ReactionType,
  ModerationAction,
  ReReviewRequest,
  User,
  WatchEntry,
  WikiArticle,
  WikiRevision,
  WikiRevisionStatus,
  WikiTranslation,
  TranslationStatus,
  TranslationGlossary,
  Conversation,
  DirectMessage,
  MessageReaction,
  MessageSearchResult,
  Place,
  PlacePhoto,
  PinnedItem,
  PinnedItemType,
  Source,
  IntegrationSettings,
  Webhook,
  ApiKey,
  WebhookDelivery,
} from "./types"
import {
  mockUsers,
  mockPets,
  mockBlogPosts,
  mockComments,
  mockWikiArticles,
  mockConversations,
  mockDirectMessages,
  WIKI_CATEGORY_IMAGE_POOLS,
} from "./mock-data"
import { calculateAge } from "./utils/date"
import { addNotification, createMentionNotification } from "./notifications"
import { extractMentions } from "./utils/mentions"
import { normalizeCategoryList } from "./utils/categories"
import { invalidateCache } from "./cache"
import { sanitizeLocationForStorage } from "./utils/location-obfuscation"
import { generateGroupsForAnimal } from "./generate-groups"

const STORAGE_KEYS = {
  USERS: "pet_social_users",
  PETS: "pet_social_pets",
  BLOG_POSTS: "pet_social_blog_posts",
  COMMENTS: "pet_social_comments",
  WIKI_ARTICLES: "pet_social_wiki_articles",
  WIKI_REVISIONS: "pet_social_wiki_revisions",
  ACTIVITIES: "pet_social_activities",
  CURRENT_USER: "pet_social_current_user",
  FRIEND_REQUESTS: "pet_social_friend_requests",
  GROUPS: "pet_social_groups",
  GROUP_CATEGORIES: "pet_social_group_categories",
  GROUP_MEMBERS: "pet_social_group_members",
  GROUP_TOPICS: "pet_social_group_topics",
  GROUP_POLLS: "pet_social_group_polls",
  GROUP_EVENTS: "pet_social_group_events",
  GROUP_RESOURCES: "pet_social_group_resources",
  GROUP_ACTIVITIES: "pet_social_group_activities",
  POLL_VOTES: "pet_social_poll_votes",
  EVENT_RSVPS: "pet_social_event_rsvps",
  GROUP_WARNINGS: "pet_social_group_warnings",
  GROUP_BANS: "pet_social_group_bans",
  MODERATION_ACTIONS: "pet_social_moderation_actions",
  CONVERSATIONS: "pet_social_conversations",
  DIRECT_MESSAGES: "pet_social_direct_messages",
  PLACES: "pet_social_places",
  PLACE_PHOTOS: "pet_social_place_photos",
  WIKI_TRANSLATIONS: "pet_social_wiki_translations",
  TRANSLATION_GLOSSARY: "pet_social_translation_glossary",
  EDIT_REQUESTS: "pet_social_edit_requests",
  EDIT_REQUEST_AUDIT_LOGS: "pet_social_edit_request_audit_logs",
  ROLLBACK_HISTORY: "pet_social_rollback_history",
  ARTICLE_REPORTS: "pet_social_article_reports",
  COI_FLAGS: "pet_social_coi_flags",
  ORGANIZATIONS: "pet_social_organizations",
  EXPERT_PROFILES: "pet_social_expert_profiles",
  EXPERT_VERIFICATION_REQUESTS: "pet_social_expert_verification_requests",
  WATCH_ENTRIES: "pet_social_watch_entries",
  PINNED_ITEMS: "pet_social_pinned_items",
  ANNOUNCEMENTS: "pet_social_announcements",
  ANNOUNCEMENT_DISMISSALS: "pet_social_announcement_dismissals",
  SOURCES: "pet_social_sources",
  INTEGRATIONS: "pet_social_integrations",
  PRODUCTS: "pet_social_products",
  RECALLS: "pet_social_recalls",
}

const DEFAULT_CONVERSATIONS: Conversation[] = JSON.parse(JSON.stringify(mockConversations)) as Conversation[]
const DEFAULT_DIRECT_MESSAGES: DirectMessage[] = JSON.parse(JSON.stringify(mockDirectMessages)) as DirectMessage[]

const isBrowser = typeof window !== "undefined"

interface StorageAdapter {
  read<T>(key: string, fallback: T): T
  write<T>(key: string, value: T): void
  remove(key: string): void
}

const localStorageAdapter: StorageAdapter = {
  read<T>(key: string, fallback: T): T {
    if (!isBrowser) return fallback
    try {
      const value = localStorage.getItem(key)
      if (!value) return fallback
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Failed to read key ${key} from storage`, error)
      return fallback
    }
  },
  write<T>(key: string, value: T) {
    if (!isBrowser) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to write key ${key} to storage`, error)
    }
  },
  remove(key: string) {
    if (!isBrowser) return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove key ${key} from storage`, error)
    }
  },
}

let storageAdapter: StorageAdapter = localStorageAdapter

export function setStorageAdapter(adapter: StorageAdapter) {
  storageAdapter = adapter
}

export function readData<T>(key: string, fallback: T): T {
  return storageAdapter.read(key, fallback)
}

export function writeData<T>(key: string, value: T): void {
  storageAdapter.write(key, value)
}

export function generateStorageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  const randomPart = Math.random().toString(16).slice(2)
  return `${prefix}_${Date.now()}_${randomPart}`
}

// Helper function to generate slug from pet name
export function generatePetSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

export function generateGroupSlug(name: string): string {
  return generatePetSlug(name)
}

export function generateWikiSlug(title: string): string {
  return generatePetSlug(title)
}

const DEFAULT_GROUP_CATEGORIES: GroupCategory[] = [
  {
    id: "cat-dogs",
    name: "Dog Communities",
    slug: "dog-communities",
    description: "Training tips, meetups, and lifestyle groups for dog people.",
    color: "#f97316",
    subcategories: [
      { id: "cat-dogs-training", name: "Training" },
      { id: "cat-dogs-rescue", name: "Rescue & Adoption" },
    ],
  },
  {
    id: "cat-cats",
    name: "Cat Communities",
    slug: "cat-communities",
    description: "Indoor enrichment, nutrition, and wellness for cats.",
    color: "#8b5cf6",
    subcategories: [
      { id: "cat-cats-enrichment", name: "Enrichment" },
      { id: "cat-cats-health", name: "Health & Nutrition" },
    ],
  },
  {
    id: "cat-birds",
    name: "Bird Enthusiasts",
    slug: "bird-enthusiasts",
    description: "Parrot care, aviary setups, and training techniques.",
    color: "#10b981",
    subcategories: [
      { id: "cat-birds-training", name: "Training" },
      { id: "cat-birds-health", name: "Health" },
    ],
  },
  {
    id: "cat-rabbits",
    name: "Rabbit Communities",
    slug: "rabbit-communities",
    description: "Care tips, housing setups, and nutrition for rabbit owners.",
    color: "#ec4899",
    subcategories: [
      { id: "cat-rabbits-care", name: "Care" },
      { id: "cat-rabbits-housing", name: "Housing" },
    ],
  },
  {
    id: "cat-hamsters",
    name: "Hamster Communities",
    slug: "hamster-communities",
    description: "Hamster care, cage setups, and enrichment ideas.",
    color: "#f97316",
    subcategories: [
      { id: "cat-hamsters-care", name: "Care" },
      { id: "cat-hamsters-enrichment", name: "Enrichment" },
    ],
  },
  {
    id: "cat-fish",
    name: "Fish Communities",
    slug: "fish-communities",
    description: "Aquarium setups, water quality, and fish care.",
    color: "#06b6d4",
    subcategories: [
      { id: "cat-fish-aquarium", name: "Aquarium Setup" },
      { id: "cat-fish-care", name: "Care" },
    ],
  },
  {
    id: "cat-turtles",
    name: "Turtle Communities",
    slug: "turtle-communities",
    description: "Turtle care, habitat setups, and health management.",
    color: "#10b981",
    subcategories: [
      { id: "cat-turtles-habitat", name: "Habitat" },
      { id: "cat-turtles-health", name: "Health" },
    ],
  },
  {
    id: "cat-snakes",
    name: "Snake Communities",
    slug: "snake-communities",
    description: "Snake care, enclosure setups, and handling tips.",
    color: "#059669",
    subcategories: [
      { id: "cat-snakes-enclosure", name: "Enclosure" },
      { id: "cat-snakes-care", name: "Care" },
    ],
  },
  {
    id: "cat-lizards",
    name: "Lizard Communities",
    slug: "lizard-communities",
    description: "Lizard care, terrarium setups, and species-specific advice.",
    color: "#84cc16",
    subcategories: [
      { id: "cat-lizards-terrarium", name: "Terrarium" },
      { id: "cat-lizards-care", name: "Care" },
    ],
  },
  {
    id: "cat-guinea-pigs",
    name: "Guinea Pig Communities",
    slug: "guinea-pig-communities",
    description: "Guinea pig care, cage setups, and nutrition.",
    color: "#f43f5e",
    subcategories: [
      { id: "cat-guinea-pigs-care", name: "Care" },
      { id: "cat-guinea-pigs-nutrition", name: "Nutrition" },
    ],
  },
  {
    id: "cat-ferrets",
    name: "Ferret Communities",
    slug: "ferret-communities",
    description: "Ferret care, enrichment, and health management.",
    color: "#6366f1",
    subcategories: [
      { id: "cat-ferrets-care", name: "Care" },
      { id: "cat-ferrets-enrichment", name: "Enrichment" },
    ],
  },
  {
    id: "cat-chinchillas",
    name: "Chinchilla Communities",
    slug: "chinchilla-communities",
    description: "Chinchilla care, cage setups, and dust bath tips.",
    color: "#8b5cf6",
    subcategories: [
      { id: "cat-chinchillas-care", name: "Care" },
      { id: "cat-chinchillas-housing", name: "Housing" },
    ],
  },
  {
    id: "cat-hedgehogs",
    name: "Hedgehog Communities",
    slug: "hedgehog-communities",
    description: "Hedgehog care, habitat setups, and health tips.",
    color: "#a855f7",
    subcategories: [
      { id: "cat-hedgehogs-care", name: "Care" },
      { id: "cat-hedgehogs-habitat", name: "Habitat" },
    ],
  },
  {
    id: "cat-gerbils",
    name: "Gerbil Communities",
    slug: "gerbil-communities",
    description: "Gerbil care, cage setups, and enrichment ideas.",
    color: "#ef4444",
    subcategories: [
      { id: "cat-gerbils-care", name: "Care" },
      { id: "cat-gerbils-enrichment", name: "Enrichment" },
    ],
  },
  {
    id: "cat-mice",
    name: "Mouse Communities",
    slug: "mouse-communities",
    description: "Mouse care, cage setups, and health management.",
    color: "#6b7280",
    subcategories: [
      { id: "cat-mice-care", name: "Care" },
      { id: "cat-mice-housing", name: "Housing" },
    ],
  },
  {
    id: "cat-rats",
    name: "Rat Communities",
    slug: "rat-communities",
    description: "Rat care, cage setups, and training tips.",
    color: "#475569",
    subcategories: [
      { id: "cat-rats-care", name: "Care" },
      { id: "cat-rats-training", name: "Training" },
    ],
  },
  {
    id: "cat-small-pets",
    name: "Small Pet Circles",
    slug: "small-pet-circles",
    description: "Rabbits, hamsters, and other small companion animals.",
    color: "#facc15",
    subcategories: [
      { id: "cat-small-housing", name: "Housing" },
      { id: "cat-small-diet", name: "Diet" },
    ],
  },
  {
    id: "cat-training",
    name: "Training Labs",
    slug: "training-labs",
    description: "Positive reinforcement, agility, and behavior shaping.",
    color: "#ec4899",
    subcategories: [
      { id: "cat-training-agility", name: "Agility" },
      { id: "cat-training-behavior", name: "Behavior" },
    ],
  },
  {
    id: "cat-health",
    name: "Pet Health & Wellness",
    slug: "pet-health-wellness",
    description: "Preventative care, nutrition plans, and vet Q&A.",
    color: "#3b82f6",
    subcategories: [
      { id: "cat-health-nutrition", name: "Nutrition" },
      { id: "cat-health-fitness", name: "Fitness" },
    ],
  },
]

const DEFAULT_GROUP_VISIBILITY: Record<GroupType, GroupVisibilitySettings> = {
  open: { discoverable: true, content: "everyone" },
  closed: { discoverable: true, content: "members" },
  secret: { discoverable: false, content: "members" },
}

export function getDefaultGroupVisibility(type: GroupType): GroupVisibilitySettings {
  const defaults = DEFAULT_GROUP_VISIBILITY[type] ?? DEFAULT_GROUP_VISIBILITY.open
  return { ...defaults }
}

function normalizeGroupVisibility(
  group: Group,
  partialVisibility?: Partial<GroupVisibilitySettings>,
): GroupVisibilitySettings {
  const defaults = getDefaultGroupVisibility(group.type)
  const rawVisibility: Partial<GroupVisibilitySettings> =
    partialVisibility ?? (group.visibility ?? {})

  return {
    discoverable:
      rawVisibility.discoverable !== undefined ? rawVisibility.discoverable : defaults.discoverable,
    content: rawVisibility.content ?? defaults.content,
  }
}

function normalizeGroup(group: Group): Group {
  return {
    ...group,
    visibility: normalizeGroupVisibility(group),
  }
}

// Generate groups for all animal types (25+ per type)
const animalCategoryMap: Record<string, string> = {
  dog: "cat-dogs",
  cat: "cat-cats",
  bird: "cat-birds",
  rabbit: "cat-rabbits",
  hamster: "cat-hamsters",
  fish: "cat-fish",
  turtle: "cat-turtles",
  snake: "cat-snakes",
  lizard: "cat-lizards",
  "guinea-pig": "cat-guinea-pigs",
  ferret: "cat-ferrets",
  chinchilla: "cat-chinchillas",
  hedgehog: "cat-hedgehogs",
  gerbil: "cat-gerbils",
  mouse: "cat-mice",
  rat: "cat-rats",
}

const BASE_GROUPS: Group[] = [
  {
    id: "group-1",
    name: "Golden Retriever Adventures",
    slug: "golden-retriever-adventures",
    description:
      "Share trail recommendations, swimming spots, and training wins with fellow golden retriever families.",
    type: "open",
    categoryId: "cat-dogs",
    ownerId: "1",
    coverImage: "/golden-retriever-beach.png",
    avatar: "/icon-192x192.png",
    memberCount: 4,
    topicCount: 2,
    postCount: 8,
    tags: ["dogs", "hiking", "retrievers"],
    rules: ["Be kind and respectful", "No sales posts", "Use spoiler tags for injuries"],
    createdAt: "2024-02-01T10:00:00.000Z",
    updatedAt: "2024-12-01T09:00:00.000Z",
    visibility: {
      discoverable: true,
      content: "everyone",
    },
  },
  {
    id: "group-2",
    name: "Indoor Cat Lifestyle",
    slug: "indoor-cat-lifestyle",
    description:
      "Ideas and support for keeping indoor cats happy, enriched, and healthy.",
    type: "closed",
    categoryId: "cat-cats",
    ownerId: "2",
    coverImage: "/cat-in-box.jpg",
    avatar: "https://ui-avatars.com/api/?name=Indoor+Cat&background=8b5cf6&color=fff",
    memberCount: 3,
    topicCount: 1,
    postCount: 3,
    tags: ["cats", "enrichment", "nutrition"],
    rules: ["Share constructive advice only", "No declawing advocacy"],
    createdAt: "2024-03-12T13:30:00.000Z",
    updatedAt: "2024-11-20T15:00:00.000Z",
    visibility: {
      discoverable: true,
      content: "members",
    },
  },
  {
    id: "group-3",
    name: "Exotic Bird Enthusiasts",
    slug: "exotic-bird-enthusiasts",
    description:
      "From enrichment ideas to training breakthroughs, this is the home for serious bird keepers.",
    type: "open",
    categoryId: "cat-birds",
    ownerId: "3",
    coverImage: "/parrot-waving.jpg",
    avatar: "https://ui-avatars.com/api/?name=Birds&background=10b981&color=fff",
    memberCount: 2,
    topicCount: 1,
    postCount: 2,
    tags: ["birds", "training", "behavior"],
    rules: ["Cite sources when sharing medical advice", "No sale of live animals"],
    createdAt: "2024-01-25T08:10:00.000Z",
    updatedAt: "2024-10-18T12:00:00.000Z",
    visibility: {
      discoverable: true,
      content: "everyone",
    },
  },
]

// Generate groups for each animal type
let groupIdCounter = 4
const generatedGroups: Group[] = []

Object.entries(animalCategoryMap).forEach(([animalType, categoryId]) => {
  const groups = generateGroupsForAnimal(animalType, categoryId, 25, groupIdCounter)
  generatedGroups.push(...groups)
  groupIdCounter += groups.length
})

const DEFAULT_GROUPS: Group[] = [...BASE_GROUPS, ...generatedGroups]

const FULL_PERMISSIONS = {
  canPost: true,
  canComment: true,
  canCreateTopic: true,
  canCreatePoll: true,
  canCreateEvent: true,
  canModerate: true,
  canManageMembers: true,
  canManageSettings: true,
} as const

const DEFAULT_GROUP_MEMBERS: GroupMember[] = [
  {
    id: "member-1",
    groupId: "group-1",
    userId: "1",
    role: "owner",
    joinedAt: "2024-02-01T10:00:00.000Z",
    permissions: { ...FULL_PERMISSIONS },
  },
  {
    id: "member-2",
    groupId: "group-1",
    userId: "5",
    role: "admin",
    joinedAt: "2024-02-05T09:00:00.000Z",
    permissions: {
      ...FULL_PERMISSIONS,
      canManageSettings: true,
    },
  },
  {
    id: "member-3",
    groupId: "group-1",
    userId: "2",
    role: "member",
    joinedAt: "2024-02-08T14:00:00.000Z",
    permissions: {
      canPost: true,
      canComment: true,
      canCreateTopic: true,
    },
  },
  {
    id: "member-4",
    groupId: "group-2",
    userId: "2",
    role: "owner",
    joinedAt: "2024-03-12T13:30:00.000Z",
    permissions: { ...FULL_PERMISSIONS },
  },
  {
    id: "member-5",
    groupId: "group-2",
    userId: "6",
    role: "moderator",
    joinedAt: "2024-03-18T10:00:00.000Z",
    permissions: {
      canPost: true,
      canComment: true,
      canCreateTopic: true,
      canModerate: true,
      canManageMembers: true,
    },
  },
  {
    id: "member-6",
    groupId: "group-2",
    userId: "1",
    role: "member",
    joinedAt: "2024-03-20T12:00:00.000Z",
    permissions: {
      canPost: true,
      canComment: true,
      canCreateTopic: true,
    },
  },
  {
    id: "member-7",
    groupId: "group-3",
    userId: "3",
    role: "owner",
    joinedAt: "2024-01-25T08:10:00.000Z",
    permissions: { ...FULL_PERMISSIONS },
  },
  {
    id: "member-8",
    groupId: "group-3",
    userId: "8",
    role: "member",
    joinedAt: "2024-01-30T10:30:00.000Z",
    permissions: {
      canPost: true,
      canComment: true,
      canCreateTopic: true,
    },
  },
]

const DEFAULT_GROUP_TOPICS: GroupTopic[] = [
  {
    id: "topic-1",
    groupId: "group-1",
    authorId: "1",
    title: "Best Summer Swimming Spots?",
    content:
      "Looking for lakes or beaches that are dog-friendly and have calm water. Any recommendations around SF Bay Area?",
    viewCount: 128,
    commentCount: 6,
    isPinned: true,
    status: "active",
    tags: ["outdoors", "swimming", "travel"],
    lastActivityAt: "2024-05-05T09:00:00.000Z",
    createdAt: "2024-05-01T09:00:00.000Z",
    updatedAt: "2024-05-05T09:00:00.000Z",
  },
  {
    id: "topic-2",
    groupId: "group-1",
    authorId: "5",
    title: "Training recall around distractions",
    content:
      "What drills have worked for you when trying to build a reliable recall with a high-energy retriever?",
    viewCount: 92,
    commentCount: 4,
    status: "active",
    tags: ["training", "behavior", "recall"],
    lastActivityAt: "2024-06-16T11:00:00.000Z",
    createdAt: "2024-06-15T11:00:00.000Z",
    updatedAt: "2024-06-16T11:00:00.000Z",
  },
  {
    id: "topic-3",
    groupId: "group-2",
    authorId: "2",
    title: "DIY puzzle feeders for rainy days",
    content:
      "Sharing a few easy-to-make puzzle feeders using cardboard and treat balls. Add yours to the thread!",
    viewCount: 74,
    commentCount: 3,
    status: "active",
    tags: ["enrichment", "diy", "indoor"],
    lastActivityAt: "2024-04-09T17:00:00.000Z",
    createdAt: "2024-04-09T17:00:00.000Z",
    updatedAt: "2024-04-09T17:00:00.000Z",
  },
  {
    id: "topic-4",
    groupId: "group-3",
    authorId: "3",
    title: "Feather destructive behavior tips?",
    content:
      "Kiwi has started shredding wing feathers. Vet cleared medical issues. Looking for enrichment ideas to redirect.",
    viewCount: 55,
    commentCount: 5,
    status: "active",
    tags: ["birds", "behavior", "health"],
    lastActivityAt: "2024-03-24T08:00:00.000Z",
    createdAt: "2024-03-22T08:00:00.000Z",
    updatedAt: "2024-03-24T08:00:00.000Z",
  },
]

const DEFAULT_GROUP_POLLS: GroupPoll[] = [
  {
    id: "poll-1",
    groupId: "group-1",
    authorId: "1",
    question: "Which weekend works best for a beach meetup?",
    description: "Trying to lock a date for our annual golden meetup at the coast.",
    options: [
      { id: "option-1", text: "July 13", voteCount: 6 },
      { id: "option-2", text: "July 20", voteCount: 4 },
      { id: "option-3", text: "July 27", voteCount: 2 },
    ],
    allowMultiple: false,
    voteCount: 12,
    createdAt: "2024-06-01T10:00:00.000Z",
    updatedAt: "2024-06-05T10:00:00.000Z",
    expiresAt: "2024-07-05T10:00:00.000Z",
  },
]

const DEFAULT_POLL_VOTES: PollVote[] = [
  {
    id: "vote-1",
    pollId: "poll-1",
    userId: "1",
    optionIds: ["option-1"],
    votedAt: "2024-06-01T11:00:00.000Z",
  },
  {
    id: "vote-2",
    pollId: "poll-1",
    userId: "5",
    optionIds: ["option-1"],
    votedAt: "2024-06-01T11:05:00.000Z",
  },
  {
    id: "vote-3",
    pollId: "poll-1",
    userId: "2",
    optionIds: ["option-2"],
    votedAt: "2024-06-02T08:00:00.000Z",
  },
]

const DEFAULT_GROUP_EVENTS: GroupEvent[] = [
  {
    id: "event-1",
    groupId: "group-1",
    authorId: "5",
    title: "Golden Retriever Beach Day",
    description:
      "Bring towels, water, and ball launchers. We'll set up near the north parking lot shelter.",
    location: "Ocean Beach, San Francisco",
    startDate: "2024-07-20T17:00:00.000Z",
    endDate: "2024-07-20T21:00:00.000Z",
    coverImage: "/golden-retriever-beach.png",
    attendeeCount: 3,
    maxAttendees: 20,
    tags: ["meetup", "beach"],
    rsvpRequired: true,
    locationSharingEnabled: true,
    locationSharingDescription: "Share your arrival point so other retriever parents can find you quickly.",
    createdAt: "2024-05-20T09:00:00.000Z",
    updatedAt: "2024-06-10T09:00:00.000Z",
  },
]

const DEFAULT_EVENT_RSVPS: EventRSVP[] = [
  {
    id: "rsvp-1",
    eventId: "event-1",
    userId: "1",
    status: "going",
    respondedAt: "2024-05-21T10:00:00.000Z",
    shareLocation: true,
    locationShare: {
      method: "manual",
      label: "Set up near the north shelter",
      sharedAt: "2024-07-20T17:05:00.000Z",
    },
  },
  {
    id: "rsvp-2",
    eventId: "event-1",
    userId: "5",
    status: "going",
    respondedAt: "2024-05-22T08:30:00.000Z",
    shareLocation: true,
    locationShare: {
      method: "device",
      latitude: 37.7694,
      longitude: -122.4836,
      accuracy: 30,
      sharedAt: "2024-07-20T17:10:00.000Z",
    },
  },
  {
    id: "rsvp-3",
    eventId: "event-1",
    userId: "2",
    status: "maybe",
    respondedAt: "2024-05-23T12:45:00.000Z",
  },
]

const DEFAULT_GROUP_RESOURCES: GroupResource[] = [
  {
    id: "resource-1",
    groupId: "group-1",
    title: "Canine Swim Safety Checklist",
    description: "Printable checklist to make beach trips safer for pups.",
    url: "https://example.com/dog-swim-checklist",
    createdBy: "5",
    createdAt: "2024-05-02T09:00:00.000Z",
    updatedAt: "2024-05-02T09:00:00.000Z",
    type: "link",
    tags: ["safety", "swimming"],
  },
  {
    id: "resource-2",
    groupId: "group-2",
    title: "Indoor Cat Enrichment Guide",
    description: "PDF guide with weekly rotation ideas.",
    url: "https://example.com/indoor-cat-enrichment.pdf",
    createdBy: "2",
    createdAt: "2024-04-10T16:00:00.000Z",
    updatedAt: "2024-04-10T16:00:00.000Z",
    type: "link",
    tags: ["enrichment"],
  },
]

const DEFAULT_GROUP_ACTIVITIES: GroupActivity[] = [
  {
    id: "activity-1",
    groupId: "group-1",
    userId: "1",
    type: "topic",
    targetId: "topic-1",
    timestamp: "2024-05-01T09:00:00.000Z",
  },
  {
    id: "activity-2",
    groupId: "group-1",
    userId: "5",
    type: "poll",
    targetId: "poll-1",
    timestamp: "2024-06-01T10:00:00.000Z",
  },
  {
    id: "activity-3",
    groupId: "group-2",
    userId: "2",
    type: "topic",
    targetId: "topic-3",
    timestamp: "2024-04-09T17:00:00.000Z",
  },
]

const DEFAULT_GROUP_WARNINGS: GroupWarning[] = []

const DEFAULT_GROUP_BANS: GroupBan[] = []

const DEFAULT_MODERATION_ACTIONS: ModerationAction[] = []

function normalizeUser(user: User): User {
  return {
    ...user,
    followers: Array.isArray(user.followers) ? user.followers : [],
    following: Array.isArray(user.following) ? user.following : [],
    followingPets: Array.isArray(user.followingPets) ? user.followingPets : [],
  }
}

function createEmptySocialCircle(): PetSocialCircle {
  return {
    relationships: [],
    playdates: [],
    invites: [],
    highlights: [],
  }
}

function normalizeSocialCircle(circle?: PetSocialCircle | null): PetSocialCircle | undefined {
  if (!circle) return undefined

  return {
    overview: circle.overview,
    relationships: Array.isArray(circle.relationships) ? circle.relationships : [],
    playdates: Array.isArray(circle.playdates) ? circle.playdates : [],
    invites: Array.isArray(circle.invites) ? circle.invites : [],
    highlights: Array.isArray(circle.highlights) ? circle.highlights : [],
  }
}

function normalizePet(pet: Pet): Pet {
  const normalizedCircle = normalizeSocialCircle(pet.socialCircle)

  const friends = Array.isArray(pet.friends)
    ? Array.from(new Set(pet.friends.filter((id) => typeof id === "string" && id && id !== pet.id)))
    : []

  const friendCategories = Array.isArray(pet.friendCategories) ? pet.friendCategories : []
  const assignmentEntries = Object.entries(pet.friendCategoryAssignments ?? {}).filter(
    ([friendId, categoryId]) =>
      friends.includes(friendId) && (categoryId === null || typeof categoryId === "string"),
  )
  const friendCategoryAssignments =
    assignmentEntries.length > 0 ? Object.fromEntries(assignmentEntries) : undefined

  const normalizedPet: Pet = {
    ...pet,
    friends,
    friendCategories,
    friendCategoryAssignments,
    followers: Array.isArray(pet.followers) ? pet.followers : [],
    socialCircle: normalizedCircle ?? undefined,
  }

  if (!pet.birthday) {
    return normalizedPet
  }

  const computedAge = calculateAge(pet.birthday)
  if (computedAge === undefined) {
    return normalizedPet
  }

  return {
    ...normalizedPet,
    age: computedAge,
  }
}

function normalizeWikiArticle(article: WikiArticle, index: number): WikiArticle {
  const poolKey = article.category as keyof typeof WIKI_CATEGORY_IMAGE_POOLS
  const imagePool = Array.isArray(WIKI_CATEGORY_IMAGE_POOLS[poolKey])
    ? [...WIKI_CATEGORY_IMAGE_POOLS[poolKey]]
    : [...WIKI_CATEGORY_IMAGE_POOLS.default]

  const normalizedCoverImage =
    typeof article.coverImage === "string" && article.coverImage.trim().length > 0
      ? article.coverImage
      : imagePool[index % imagePool.length]

  const normalizedLikes = Array.isArray(article.likes)
    ? Array.from(
        new Set(
          article.likes.filter(
            (id): id is string => typeof id === "string" && id.trim().length > 0,
          ),
        ),
      )
    : []

  return {
    ...article,
    coverImage: normalizedCoverImage,
    likes: normalizedLikes,
  }
}

// Initialize storage with mock data if empty
export function initializeStorage() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers.map(normalizeUser)))
  } else {
    const existingUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]") as User[]
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existingUsers.map(normalizeUser)))
  }
  if (!localStorage.getItem(STORAGE_KEYS.PETS)) {
    // Generate slugs for all pets if they don't have them
    const petsWithSlugs = mockPets.map((pet) =>
      normalizePet({
        ...pet,
        slug: pet.slug || generatePetSlug(pet.name),
      })
    )
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(petsWithSlugs))
  } else {
    // Ensure existing pets have slugs
    const existingPets = JSON.parse(localStorage.getItem(STORAGE_KEYS.PETS) || "[]") as Pet[]
    const updatedPets = existingPets.map((pet) =>
      normalizePet({
        ...pet,
        slug: pet.slug || generatePetSlug(pet.name),
      })
    )
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updatedPets))
  }
  if (!localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)) {
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(mockBlogPosts))
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(mockComments))
  }
  if (!localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES)) {
    const seededArticles = mockWikiArticles.map((article, index) => normalizeWikiArticle(article, index))
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(seededArticles))
  } else {
    const existingArticles = JSON.parse(localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES) || "[]") as WikiArticle[]
    const normalizedArticles = existingArticles.map((article, index) => normalizeWikiArticle(article, index))
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(normalizedArticles))
  }
  if (!localStorage.getItem(STORAGE_KEYS.WIKI_REVISIONS)) {
    localStorage.setItem(STORAGE_KEYS.WIKI_REVISIONS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(mockConversations))
  }
  if (!localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(mockDirectMessages))
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)) {
    localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_CATEGORIES)) {
    writeData(STORAGE_KEYS.GROUP_CATEGORIES, DEFAULT_GROUP_CATEGORIES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    writeData(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_MEMBERS)) {
    writeData(STORAGE_KEYS.GROUP_MEMBERS, DEFAULT_GROUP_MEMBERS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_TOPICS)) {
    writeData(STORAGE_KEYS.GROUP_TOPICS, DEFAULT_GROUP_TOPICS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_POLLS)) {
    writeData(STORAGE_KEYS.GROUP_POLLS, DEFAULT_GROUP_POLLS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.POLL_VOTES)) {
    writeData(STORAGE_KEYS.POLL_VOTES, DEFAULT_POLL_VOTES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_EVENTS)) {
    writeData(STORAGE_KEYS.GROUP_EVENTS, DEFAULT_GROUP_EVENTS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENT_RSVPS)) {
    writeData(STORAGE_KEYS.EVENT_RSVPS, DEFAULT_EVENT_RSVPS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_RESOURCES)) {
    writeData(STORAGE_KEYS.GROUP_RESOURCES, DEFAULT_GROUP_RESOURCES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_ACTIVITIES)) {
    writeData(STORAGE_KEYS.GROUP_ACTIVITIES, DEFAULT_GROUP_ACTIVITIES)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_WARNINGS)) {
    writeData(STORAGE_KEYS.GROUP_WARNINGS, DEFAULT_GROUP_WARNINGS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_BANS)) {
    writeData(STORAGE_KEYS.GROUP_BANS, DEFAULT_GROUP_BANS)
  }
  if (!localStorage.getItem(STORAGE_KEYS.MODERATION_ACTIONS)) {
    writeData(STORAGE_KEYS.MODERATION_ACTIONS, DEFAULT_MODERATION_ACTIONS)
  }
  // Don't auto-login users - they must login manually
}

// User operations
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  if (!userId) return null
  const users = getUsers()
  return users.find((u) => u.id === userId) || null
}

export function setCurrentUser(userId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId)
}

export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  const users = data ? (JSON.parse(data) as User[]) : []
  return users.map(normalizeUser)
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username === username)
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function areUsersBlocked(userIdA: string | null | undefined, userIdB: string | null | undefined): boolean {
  if (!userIdA || !userIdB || userIdA === userIdB) {
    return false
  }

  const userA = getUserById(userIdA)
  const userB = getUserById(userIdB)

  return Boolean(userA?.blockedUsers?.includes(userIdB) || userB?.blockedUsers?.includes(userIdA))
}

export function updateUser(userId: string, updates: Partial<User>) {
  if (typeof window === "undefined") return
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index !== -1) {
    const existingUser = users[index]
    const mergedUser = { ...existingUser, ...updates }

    // Sanitize location data to ensure privacy compliance
    // This ensures precise coordinates are never stored for non-public profiles
    const sanitizedUser = sanitizeLocationForStorage(mergedUser)

    users[index] = sanitizedUser as User
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  }
}

export function toggleFollow(followerId: string, followingId: string) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const followerIndex = users.findIndex((u) => u.id === followerId)
  const followingIndex = users.findIndex((u) => u.id === followingId)

  if (followerIndex === -1 || followingIndex === -1) return

  const follower = users[followerIndex]
  const following = users[followingIndex]

  // Check if blocked
  if (areUsersBlocked(followerId, followingId)) {
    return // Cannot follow if blocked
  }

  // Check if already following
  const isFollowing = follower.following.includes(followingId)

  if (isFollowing) {
    // Unfollow
    follower.following = follower.following.filter((id) => id !== followingId)
    following.followers = following.followers.filter((id) => id !== followerId)
  } else {
    // Follow
    follower.following.push(followingId)
    following.followers.push(followerId)
  }

  users[followerIndex] = follower
  users[followingIndex] = following

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function togglePetFollow(userId: string, petId: string) {
  if (typeof window === "undefined") return

  const users = getUsers()
  const pets = getPets()

  const userIndex = users.findIndex((u) => u.id === userId)
  const petIndex = pets.findIndex((p) => p.id === petId)

  if (userIndex === -1 || petIndex === -1) {
    return
  }

  const user = users[userIndex]
  const pet = pets[petIndex]
  const owner = getUserById(pet.ownerId)

  if (owner && areUsersBlocked(userId, owner.id)) {
    return
  }

  const followingPets = Array.isArray(user.followingPets)
    ? Array.from(new Set(user.followingPets.filter((id) => typeof id === "string" && id)))
    : []
  const petFollowers = Array.isArray(pet.followers)
    ? Array.from(new Set(pet.followers.filter((id) => typeof id === "string" && id)))
    : []

  const isFollowing = followingPets.includes(petId)
  const ownerPrivacyFallback = (owner?.privacy?.sections?.pets ?? owner?.privacy?.pets ?? "public") as PrivacyLevel
  const rawPrivacy = pet.privacy
  const interactionSetting: PrivacyLevel =
    rawPrivacy && typeof rawPrivacy === "object" && "interactions" in rawPrivacy
      ? (rawPrivacy.interactions as PrivacyLevel)
      : typeof rawPrivacy === "string"
        ? (rawPrivacy as PrivacyLevel)
        : ownerPrivacyFallback

  if (!isFollowing) {
    const isOwner = owner?.id === userId
    const ownerFollowers = owner?.followers ?? []
    const existingPetFollower = petFollowers.includes(userId)
    const interactionsAllowed =
      isOwner ||
      interactionSetting === "public" ||
      (interactionSetting === "followers-only" && (ownerFollowers.includes(userId) || existingPetFollower))

    if (!interactionsAllowed) {
      return
    }
  }

  if (isFollowing) {
    user.followingPets = followingPets.filter((id) => id !== petId)
    pet.followers = petFollowers.filter((id) => id !== userId)
  } else {
    user.followingPets = [...followingPets, petId]
    pet.followers = petFollowers.includes(userId) ? petFollowers : [...petFollowers, userId]
  }

  users[userIndex] = normalizeUser(user)
  pets[petIndex] = normalizePet(pet)

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
}

export function blockUser(userId: string, blockUserId: string) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return

  const user = users[userIndex]
  if (!user.blockedUsers) {
    user.blockedUsers = []
  }

  // Add to blocked list if not already blocked
  if (!user.blockedUsers.includes(blockUserId)) {
    user.blockedUsers.push(blockUserId)
  }

  // Unfollow both ways if they were following each other
  if (user.following.includes(blockUserId)) {
    user.following = user.following.filter((id) => id !== blockUserId)
    const blockedUserIndex = users.findIndex((u) => u.id === blockUserId)
    if (blockedUserIndex !== -1) {
      const blockedUser = users[blockedUserIndex]
      blockedUser.followers = blockedUser.followers.filter((id) => id !== userId)
      users[blockedUserIndex] = blockedUser
    }
  }

  if (user.followers.includes(blockUserId)) {
    user.followers = user.followers.filter((id) => id !== blockUserId)
    const blockedUserIndex = users.findIndex((u) => u.id === blockUserId)
    if (blockedUserIndex !== -1) {
      const blockedUser = users[blockedUserIndex]
      blockedUser.following = blockedUser.following.filter((id) => id !== userId)
      users[blockedUserIndex] = blockedUser
    }
  }

  users[userIndex] = normalizeUser(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))

  removeMutualInteractions(userId, blockUserId)
}

export function unblockUser(userId: string, unblockUserId: string) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return

  const user = users[userIndex]
  if (!user.blockedUsers) {
    user.blockedUsers = []
  }

  // Remove from blocked list
  user.blockedUsers = user.blockedUsers.filter((id) => id !== unblockUserId)

  users[userIndex] = normalizeUser(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function muteUser(userId: string, muteUserId: string) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return

  const user = users[userIndex]
  if (!user.mutedUsers) {
    user.mutedUsers = []
  }

  // Add to muted list if not already muted
  if (!user.mutedUsers.includes(muteUserId)) {
    user.mutedUsers.push(muteUserId)
  }

  users[userIndex] = normalizeUser(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function unmuteUser(userId: string, unmuteUserId: string) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return

  const user = users[userIndex]
  if (!user.mutedUsers) {
    user.mutedUsers = []
  }

  // Remove from muted list
  user.mutedUsers = user.mutedUsers.filter((id) => id !== unmuteUserId)

  users[userIndex] = normalizeUser(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function setCloseFriends(userId: string, closeFriendIds: string[]) {
  if (typeof window === "undefined") return
  const users = getUsers()

  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return

  const user = users[userIndex]
  // Ensure all IDs are unique and valid strings
  const uniqueIds = Array.from(new Set(closeFriendIds.filter((id) => typeof id === "string" && id)))
  user.closeFriends = uniqueIds

  users[userIndex] = normalizeUser(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function importContacts(
  userId: string,
  contacts: Array<{ email?: string; phone?: string; name?: string }>,
): {
  matchedUsers: User[]
  suggestions: Array<{ user: User; reason: string }>
} {
  if (typeof window === "undefined") {
    return { matchedUsers: [], suggestions: [] }
  }

  const users = getUsers()
  const currentUser = users.find((u) => u.id === userId)
  if (!currentUser) {
    return { matchedUsers: [], suggestions: [] }
  }

  const matchedUsers: User[] = []
  const suggestions: Array<{ user: User; reason: string }> = []

  // Normalize contact data for matching
  const normalizedContacts = contacts.map((contact) => ({
    email: contact.email?.toLowerCase().trim(),
    phone: contact.phone?.replace(/\D/g, ""), // Remove non-digits
    name: contact.name?.toLowerCase().trim(),
  }))

  for (const contact of normalizedContacts) {
    // Find users by email
    if (contact.email) {
      const matchedByEmail = users.find(
        (u) => u.email?.toLowerCase().trim() === contact.email && u.id !== userId,
      )
      if (matchedByEmail && !matchedUsers.find((u) => u.id === matchedByEmail.id)) {
        matchedUsers.push(matchedByEmail)
        suggestions.push({
          user: matchedByEmail,
          reason: contact.name
            ? `Found ${matchedByEmail.fullName} (${contact.name})`
            : `Found ${matchedByEmail.fullName}`,
        })
      }
    }

    // Find users by phone (if available in user data)
    if (contact.phone && contact.phone.length > 0) {
      const matchedByPhone = users.find(
        (u) =>
          u.phone &&
          u.phone.replace(/\D/g, "") === contact.phone &&
          u.id !== userId &&
          !matchedUsers.find((m) => m.id === u.id),
      )
      if (matchedByPhone) {
        matchedUsers.push(matchedByPhone)
        suggestions.push({
          user: matchedByPhone,
          reason: contact.name
            ? `Found ${matchedByPhone.fullName} (${contact.name})`
            : `Found ${matchedByPhone.fullName}`,
        })
      }
    }
  }

  // Filter out users already being followed or blocked
  const currentUserFollowing = new Set(currentUser.following ?? [])
  const currentUserBlocked = new Set(currentUser.blockedUsers ?? [])
  const currentUserMuted = new Set(currentUser.mutedUsers ?? [])

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !currentUserFollowing.has(s.user.id) &&
      !currentUserBlocked.has(s.user.id) &&
      !currentUserMuted.has(s.user.id) &&
      !s.user.blockedUsers?.includes(userId) &&
      !s.user.mutedUsers?.includes(userId),
  )

  return {
    matchedUsers: Array.from(new Set(matchedUsers.map((u) => u.id))).map((id) =>
      matchedUsers.find((u) => u.id === id)!,
    ),
    suggestions: filteredSuggestions,
  }
}

function removeMutualInteractions(userId: string, otherUserId: string) {
  if (typeof window === "undefined") return

  const posts = getBlogPosts()
  let postsModified = false

  const updatedPosts = posts.map((post) => {
    let changed = false

    if (post.authorId === userId || post.authorId === otherUserId) {
      const targetId = post.authorId === userId ? otherUserId : userId

      if (post.likes?.includes(targetId)) {
        post.likes = post.likes.filter((id) => id !== targetId)
        changed = true
      }

      if (post.reactions) {
        const reactions = { ...post.reactions }
        ;(Object.keys(reactions) as ReactionType[]).forEach((key) => {
          const beforeLength = reactions[key]?.length ?? 0
          reactions[key] = (reactions[key] ?? []).filter((id) => id !== targetId)
          if (!changed && reactions[key].length !== beforeLength) {
            changed = true
          }
        })
        if (changed) {
          post.reactions = reactions
        }
      }
    }

    if (changed) {
      postsModified = true
      return normalizeBlogPost(post)
    }

    return post
  })

  if (postsModified) {
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(updatedPosts))
  }

  const comments = getComments()
  if (comments.length === 0) {
    return
  }

  const postsById = new Map(updatedPosts.map((post) => [post.id, post]))
  const petsById = new Map(getPets().map((pet) => [pet.id, pet]))
  const wikiById = new Map(getWikiArticles().map((article) => [article.id, article]))

  const removedCommentIds = new Set<string>()
  let commentsModified = false

  const sanitizedComments = comments.map((comment) => {
    let shouldRemove = false

    if (comment.postId) {
      const parentPost = postsById.get(comment.postId)
      if (parentPost) {
        if (parentPost.authorId === userId && comment.userId === otherUserId) {
          shouldRemove = true
        } else if (parentPost.authorId === otherUserId && comment.userId === userId) {
          shouldRemove = true
        }
      }
    }

    if (!shouldRemove && comment.petPhotoId) {
      const [petId] = comment.petPhotoId.split(":")
      const pet = petId ? petsById.get(petId) : undefined
      if (pet) {
        if (pet.ownerId === userId && comment.userId === otherUserId) {
          shouldRemove = true
        } else if (pet.ownerId === otherUserId && comment.userId === userId) {
          shouldRemove = true
        }
      }
    }

    if (!shouldRemove && comment.wikiArticleId) {
      const article = wikiById.get(comment.wikiArticleId)
      if (article) {
        if (article.authorId === userId && comment.userId === otherUserId) {
          shouldRemove = true
        } else if (article.authorId === otherUserId && comment.userId === userId) {
          shouldRemove = true
        }
      }
    }

    if (shouldRemove) {
      removedCommentIds.add(comment.id)
      commentsModified = true
      return comment
    }

    if (comment.reactions) {
      const reactions = { ...comment.reactions }
      let reactionChanged = false
      ;(Object.keys(reactions) as ReactionType[]).forEach((key) => {
        const beforeLength = reactions[key]?.length ?? 0
        reactions[key] = (reactions[key] ?? []).filter((id) => id !== userId && id !== otherUserId)
        if (reactions[key].length !== beforeLength) {
          reactionChanged = true
        }
      })
      if (reactionChanged) {
        commentsModified = true
        return normalizeComment({ ...comment, reactions })
      }
    }

    return comment
  })

  const filteredComments = sanitizedComments.filter((comment) => {
    if (removedCommentIds.has(comment.id)) {
      return false
    }
    if (comment.parentCommentId && removedCommentIds.has(comment.parentCommentId)) {
      commentsModified = true
      return false
    }
    return true
  })

  if (commentsModified) {
    const normalizedComments = filteredComments.map((comment) => normalizeComment(comment))
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(normalizedComments))
  }
}

// Conversation operations ----------------------------------------------------

function sortUniqueParticipantIds(participantIds: string[]): string[] {
  return Array.from(new Set(participantIds)).sort()
}

function conversationsMatchParticipants(conversation: Conversation, participantIds: string[]): boolean {
  const normalizedExisting = sortUniqueParticipantIds(conversation.participantIds)
  const normalizedIncoming = sortUniqueParticipantIds(participantIds)
  if (normalizedExisting.length !== normalizedIncoming.length) return false
  return normalizedExisting.every((id, index) => id === normalizedIncoming[index])
}

function saveConversations(conversations: Conversation[]) {
  writeData(STORAGE_KEYS.CONVERSATIONS, conversations)
}

function getAllDirectMessages(): DirectMessage[] {
  return readData(STORAGE_KEYS.DIRECT_MESSAGES, DEFAULT_DIRECT_MESSAGES)
}

function saveAllDirectMessages(messages: DirectMessage[]) {
  writeData(STORAGE_KEYS.DIRECT_MESSAGES, messages)
}

export function getConversations(): Conversation[] {
  return readData(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS)
}

export function getConversationById(conversationId: string): Conversation | undefined {
  return getConversations().find((conversation) => conversation.id === conversationId)
}

export function getConversationByParticipants(participantIds: string[]): Conversation | undefined {
  return getConversations().find((conversation) => conversationsMatchParticipants(conversation, participantIds))
}

export function getConversationsForUser(
  userId: string,
  options: { includeArchived?: boolean; archivedOnly?: boolean } = {},
): Conversation[] {
  const conversations = getConversations()
    .filter((conversation) => conversation.participantIds.includes(userId))
    .filter((conversation) => {
      if (options.archivedOnly) {
        return conversation.isArchived === true
      }
      if (options.includeArchived) {
        return true
      }
      return conversation.isArchived !== true
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return conversations
}

export function getArchivedConversationsForUser(userId: string): Conversation[] {
  return getConversationsForUser(userId, { archivedOnly: true })
}

export function setConversationArchiveState(conversationId: string, archived: boolean): Conversation | undefined {
  return updateConversation(conversationId, {
    isArchived: archived,
  })
}

export function createConversation(participantIds: string[]): Conversation {
  const normalizedParticipants = sortUniqueParticipantIds(participantIds)
  if (normalizedParticipants.length < 2) {
    throw new Error("Conversation requires at least two participants")
  }

  const existingConversation = getConversationByParticipants(normalizedParticipants)
  if (existingConversation) {
    return existingConversation
  }

  const now = new Date().toISOString()
  const conversation: Conversation = {
    id: generateStorageId("conversation"),
    participantIds: normalizedParticipants,
    createdAt: now,
    updatedAt: now,
  }

  const conversations = getConversations()
  saveConversations([...conversations, conversation])
  return conversation
}

export function updateConversation(conversationId: string, updates: Partial<Conversation>): Conversation | undefined {
  const conversations = getConversations()
  const index = conversations.findIndex((conversation) => conversation.id === conversationId)
  if (index === -1) return undefined

  const nextParticipantIds =
    updates.participantIds !== undefined
      ? sortUniqueParticipantIds(updates.participantIds)
      : conversations[index].participantIds

  const updatedConversation: Conversation = {
    ...conversations[index],
    ...updates,
    participantIds: nextParticipantIds,
  }

  const updatedList = [...conversations]
  updatedList[index] = updatedConversation
  saveConversations(updatedList)
  return updatedConversation
}

// Direct message operations --------------------------------------------------

export function getDirectMessages(): DirectMessage[] {
  return getAllDirectMessages()
}

export function getMessagesByConversationId(conversationId: string): DirectMessage[] {
  return getAllDirectMessages()
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function addMessageToConversation(message: DirectMessage): DirectMessage {
  const messages = getAllDirectMessages()
  saveAllDirectMessages([...messages, message])

  const conversation = getConversationById(message.conversationId)
  let unreadCounts: Record<string, number> | undefined = conversation?.unreadCounts
    ? { ...conversation.unreadCounts }
    : undefined

  if (conversation) {
    unreadCounts = conversation.participantIds.reduce<Record<string, number>>((acc, participantId) => {
      const previous = unreadCounts?.[participantId] ?? 0
      acc[participantId] = participantId === message.senderId ? 0 : previous + 1
      return acc
    }, {})
  }

  updateConversation(message.conversationId, {
    updatedAt: message.createdAt,
    lastMessageId: message.id,
    snippet: message.content,
    unreadCounts,
  })

  if (conversation) {
    const recipients = conversation.participantIds.filter((id) => id !== message.senderId)
    if (recipients.length > 0) {
      const sender = getUserById(message.senderId)
      const senderName = sender?.fullName || sender?.username || "Someone"
      const normalizedContent = message.content.replace(/\s+/g, " ").trim()
      const preview =
        normalizedContent.length > 80 ? `${normalizedContent.slice(0, 77).trimEnd()}…` : normalizedContent
      const baseMessage = `${senderName} sent you a new message`
      const notificationMessage = preview ? `${baseMessage}: "${preview}"` : baseMessage

      recipients.forEach((recipientId) => {
        addNotification({
          id: `notif_${Date.now()}_${Math.random()}`,
          userId: recipientId,
          type: "message",
          actorId: message.senderId,
          targetId: message.senderId,
          targetType: "user",
          message: notificationMessage,
          read: false,
          createdAt: message.createdAt,
        })
      })
    }
  }

  return message
}

export function replaceMessagesForConversation(
  conversationId: string,
  messages: DirectMessage[],
): DirectMessage[] {
  const remaining = getAllDirectMessages().filter((message) => message.conversationId !== conversationId)
  const normalizedMessages = messages.map((message) => ({
    ...message,
    conversationId,
  }))
  saveAllDirectMessages([...remaining, ...normalizedMessages])
  return normalizedMessages
}

export function markConversationMessagesRead(
  conversationId: string,
  userId: string,
  readAt?: string,
): DirectMessage[] {
  const timestamp = readAt || new Date().toISOString()
  let hasChanges = false

  const updatedMessages = getAllDirectMessages().map((message) => {
    if (message.conversationId !== conversationId) {
      return message
    }

    const currentReadAt = message.readAt || {}
    if (currentReadAt[userId]) {
      return message
    }

    hasChanges = true
    return {
      ...message,
      readAt: {
        ...currentReadAt,
        [userId]: timestamp,
      },
    }
  })

  if (hasChanges) {
    saveAllDirectMessages(updatedMessages)
  }

  const conversation = getConversationById(conversationId)
  if (conversation?.unreadCounts && conversation.unreadCounts[userId]) {
    updateConversation(conversationId, {
      unreadCounts: {
        ...conversation.unreadCounts,
        [userId]: 0,
      },
    })
  }

  return updatedMessages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function searchMessagesForUser(
  userId: string,
  query: string,
  options: { includeArchived?: boolean } = { includeArchived: true },
): MessageSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  const conversations = getConversationsForUser(userId, {
    includeArchived: options.includeArchived ?? true,
  })
  if (conversations.length === 0) return []

  const conversationIds = new Set(conversations.map((conversation) => conversation.id))

  return getAllDirectMessages()
    .filter((message) => conversationIds.has(message.conversationId))
    .filter((message) => message.content.toLowerCase().includes(normalizedQuery))
    .map<MessageSearchResult>((message) => ({
      conversationId: message.conversationId,
      messageId: message.id,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Friend request operations --------------------------------------------------

interface FriendRequestActionResult {
  success: boolean
  error?: string
  request?: FriendRequest
  autoAccepted?: boolean
}

interface FriendshipActionResult {
  success: boolean
  error?: string
}

function saveFriendRequests(requests: FriendRequest[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(requests))
}

export function getFriendRequests(): FriendRequest[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)
  return data ? (JSON.parse(data) as FriendRequest[]) : []
}

export function getFriendRequestsForPet(petId: string): FriendRequest[] {
  return getFriendRequests().filter((request) => request.senderPetId === petId || request.receiverPetId === petId)
}

export function getFriendRequestBetweenPets(petAId: string, petBId: string): FriendRequest | undefined {
  const relatedRequests = getFriendRequests()
    .filter(
      (request) =>
        (request.senderPetId === petAId && request.receiverPetId === petBId) ||
        (request.senderPetId === petBId && request.receiverPetId === petAId),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return relatedRequests[0]
}

function ensurePetFriendsList(pet: Pet): string[] {
  if (Array.isArray(pet.friends)) {
    return pet.friends
  }
  return []
}

export function sendFriendRequest(senderPetId: string, receiverPetId: string): FriendRequestActionResult {
  if (typeof window === "undefined") {
    return { success: false, error: "Friend requests are only available in the browser" }
  }

  if (senderPetId === receiverPetId) {
    return { success: false, error: "A pet cannot send a friend request to itself" }
  }

  const senderPet = getPetById(senderPetId)
  const receiverPet = getPetById(receiverPetId)

  if (!senderPet || !receiverPet) {
    return { success: false, error: "One of the pets could not be found" }
  }

  const senderFriends = ensurePetFriendsList(senderPet)
  if (senderFriends.includes(receiverPetId)) {
    return { success: false, error: `${receiverPet.name} is already a friend` }
  }

  const allRequests = getFriendRequests()
  const existingPending = allRequests.find(
    (request) =>
      request.senderPetId === senderPetId &&
      request.receiverPetId === receiverPetId &&
      request.status === "pending",
  )

  if (existingPending) {
    return { success: false, error: "Friend request already pending" }
  }

  const reversePending = allRequests.find(
    (request) =>
      request.senderPetId === receiverPetId &&
      request.receiverPetId === senderPetId &&
      request.status === "pending",
  )

  if (reversePending) {
    const acceptResult = acceptFriendRequest(reversePending.id, senderPetId)
    if (!acceptResult.success) {
      return acceptResult
    }
    return { ...acceptResult, autoAccepted: true }
  }

  const newRequest: FriendRequest = {
    id: generateStorageId("friend_request"),
    senderPetId,
    receiverPetId,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  saveFriendRequests([newRequest, ...allRequests])

  return { success: true, request: newRequest }
}

export function acceptFriendRequest(requestId: string, actingPetId: string): FriendRequestActionResult {
  if (typeof window === "undefined") {
    return { success: false, error: "Friend requests are only available in the browser" }
  }

  const requests = getFriendRequests()
  const requestIndex = requests.findIndex((request) => request.id === requestId)

  if (requestIndex === -1) {
    return { success: false, error: "Friend request not found" }
  }

  const request = requests[requestIndex]

  if (request.status !== "pending") {
    return { success: false, error: "Friend request already handled" }
  }

  if (request.receiverPetId !== actingPetId) {
    return { success: false, error: "Only the recipient pet can accept this friend request" }
  }

  const senderPet = getPetById(request.senderPetId)
  const receiverPet = getPetById(request.receiverPetId)

  if (!senderPet || !receiverPet) {
    return { success: false, error: "One of the pets could not be found" }
  }

  const updatedRequest: FriendRequest = {
    ...request,
    status: "accepted",
    updatedAt: new Date().toISOString(),
  }

  requests[requestIndex] = updatedRequest
  saveFriendRequests(requests)

  const updatedSender: Pet = {
    ...senderPet,
    friends: Array.from(new Set([...ensurePetFriendsList(senderPet), receiverPet.id])),
  }

  const updatedReceiver: Pet = {
    ...receiverPet,
    friends: Array.from(new Set([...ensurePetFriendsList(receiverPet), senderPet.id])),
  }

  updatePet(updatedSender)
  updatePet(updatedReceiver)

  return { success: true, request: updatedRequest }
}

export function declineFriendRequest(requestId: string, actingPetId: string): FriendRequestActionResult {
  if (typeof window === "undefined") {
    return { success: false, error: "Friend requests are only available in the browser" }
  }

  const requests = getFriendRequests()
  const requestIndex = requests.findIndex((request) => request.id === requestId)

  if (requestIndex === -1) {
    return { success: false, error: "Friend request not found" }
  }

  const request = requests[requestIndex]

  if (request.status !== "pending") {
    return { success: false, error: "Friend request already handled" }
  }

  if (request.receiverPetId !== actingPetId) {
    return { success: false, error: "Only the recipient pet can decline this friend request" }
  }

  const updatedRequest: FriendRequest = {
    ...request,
    status: "declined",
    updatedAt: new Date().toISOString(),
  }

  requests[requestIndex] = updatedRequest
  saveFriendRequests(requests)

  return { success: true, request: updatedRequest }
}

export function cancelFriendRequest(requestId: string, actingPetId: string): FriendRequestActionResult {
  if (typeof window === "undefined") {
    return { success: false, error: "Friend requests are only available in the browser" }
  }

  const requests = getFriendRequests()
  const requestIndex = requests.findIndex((request) => request.id === requestId)

  if (requestIndex === -1) {
    return { success: false, error: "Friend request not found" }
  }

  const request = requests[requestIndex]

  if (request.status !== "pending") {
    return { success: false, error: "Friend request already handled" }
  }

  if (request.senderPetId !== actingPetId) {
    return { success: false, error: "Only the sending pet can cancel this friend request" }
  }

  const updatedRequest: FriendRequest = {
    ...request,
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  }

  requests[requestIndex] = updatedRequest
  saveFriendRequests(requests)

  return { success: true, request: updatedRequest }
}

export function removePetFriendship(petId: string, friendPetId: string): FriendshipActionResult {
  if (typeof window === "undefined") {
    return { success: false, error: "Friendships can only be managed in the browser" }
  }

  if (petId === friendPetId) {
    return { success: false, error: "A pet cannot unfriend itself" }
  }

  const pet = getPetById(petId)
  const friend = getPetById(friendPetId)

  if (!pet || !friend) {
    return { success: false, error: "One of the pets could not be found" }
  }

  const petFriends = ensurePetFriendsList(pet)
  const friendFriends = ensurePetFriendsList(friend)

  const hadFriendship = petFriends.includes(friendPetId) || friendFriends.includes(petId)

  if (!hadFriendship) {
    return { success: false, error: "These pets are not currently friends" }
  }

  const updatedPet: Pet = {
    ...pet,
    friends: petFriends.filter((id) => id !== friendPetId),
  }

  const updatedFriend: Pet = {
    ...friend,
    friends: friendFriends.filter((id) => id !== petId),
  }

  updatePet(updatedPet)
  updatePet(updatedFriend)

  return { success: true }
}

// Blog post helpers ---------------------------------------------------------

const DEFAULT_REACTIONS: Record<ReactionType, string[]> = {
  like: [],
  love: [],
  laugh: [],
  wow: [],
  sad: [],
  angry: [],
}

const COMMENT_FLAG_THRESHOLD = 3

function normalizeReactions(
  reactions: Partial<Record<ReactionType, string[]>> | undefined,
): Record<ReactionType, string[]> {
  const normalized = { ...DEFAULT_REACTIONS }

  if (!reactions) {
    return normalized
  }

  ;(Object.keys(normalized) as ReactionType[]).forEach((reaction) => {
    const entries = reactions[reaction]
    normalized[reaction] = Array.isArray(entries) ? entries : []
  })

  return normalized
}

function normalizeComment(comment: Comment): Comment {
  const status: CommentStatus = comment.status ?? "published"

  const normalized: Comment = {
    ...comment,
    format: comment.format ?? "markdown",
    status,
    reactions: normalizeReactions(comment.reactions),
    flags: Array.isArray(comment.flags)
      ? comment.flags.filter((flag): flag is CommentFlag => Boolean(flag?.userId))
      : [],
  }

  if (normalized.moderation) {
    normalized.moderation = {
      ...normalized.moderation,
      status: normalized.moderation.status ?? status,
      updatedAt: normalized.moderation.updatedAt ?? normalized.updatedAt ?? normalized.createdAt,
      updatedBy: normalized.moderation.updatedBy ?? normalized.userId,
    }
  }

  return normalized
}

function normalizeMedia(media: BlogPost["media"] | undefined): BlogPostMedia {
  const normalizeUrls = (items: unknown): string[] => {
    if (!Array.isArray(items)) return []
    return items
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      .map((url) => url.trim())
  }

  const normalizeLinks = (items: unknown): BlogPostMedia["links"] => {
    if (!Array.isArray(items)) return []
    return items
      .map((item) => {
        if (!item || typeof item !== "object" || !("url" in item)) {
          return null
        }

        const rawUrl = typeof (item as { url?: unknown }).url === "string" ? (item as { url: string }).url.trim() : ""
        if (!rawUrl) {
          return null
        }

        const rawTitle = typeof (item as { title?: unknown }).title === "string" ? (item as { title: string }).title.trim() : undefined

        return rawTitle && rawTitle.length > 0
          ? { url: rawUrl, title: rawTitle }
          : { url: rawUrl }
      })
      .filter((link): link is BlogPostMedia["links"][number] => link !== null)
  }

  return {
    images: normalizeUrls(media?.images),
    videos: normalizeUrls(media?.videos),
    links: normalizeLinks(media?.links),
  }
}

function normalizeBlogPost(post: Partial<BlogPost>): BlogPost {
  const createdAt = post.createdAt ?? new Date().toISOString()
  const legacyCategory = (post as Record<string, unknown>)?.category

  return {
    ...post, // Preserve all fields first
    id: post.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())),
    petId: post.petId ?? "",
    authorId: post.authorId ?? "",
    title: post.title ?? "",
    content: post.content ?? "",
    coverImage: post.coverImage,
    tags: Array.isArray(post.tags) ? post.tags : [],
    categories: normalizeCategoryList(post.categories ?? legacyCategory ?? []),
    likes: Array.isArray(post.likes) ? post.likes : [],
    createdAt,
    updatedAt: post.updatedAt ?? createdAt,
    privacy: post.privacy,
    reactions: normalizeReactions(post.reactions),
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    isDraft: post.isDraft ?? false,
    isPromoted: post.isPromoted ?? false,
    promotedUntil: post.promotedUntil,
    promotionStatus: post.promotionStatus,
    promotionBudget: post.promotionBudget,
    media: normalizeMedia(post.media),
    reports: Array.isArray(post.reports) ? post.reports : (post.reports || []),
    coiFlags: Array.isArray(post.coiFlags) ? post.coiFlags : (post.coiFlags || []),
  }
}

// Pet operations
export function getPets(): Pet[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PETS)
  const pets = data ? (JSON.parse(data) as Pet[]) : []
  return pets.map(normalizePet)
}

export function getPetById(id: string): Pet | undefined {
  return getPets().find((p) => p.id === id)
}

export function getPetsByOwnerId(ownerId: string): Pet[] {
  return getPets().filter((p) => p.ownerId === ownerId)
}

export function getPetByUsernameAndSlug(username: string, slug: string): Pet | undefined {
  const users = getUsers()
  const owner = users.find((u) => u.username === username)
  if (!owner) return undefined
  
  const pets = getPets()
  return pets.find((p) => p.ownerId === owner.id && (p.slug === slug || !p.slug && p.id === slug))
}

export function getPetSocialCircle(petId: string): PetSocialCircle {
  const pet = getPetById(petId)
  const circle = normalizeSocialCircle(pet?.socialCircle)
  return circle ?? createEmptySocialCircle()
}

export function updatePetSocialCircle(petId: string, updates: Partial<PetSocialCircle>) {
  if (typeof window === "undefined") return

  const pets = getPets()
  const index = pets.findIndex((p) => p.id === petId)

  if (index === -1) return

  const existingCircle = normalizeSocialCircle(pets[index].socialCircle) ?? createEmptySocialCircle()

  const merged: PetSocialCircle = {
    overview: updates.overview ?? existingCircle.overview,
    relationships: updates.relationships ?? existingCircle.relationships,
    playdates: updates.playdates ?? existingCircle.playdates,
    invites: updates.invites ?? existingCircle.invites,
    highlights: updates.highlights ?? existingCircle.highlights,
  }

  pets[index] = {
    ...pets[index],
    socialCircle: merged,
  }

  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
}

function persistPets(pets: Pet[]) {
  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets.map(normalizePet)))
}

export function updatePet(pet: Pet) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === pet.id)
  if (index !== -1) {
    pets[index] = normalizePet({ ...pets[index], ...pet })
    persistPets(pets)
  }
}

export function deletePet(petId: string) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const filteredPets = pets.filter((p) => p.id !== petId)
  persistPets(filteredPets)
}

export function addPet(pet: Pet) {
  if (typeof window === "undefined") return
  const pets = getPets()
  // Generate slug if not provided
  const petWithSlug = pet.slug ? pet : { ...pet, slug: generatePetSlug(pet.name) }
  pets.push(normalizePet(petWithSlug))
  persistPets(pets)

  // Award points for adding a pet
  if (typeof window !== "undefined") {
    import("./points-integration").then(({ awardPointsToUser }) => {
      awardPointsToUser(pet.ownerId, "pet_add")
    })
  }
}

export function addFriendCategory(petId: string, category: FriendCategory) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === petId)
  if (index === -1) return

  const pet = { ...pets[index] }
  const categories = [...(pet.friendCategories ?? [])]
  categories.push(category)
  pet.friendCategories = categories
  pet.friendCategoryAssignments = { ...(pet.friendCategoryAssignments ?? {}) }
  pets[index] = pet
  persistPets(pets)
}

export function updateFriendCategory(petId: string, categoryId: string, updates: Partial<FriendCategory>) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === petId)
  if (index === -1) return

  const pet = { ...pets[index] }
  const categories = [...(pet.friendCategories ?? [])]
  const categoryIndex = categories.findIndex((category) => category.id === categoryId)
  if (categoryIndex === -1) return

  categories[categoryIndex] = { ...categories[categoryIndex], ...updates }
  pet.friendCategories = categories
  pets[index] = pet
  persistPets(pets)
}

export function deleteFriendCategory(petId: string, categoryId: string) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === petId)
  if (index === -1) return

  const pet = { ...pets[index] }
  const categories = (pet.friendCategories ?? []).filter((category) => category.id !== categoryId)
  const assignments = { ...(pet.friendCategoryAssignments ?? {}) }

  Object.keys(assignments).forEach((friendId) => {
    if (assignments[friendId] === categoryId) {
      delete assignments[friendId]
    }
  })

  pet.friendCategories = categories
  pet.friendCategoryAssignments = assignments
  pets[index] = pet
  persistPets(pets)
}

export function assignFriendToCategory(petId: string, friendId: string, categoryId: string | null) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === petId)
  if (index === -1) return

  const pet = { ...pets[index] }
  const assignments = { ...(pet.friendCategoryAssignments ?? {}) }

  if (categoryId) {
    const hasCategory =
      (pet.friendCategories ?? []).some((category) => category.id === categoryId) &&
      (pet.friends ?? []).includes(friendId)
    if (!hasCategory) return
    assignments[friendId] = categoryId
  } else {
    delete assignments[friendId]
  }

  pet.friendCategoryAssignments = assignments
  pets[index] = pet
  persistPets(pets)
}

// Blog post operations
export function getBlogPosts(): BlogPost[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)
  const posts = (data ? JSON.parse(data) : []) as Partial<BlogPost>[]
  return posts.map(normalizeBlogPost)
}

export function getBlogPostById(id: string): BlogPost | undefined {
  return getBlogPosts().find((p) => p.id === id)
}

export function getBlogPostsByPetId(petId: string): BlogPost[] {
  return getBlogPosts().filter((p) => p.petId === petId)
}

export function addBlogPost(post: BlogPost) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  posts.unshift(normalizeBlogPost(post))
  localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
}

export function updateBlogPost(post: BlogPost) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const index = posts.findIndex((p) => p.id === post.id)
  if (index !== -1) {
    const oldPost = posts[index]
    const updatedPost = normalizeBlogPost({ ...posts[index], ...post })
    
    // If disclosure is missing, mark post for moderation review
    if (updatedPost.brandAffiliation?.disclosureMissing) {
      // The status can be checked by moderators via the brandAffiliation.disclosureMissing flag
    }
    
    posts[index] = updatedPost
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
    
    // Notify watchers of the update
    const user = getUserById(post.authorId)
    const authorName = user?.fullName || "Unknown Author"
    notifyWatchers(
      post.id,
      "post",
      "update",
      post.authorId,
      authorName,
      post.title,
      { contentChanged: oldPost.content !== post.content }
    )
  }
}

export function deleteBlogPost(postId: string) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const filteredPosts = posts.filter((p) => p.id !== postId)
  localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(filteredPosts))
}

export function togglePostReaction(postId: string, userId: string, reactionType: string) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const index = posts.findIndex((p) => p.id === postId)
  if (index !== -1) {
    if (areUsersBlocked(userId, posts[index].authorId)) {
      return
    }

    if (!posts[index].reactions) {
      posts[index].reactions = normalizeReactions(undefined)
    }
    const reactions = posts[index].reactions!
    const reactionArray = reactions[reactionType as keyof typeof reactions] || []
    const hasReacted = reactionArray.includes(userId)
    
    if (hasReacted) {
      // Remove reaction
      reactions[reactionType as keyof typeof reactions] = reactionArray.filter((id) => id !== userId)
    } else {
      // Remove from other reactions first (user can only have one reaction)
      Object.keys(reactions).forEach((key) => {
        if (key !== reactionType) {
          reactions[key as keyof typeof reactions] = reactions[key as keyof typeof reactions].filter(
            (id) => id !== userId
          )
        }
      })
      // Add reaction
      reactions[reactionType as keyof typeof reactions] = [...reactionArray, userId]

      // Award points for liking a post
      if (reactionType === "like" && typeof window !== "undefined") {
        import("./points-integration").then(({ awardPointsToUser }) => {
          awardPointsToUser(userId, "post_like")
        })
      }
    }
    posts[index] = normalizeBlogPost(posts[index])
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
  }
}

// ---------------------------------------------------------------------------
// Group category operations
// ---------------------------------------------------------------------------

export function getGroupCategories(): GroupCategory[] {
  return readData(STORAGE_KEYS.GROUP_CATEGORIES, DEFAULT_GROUP_CATEGORIES)
}

export function getGroupCategoryById(id: string): GroupCategory | undefined {
  return getGroupCategories().find((category) => category.id === id)
}

export function getGroupCategoryBySlug(slug: string): GroupCategory | undefined {
  return getGroupCategories().find((category) => category.slug === slug)
}

// ---------------------------------------------------------------------------
// Group operations
// ---------------------------------------------------------------------------

function getAllGroups(): Group[] {
  return readData(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS).map((group) => normalizeGroup(group))
}

function setGroups(groups: Group[]): void {
  writeData(STORAGE_KEYS.GROUPS, groups.map((group) => normalizeGroup(group)))
}

function refreshGroupMemberCount(groupId: string): void {
  const groups = getAllGroups()
  const index = groups.findIndex((group) => group.id === groupId)
  if (index === -1) return
  const members = getGroupMembersByGroupId(groupId)
  groups[index] = {
    ...groups[index],
    memberCount: members.length,
    updatedAt: new Date().toISOString(),
  }
  setGroups(groups)
}

function refreshGroupTopicCount(groupId: string): void {
  const groups = getAllGroups()
  const index = groups.findIndex((group) => group.id === groupId)
  if (index === -1) return
  const topics = getGroupTopicsByGroupId(groupId).filter((topic) => !topic.parentTopicId)
  groups[index] = {
    ...groups[index],
    topicCount: topics.length,
    updatedAt: new Date().toISOString(),
  }
  setGroups(groups)
}

export function getGroups(): Group[] {
  return getAllGroups()
}

export function getGroupById(id: string): Group | undefined {
  return getAllGroups().find((group) => group.id === id)
}

export function getGroupBySlug(slug: string): Group | undefined {
  return getAllGroups().find((group) => group.slug === slug)
}

export function getGroupsByCategory(categoryId: string): Group[] {
  return getAllGroups().filter((group) => group.categoryId === categoryId)
}

export function searchGroups(query: string): Group[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return getAllGroups()
  return getAllGroups().filter((group) => {
    const nameMatch = group.name.toLowerCase().includes(normalized)
    const descriptionMatch = group.description.toLowerCase().includes(normalized)
    const tagMatch = group.tags?.some((tag) => tag.toLowerCase().includes(normalized))
    return nameMatch || descriptionMatch || Boolean(tagMatch)
  })
}

export function addGroup(group: Group): void {
  const groups = getAllGroups()
  groups.push(normalizeGroup(group))
  setGroups(groups)
}

export function updateGroup(groupId: string, updatedGroup: Group): void {
  const groups = getAllGroups()
  const index = groups.findIndex((group) => group.id === groupId)
  if (index === -1) return
  const mergedGroup = { ...groups[index], ...updatedGroup, id: groupId }
  groups[index] = normalizeGroup(mergedGroup)
  setGroups(groups)
}

export function deleteGroup(groupId: string): void {
  const groups = getAllGroups().filter((group) => group.id !== groupId)
  setGroups(groups)
  const members = getAllGroupMembers().filter((member) => member.groupId !== groupId)
  setAllGroupMembers(members)
  const topics = getAllGroupTopics().filter((topic) => topic.groupId !== groupId)
  setAllGroupTopics(topics)
  const polls = getAllGroupPolls().filter((poll) => poll.groupId !== groupId)
  setAllGroupPolls(polls)
  const events = getAllGroupEvents().filter((event) => event.groupId !== groupId)
  setAllGroupEvents(events)
  const resources = getAllGroupResources().filter((resource) => resource.groupId !== groupId)
  setAllGroupResources(resources)
  const activities = getAllGroupActivities().filter((activity) => activity.groupId !== groupId)
  setAllGroupActivities(activities)
  const warnings = getAllGroupWarnings().filter((warning) => warning.groupId !== groupId)
  setAllGroupWarnings(warnings)
  const bans = getAllGroupBans().filter((ban) => ban.groupId !== groupId)
  setAllGroupBans(bans)
  const moderationLog = getAllModerationActions().filter((action) => action.groupId !== groupId)
  setAllModerationActions(moderationLog)
}

// ---------------------------------------------------------------------------
// Group membership operations
// ---------------------------------------------------------------------------

function getAllGroupMembers(): GroupMember[] {
  return readData(STORAGE_KEYS.GROUP_MEMBERS, DEFAULT_GROUP_MEMBERS)
}

function setAllGroupMembers(members: GroupMember[]): void {
  writeData(STORAGE_KEYS.GROUP_MEMBERS, members)
}

export function getGroupMembers(): GroupMember[] {
  return getAllGroupMembers()
}

export function getAllGroupMembersPublic(): GroupMember[] {
  return getAllGroupMembers()
}

export function getGroupMembersByGroupId(groupId: string): GroupMember[] {
  return getAllGroupMembers().filter((member) => member.groupId === groupId)
}

export function getGroupMember(groupId: string, userId: string): GroupMember | undefined {
  return getAllGroupMembers().find(
    (member) => member.groupId === groupId && member.userId === userId,
  )
}

export function addGroupMember(member: GroupMember): void {
  const members = getAllGroupMembers()
  const exists = members.some(
    (current) => current.groupId === member.groupId && current.userId === member.userId,
  )
  if (exists) return
  members.push(member)
  setAllGroupMembers(members)
  refreshGroupMemberCount(member.groupId)
}

export function updateGroupMember(memberId: string, updates: Partial<GroupMember>): void {
  const members = getAllGroupMembers()
  const index = members.findIndex((member) => member.id === memberId)
  if (index === -1) return
  members[index] = { ...members[index], ...updates }
  setAllGroupMembers(members)
}

export function removeGroupMember(groupId: string, userId: string): void {
  const members = getAllGroupMembers().filter(
    (member) => !(member.groupId === groupId && member.userId === userId),
  )
  setAllGroupMembers(members)
  refreshGroupMemberCount(groupId)
}

export function isUserMemberOfGroup(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  if (isUserBannedFromGroup(groupId, userId)) return false
  return member.status !== "banned"
}

export function getUserRoleInGroup(groupId: string, userId: string): GroupMember["role"] | null {
  const member = getGroupMember(groupId, userId)
  return member?.role ?? null
}

function getMemberPermissions(groupId: string, userId: string) {
  const member = getGroupMember(groupId, userId)
  return member?.permissions ?? {}
}

// ---------------------------------------------------------------------------
// Group permission helpers
// ---------------------------------------------------------------------------

export function canUserViewGroup(groupId: string, userId?: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false
  if (group.type === "secret") {
    if (!userId) return false
    return isUserMemberOfGroup(groupId, userId)
  }
  if (!userId) {
    return group.type === "open"
  }
  if (isUserBannedFromGroup(groupId, userId)) {
    return false
  }
  return true
}

export function canUserModerate(groupId: string, userId: string): boolean {
  const role = getUserRoleInGroup(groupId, userId)
  if (!role) return false
  if (role === "owner" || role === "admin" || role === "moderator") return true
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canModerate)
}

export function canUserManageMembers(groupId: string, userId: string): boolean {
  const role = getUserRoleInGroup(groupId, userId)
  if (!role) return false
  if (role === "owner" || role === "admin") return true
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canManageMembers)
}

export function canUserManageSettings(groupId: string, userId: string): boolean {
  const role = getUserRoleInGroup(groupId, userId)
  if (!role) return false
  if (role === "owner" || role === "admin") return true
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canManageSettings)
}

export function getGroupVisibilitySettingsById(groupId: string): GroupVisibilitySettings {
  const group = getGroupById(groupId)
  if (!group) {
    return getDefaultGroupVisibility("open")
  }
  return normalizeGroupVisibility(group)
}

function hasGroupMemberAccess(groupId: string, userId: string): boolean {
  if (isUserBannedFromGroup(groupId, userId)) {
    return false
  }
  return isUserMemberOfGroup(groupId, userId)
}

export function canUserDiscoverGroup(groupId: string, userId?: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  if (group.type === "secret") {
    if (!userId) return false
    return hasGroupMemberAccess(groupId, userId)
  }

  const visibility = normalizeGroupVisibility(group)

  if (visibility.discoverable) {
    if (userId && isUserBannedFromGroup(groupId, userId)) {
      return false
    }
    return true
  }

  if (!userId) {
    return false
  }

  if (!hasGroupMemberAccess(groupId, userId) && !canUserModerate(groupId, userId)) {
    return false
  }

  return true
}

export function canUserViewGroupContent(groupId: string, userId?: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false

  if (group.type === "secret") {
    if (!userId) return false
    return hasGroupMemberAccess(groupId, userId)
  }

  const visibility = normalizeGroupVisibility(group)

  if (visibility.content === "everyone") {
    if (userId && isUserBannedFromGroup(groupId, userId)) {
      return false
    }
    return true
  }

  if (!userId) {
    return false
  }

  return hasGroupMemberAccess(groupId, userId)
}

export function canUserCreateTopic(groupId: string, userId: string): boolean {
  if (!isUserMemberOfGroup(groupId, userId)) return false
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canCreateTopic ?? permissions.canPost)
}

export function canUserCreatePoll(groupId: string, userId: string): boolean {
  if (!isUserMemberOfGroup(groupId, userId)) return false
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canCreatePoll)
}

export function canUserCreateEvent(groupId: string, userId: string): boolean {
  if (!isUserMemberOfGroup(groupId, userId)) return false
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canCreateEvent)
}

export function canUserPost(groupId: string, userId: string): boolean {
  if (!isUserMemberOfGroup(groupId, userId)) return false
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canPost ?? permissions.canCreateTopic)
}

export function canUserComment(groupId: string, userId: string): boolean {
  if (!isUserMemberOfGroup(groupId, userId)) return false
  const permissions = getMemberPermissions(groupId, userId)
  return Boolean(permissions.canComment ?? permissions.canPost ?? permissions.canCreateTopic)
}

// ---------------------------------------------------------------------------
// Group topic operations
// ---------------------------------------------------------------------------

function normalizeGroupTopic(topic: GroupTopic): GroupTopic {
  const normalizedTags = Array.isArray(topic.tags)
    ? Array.from(
        topic.tags
          .reduce((map, tag) => {
            if (typeof tag !== "string") {
              return map
            }
            const trimmed = tag.trim()
            if (!trimmed) {
              return map
            }
            const key = trimmed.toLowerCase()
            if (!map.has(key)) {
              map.set(key, trimmed)
            }
            return map
          }, new Map<string, string>())
          .values(),
      )
    : []

  const status: GroupTopicStatus =
    (topic.status as GroupTopicStatus | undefined) ?? (topic.isLocked ? "locked" : "active")

  const reactions = topic.reactions ? normalizeReactions(topic.reactions) : undefined
  const lastActivityAt = topic.lastActivityAt ?? topic.updatedAt ?? topic.createdAt

  return {
    ...topic,
    status,
    tags: normalizedTags,
    reactions,
    lastActivityAt,
  }
}

function getAllGroupTopics(): GroupTopic[] {
  return readData(STORAGE_KEYS.GROUP_TOPICS, DEFAULT_GROUP_TOPICS).map(normalizeGroupTopic)
}

function setAllGroupTopics(topics: GroupTopic[]): void {
  const normalized = topics.map(normalizeGroupTopic)
  writeData(STORAGE_KEYS.GROUP_TOPICS, normalized)
}

export function getGroupTopicsByGroupId(groupId: string): GroupTopic[] {
  return getAllGroupTopics()
    .filter((topic) => topic.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getGroupTopicsByParentId(parentTopicId: string): GroupTopic[] {
  return getAllGroupTopics()
    .filter((topic) => topic.parentTopicId === parentTopicId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function getGroupTopicById(topicId: string): GroupTopic | undefined {
  return getAllGroupTopics().find((topic) => topic.id === topicId)
}

export function addGroupTopic(topic: GroupTopic): void {
  const topics = getAllGroupTopics()
  topics.push(topic)
  setAllGroupTopics(topics)
  refreshGroupTopicCount(topic.groupId)

  // Process mentions in topic content
  const mentionUsernames = extractMentions(topic.content)
  if (mentionUsernames.length > 0) {
    const author = getUserById(topic.authorId)
    if (author) {
      const authorName = author.fullName || author.username || "Someone"
      const group = getGroupById(topic.groupId)

      // Determine thread ID - use parent topic ID if this is a reply, otherwise use this topic's ID
      const threadId = topic.parentTopicId || topic.id

      for (const username of mentionUsernames) {
        const mentionedUser = getUserByUsername(username)
        if (!mentionedUser) continue

        // Don't notify if user mentioned themselves
        if (mentionedUser.id === topic.authorId) continue

        // Don't notify if users are blocked
        if (areUsersBlocked(topic.authorId, mentionedUser.id)) continue

        createMentionNotification({
          mentionerId: topic.authorId,
          mentionerName: authorName,
          mentionedUserId: mentionedUser.id,
          threadId,
          threadType: "group_topic",
          threadTitle: topic.title || undefined,
          groupSlug: group?.slug,
        })
      }
    }
  }
}

export function updateGroupTopic(topicId: string, updates: Partial<GroupTopic>): void {
  const topics = getAllGroupTopics()
  const index = topics.findIndex((topic) => topic.id === topicId)
  if (index === -1) return
  topics[index] = { ...topics[index], ...updates }
  setAllGroupTopics(topics)
}

export function deleteGroupTopic(topicId: string): void {
  const topics = getAllGroupTopics()
  const topic = topics.find((item) => item.id === topicId)
  if (!topic) return
  const remaining = topics.filter(
    (item) => item.id !== topicId && item.parentTopicId !== topicId,
  )
  setAllGroupTopics(remaining)
  refreshGroupTopicCount(topic.groupId)
}

// ---------------------------------------------------------------------------
// Group poll operations
// ---------------------------------------------------------------------------

function getAllGroupPolls(): GroupPoll[] {
  return readData(STORAGE_KEYS.GROUP_POLLS, DEFAULT_GROUP_POLLS)
}

function setAllGroupPolls(polls: GroupPoll[]): void {
  writeData(STORAGE_KEYS.GROUP_POLLS, polls)
}

function recalculatePollStats(pollId: string): void {
  const polls = getAllGroupPolls()
  const index = polls.findIndex((poll) => poll.id === pollId)
  if (index === -1) return
  const poll = polls[index]
  const votes = getPollVotesByPollId(pollId)
  const optionCounts: Record<string, number> = {}
  poll.options.forEach((option) => {
    optionCounts[option.id] = 0
  })
  votes.forEach((vote) => {
    vote.optionIds.forEach((optionId) => {
      optionCounts[optionId] = (optionCounts[optionId] ?? 0) + 1
    })
  })
  const updatedOptions = poll.options.map((option) => ({
    ...option,
    voteCount: optionCounts[option.id] ?? 0,
  }))
  const totalVotes = updatedOptions.reduce((sum, option) => sum + option.voteCount, 0)
  polls[index] = {
    ...poll,
    options: updatedOptions,
    voteCount: totalVotes,
    updatedAt: new Date().toISOString(),
  }
  setAllGroupPolls(polls)
}

export function getGroupPollsByGroupId(groupId: string): GroupPoll[] {
  return getAllGroupPolls()
    .filter((poll) => poll.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getGroupPollById(pollId: string): GroupPoll | undefined {
  return getAllGroupPolls().find((poll) => poll.id === pollId)
}

export function addGroupPoll(poll: GroupPoll): void {
  const polls = getAllGroupPolls()
  polls.push(poll)
  setAllGroupPolls(polls)
  recalculatePollStats(poll.id)
}

export function updateGroupPoll(pollId: string, updates: Partial<GroupPoll>): void {
  const polls = getAllGroupPolls()
  const index = polls.findIndex((poll) => poll.id === pollId)
  if (index === -1) return
  polls[index] = { ...polls[index], ...updates }
  setAllGroupPolls(polls)
  recalculatePollStats(pollId)
}

export function deleteGroupPoll(pollId: string): void {
  const polls = getAllGroupPolls().filter((poll) => poll.id !== pollId)
  setAllGroupPolls(polls)
  const votes = getAllPollVotes().filter((vote) => vote.pollId !== pollId)
  setAllPollVotes(votes)
}

// ---------------------------------------------------------------------------
// Poll vote operations
// ---------------------------------------------------------------------------

function getAllPollVotes(): PollVote[] {
  return readData(STORAGE_KEYS.POLL_VOTES, DEFAULT_POLL_VOTES)
}

function setAllPollVotes(votes: PollVote[]): void {
  writeData(STORAGE_KEYS.POLL_VOTES, votes)
}

export function getPollVotesByPollId(pollId: string): PollVote[] {
  return getAllPollVotes().filter((vote) => vote.pollId === pollId)
}

export function getUserPollVote(pollId: string, userId: string): PollVote | undefined {
  return getAllPollVotes().find((vote) => vote.pollId === pollId && vote.userId === userId)
}

export function addPollVote(vote: PollVote): void {
  const votes = getAllPollVotes()
  const index = votes.findIndex(
    (existing) => existing.pollId === vote.pollId && existing.userId === vote.userId,
  )
  if (index !== -1) {
    votes[index] = vote
  } else {
    votes.push(vote)
  }
  setAllPollVotes(votes)
  recalculatePollStats(vote.pollId)
}

export function removePollVote(pollId: string, userId: string): void {
  const votes = getAllPollVotes().filter(
    (vote) => !(vote.pollId === pollId && vote.userId === userId),
  )
  setAllPollVotes(votes)
  recalculatePollStats(pollId)
}

// ---------------------------------------------------------------------------
// Group event operations
// ---------------------------------------------------------------------------

function getAllGroupEvents(): GroupEvent[] {
  return readData(STORAGE_KEYS.GROUP_EVENTS, DEFAULT_GROUP_EVENTS)
}

function setAllGroupEvents(events: GroupEvent[]): void {
  writeData(STORAGE_KEYS.GROUP_EVENTS, events)
}

function refreshEventAttendance(eventId: string): void {
  const events = getAllGroupEvents()
  const index = events.findIndex((event) => event.id === eventId)
  if (index === -1) return
  const rsvps = getEventRSVPsByEventId(eventId)
  const attendeeCount = rsvps.filter((rsvp) => rsvp.status === "going").length
  events[index] = {
    ...events[index],
    attendeeCount,
    updatedAt: new Date().toISOString(),
  }
  setAllGroupEvents(events)
}

export function getGroupEventsByGroupId(groupId: string): GroupEvent[] {
  return getAllGroupEvents()
    .filter((event) => event.groupId === groupId)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

export function getGroupEvents(): GroupEvent[] {
  return getAllGroupEvents().sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )
}

export function getGroupEventById(eventId: string): GroupEvent | undefined {
  return getAllGroupEvents().find((event) => event.id === eventId)
}

export function addGroupEvent(event: GroupEvent): void {
  const events = getAllGroupEvents()
  events.push(event)
  setAllGroupEvents(events)
  refreshEventAttendance(event.id)
}

export function updateGroupEvent(eventId: string, updates: Partial<GroupEvent>): void {
  const events = getAllGroupEvents()
  const index = events.findIndex((event) => event.id === eventId)
  if (index === -1) return
  events[index] = { ...events[index], ...updates, updatedAt: new Date().toISOString() }
  setAllGroupEvents(events)
  refreshEventAttendance(eventId)
}

export function deleteGroupEvent(eventId: string): void {
  const events = getAllGroupEvents().filter((event) => event.id !== eventId)
  setAllGroupEvents(events)
  const rsvps = getAllEventRSVPs().filter((rsvp) => rsvp.eventId !== eventId)
  setAllEventRSVPs(rsvps)
}

// ---------------------------------------------------------------------------
// Event RSVP operations
// ---------------------------------------------------------------------------

function getAllEventRSVPs(): EventRSVP[] {
  return readData(STORAGE_KEYS.EVENT_RSVPS, DEFAULT_EVENT_RSVPS)
}

function setAllEventRSVPs(rsvps: EventRSVP[]): void {
  writeData(STORAGE_KEYS.EVENT_RSVPS, rsvps)
}

export function getEventRSVPsByEventId(eventId: string): EventRSVP[] {
  return getAllEventRSVPs().filter((rsvp) => rsvp.eventId === eventId)
}

export function getUserEventRSVP(eventId: string, userId: string): EventRSVP | undefined {
  return getAllEventRSVPs().find((rsvp) => rsvp.eventId === eventId && rsvp.userId === userId)
}

export function addEventRSVP(rsvp: EventRSVP): void {
  const rsvps = getAllEventRSVPs()
  const index = rsvps.findIndex(
    (existing) => existing.eventId === rsvp.eventId && existing.userId === rsvp.userId,
  )
  if (index !== -1) {
    rsvps[index] = {
      ...rsvps[index],
      ...rsvp,
      id: rsvps[index].id,
      eventId: rsvps[index].eventId,
      userId: rsvps[index].userId,
    }
  } else {
    rsvps.push(rsvp)
  }
  setAllEventRSVPs(rsvps)
  refreshEventAttendance(rsvp.eventId)
}

export function updateEventRSVP(
  eventId: string,
  userId: string,
  updates: Partial<EventRSVP>,
): void {
  const rsvps = getAllEventRSVPs()
  const index = rsvps.findIndex(
    (existing) => existing.eventId === eventId && existing.userId === userId,
  )
  if (index === -1) return

  const current = rsvps[index]
  const merged: EventRSVP = {
    ...current,
    ...updates,
    id: current.id,
    eventId: current.eventId,
    userId: current.userId,
  }

  if (merged.shareLocation === false) {
    merged.locationShare = undefined
  }

  rsvps[index] = merged
  setAllEventRSVPs(rsvps)
  refreshEventAttendance(eventId)
}

export function updateEventRSVPLocationShare(
  eventId: string,
  userId: string,
  share: boolean,
  locationShare?: Partial<EventLocationShare>,
): void {
  const existing = getUserEventRSVP(eventId, userId)
  if (!existing) return

  if (!share) {
    updateEventRSVP(eventId, userId, {
      shareLocation: false,
      locationShare: undefined,
    })
    return
  }

  const previousShare = existing.locationShare ?? {}
  const sharePayload: EventLocationShare = {
    ...previousShare,
    ...locationShare,
    sharedAt: locationShare?.sharedAt ?? new Date().toISOString(),
  }

  updateEventRSVP(eventId, userId, {
    shareLocation: true,
    locationShare: sharePayload,
  })
}

export function removeEventRSVP(eventId: string, userId: string): void {
  const rsvps = getAllEventRSVPs().filter(
    (existing) => !(existing.eventId === eventId && existing.userId === userId),
  )
  setAllEventRSVPs(rsvps)
  refreshEventAttendance(eventId)
}

// ---------------------------------------------------------------------------
// Group resource operations
// ---------------------------------------------------------------------------

function getAllGroupResources(): GroupResource[] {
  return readData(STORAGE_KEYS.GROUP_RESOURCES, DEFAULT_GROUP_RESOURCES)
}

function setAllGroupResources(resources: GroupResource[]): void {
  writeData(STORAGE_KEYS.GROUP_RESOURCES, resources)
}

export function getGroupResourcesByGroupId(groupId: string): GroupResource[] {
  return getAllGroupResources()
    .filter((resource) => resource.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function addGroupResource(resource: GroupResource): void {
  const resources = getAllGroupResources()
  resources.push(resource)
  setAllGroupResources(resources)
}

export function updateGroupResource(resourceId: string, updates: Partial<GroupResource>): void {
  const resources = getAllGroupResources()
  const index = resources.findIndex((resource) => resource.id === resourceId)
  if (index === -1) return
  resources[index] = { ...resources[index], ...updates }
  setAllGroupResources(resources)
}

export function deleteGroupResource(resourceId: string): void {
  const resources = getAllGroupResources().filter((resource) => resource.id !== resourceId)
  setAllGroupResources(resources)
}

// ---------------------------------------------------------------------------
// Group activity operations
// ---------------------------------------------------------------------------

function getAllGroupActivities(): GroupActivity[] {
  return readData(STORAGE_KEYS.GROUP_ACTIVITIES, DEFAULT_GROUP_ACTIVITIES)
}

function setAllGroupActivities(activities: GroupActivity[]): void {
  writeData(STORAGE_KEYS.GROUP_ACTIVITIES, activities)
}

export function getGroupActivitiesByGroupId(groupId: string): GroupActivity[] {
  return getAllGroupActivities()
    .filter((activity) => activity.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function addGroupActivity(activity: GroupActivity): void {
  const activities = getAllGroupActivities()
  activities.unshift(activity)
  const MAX_ACTIVITY_ENTRIES = 150
  const trimmed =
    activities.length > MAX_ACTIVITY_ENTRIES ? activities.slice(0, MAX_ACTIVITY_ENTRIES) : activities
  setAllGroupActivities(trimmed)
}

// ---------------------------------------------------------------------------
// Group moderation operations
// ---------------------------------------------------------------------------

function getAllGroupWarnings(): GroupWarning[] {
  return readData(STORAGE_KEYS.GROUP_WARNINGS, DEFAULT_GROUP_WARNINGS)
}

function setAllGroupWarnings(warnings: GroupWarning[]): void {
  writeData(STORAGE_KEYS.GROUP_WARNINGS, warnings)
}

function getAllGroupBans(): GroupBan[] {
  return readData(STORAGE_KEYS.GROUP_BANS, DEFAULT_GROUP_BANS)
}

function setAllGroupBans(bans: GroupBan[]): void {
  writeData(STORAGE_KEYS.GROUP_BANS, bans)
}

export function getAllModerationActions(): ModerationAction[] {
  return readData(STORAGE_KEYS.MODERATION_ACTIONS, DEFAULT_MODERATION_ACTIONS)
}

function setAllModerationActions(actions: ModerationAction[]): void {
  writeData(STORAGE_KEYS.MODERATION_ACTIONS, actions)
}

export function addGroupWarning(warning: GroupWarning): void {
  const warnings = getAllGroupWarnings()
  warnings.push(warning)
  setAllGroupWarnings(warnings)
}

export function getGroupWarningsByUserId(groupId: string, userId: string): GroupWarning[] {
  return getAllGroupWarnings().filter(
    (warning) => warning.groupId === groupId && warning.userId === userId,
  )
}

export function getWarningCount(groupId: string, userId: string): number {
  return getGroupWarningsByUserId(groupId, userId).length
}

export function getGroupBansByGroupId(groupId: string): GroupBan[] {
  return getAllGroupBans().filter((ban) => ban.groupId === groupId)
}

export function getUserBan(groupId: string, userId: string): GroupBan | undefined {
  return getAllGroupBans().find(
    (ban) => ban.groupId === groupId && ban.userId === userId && ban.isActive !== false,
  )
}

export function isUserBannedFromGroup(groupId: string, userId: string): boolean {
  const ban = getUserBan(groupId, userId)
  if (!ban) return false
  if (!ban.isActive) return false
  if (!ban.expiresAt) return true
  return new Date(ban.expiresAt).getTime() > Date.now()
}

export function banGroupMember(ban: GroupBan): void {
  const bans = getAllGroupBans()
  const index = bans.findIndex(
    (entry) => entry.groupId === ban.groupId && entry.userId === ban.userId,
  )
  if (index !== -1) {
    bans[index] = { ...bans[index], ...ban, isActive: true }
  } else {
    bans.push({ ...ban, isActive: true })
  }
  setAllGroupBans(bans)
  addModerationAction({
    id: `mod_action_${Date.now()}`,
    groupId: ban.groupId,
    actionType: "ban",
    targetId: ban.userId,
    targetType: "user",
    performedBy: ban.bannedBy,
    reason: ban.reason,
    timestamp: new Date().toISOString(),
  })
}

export function unbanGroupMember(groupId: string, userId: string, performedBy: string): void {
  const bans = getAllGroupBans()
  const index = bans.findIndex(
    (entry) => entry.groupId === groupId && entry.userId === userId && entry.isActive !== false,
  )
  if (index === -1) return
  bans[index] = { ...bans[index], isActive: false }
  setAllGroupBans(bans)
  addModerationAction({
    id: `mod_action_${Date.now()}`,
    groupId,
    actionType: "unban",
    targetId: userId,
    targetType: "user",
    performedBy,
    timestamp: new Date().toISOString(),
  })
}

export function addModerationAction(action: ModerationAction): void {
  const actions = getAllModerationActions()
  actions.unshift(action)
  const MAX_ACTIONS = 200
  const trimmed = actions.length > MAX_ACTIONS ? actions.slice(0, MAX_ACTIONS) : actions
  setAllModerationActions(trimmed)
}

export function getModerationActionsByGroupId(groupId: string): ModerationAction[] {
  return getAllModerationActions()
    .filter((action) => action.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Group Rule Templates operations
function getAllGroupRuleTemplates(): GroupRuleTemplate[] {
  return readData(STORAGE_KEYS.GROUP_RULE_TEMPLATES, DEFAULT_GROUP_RULE_TEMPLATES)
}

function setAllGroupRuleTemplates(templates: GroupRuleTemplate[]): void {
  writeData(STORAGE_KEYS.GROUP_RULE_TEMPLATES, templates)
}

export function getGroupRuleTemplates(): GroupRuleTemplate[] {
  return getAllGroupRuleTemplates()
}

export function getGroupRuleTemplateById(id: string): GroupRuleTemplate | undefined {
  return getAllGroupRuleTemplates().find((template) => template.id === id)
}

export function addGroupRuleTemplate(template: GroupRuleTemplate): void {
  const templates = getAllGroupRuleTemplates()
  templates.push(template)
  setAllGroupRuleTemplates(templates)
}

export function updateGroupRuleTemplate(templateId: string, updated: Partial<GroupRuleTemplate>): void {
  const templates = getAllGroupRuleTemplates()
  const index = templates.findIndex((t) => t.id === templateId)
  if (index === -1) return
  templates[index] = { ...templates[index], ...updated, id: templateId, updatedAt: new Date().toISOString() }
  setAllGroupRuleTemplates(templates)
}

export function deleteGroupRuleTemplate(templateId: string): void {
  const templates = getAllGroupRuleTemplates().filter((t) => t.id !== templateId)
  setAllGroupRuleTemplates(templates)
}

// Group Approvals operations
function getAllGroupApprovals(): GroupApproval[] {
  return readData(STORAGE_KEYS.GROUP_APPROVALS, DEFAULT_GROUP_APPROVALS)
}

function setAllGroupApprovals(approvals: GroupApproval[]): void {
  writeData(STORAGE_KEYS.GROUP_APPROVALS, approvals)
}

export function getGroupApprovals(): GroupApproval[] {
  return getAllGroupApprovals()
}

export function getGroupApprovalByGroupId(groupId: string): GroupApproval | undefined {
  return getAllGroupApprovals().find((approval) => approval.groupId === groupId)
}

export function getPendingGroupApprovals(): GroupApproval[] {
  return getAllGroupApprovals().filter((approval) => approval.status === "pending")
}

export function addGroupApproval(approval: GroupApproval): void {
  const approvals = getAllGroupApprovals()
  approvals.push(approval)
  setAllGroupApprovals(approvals)
}

export function updateGroupApproval(approvalId: string, updated: Partial<GroupApproval>): void {
  const approvals = getAllGroupApprovals()
  const index = approvals.findIndex((a) => a.id === approvalId)
  if (index === -1) return
  approvals[index] = { ...approvals[index], ...updated, id: approvalId }
  setAllGroupApprovals(approvals)
}

export function approveGroup(groupId: string, approvedById: string): void {
  const group = getGroupById(groupId)
  if (!group) return

  // Update group approval status
  updateGroup(groupId, {
    approvalStatus: "approved",
    approvedById,
    approvedAt: new Date().toISOString(),
  })

  // Update approval record
  const approval = getGroupApprovalByGroupId(groupId)
  if (approval) {
    updateGroupApproval(approval.id, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedBy: approvedById,
    })
  }
}

export function rejectGroup(groupId: string, approvedById: string, rejectionReason: string): void {
  const group = getGroupById(groupId)
  if (!group) return

  // Update group approval status
  updateGroup(groupId, {
    approvalStatus: "rejected",
    rejectedReason: rejectionReason,
    approvedById,
    approvedAt: new Date().toISOString(),
  })

  // Update approval record
  const approval = getGroupApprovalByGroupId(groupId)
  if (approval) {
    updateGroupApproval(approval.id, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewedBy: approvedById,
      rejectionReason,
    })
  }
}

// Comment operations
export function getComments(): Comment[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS)
  const parsed = data ? (JSON.parse(data) as Comment[]) : []
  return parsed.map(normalizeComment)
}

export function getCommentsByPostId(postId: string): Comment[] {
  return getComments().filter((c) => c.postId === postId)
}

export function getCommentsByWikiArticleId(articleId: string): Comment[] {
  return getComments().filter((c) => c.wikiArticleId === articleId)
}

export function getCommentsByPetPhotoId(photoId: string): Comment[] {
  return getComments().filter((c) => c.petPhotoId === photoId)
}

export function addComment(comment: Comment) {
  if (typeof window === "undefined") return

  const commenterId = comment.userId

  if (comment.postId) {
    const post = getBlogPostById(comment.postId)
    if (!post) {
      return
    }
    if (areUsersBlocked(commenterId, post.authorId)) {
      return
    }
  }

  if (comment.petPhotoId) {
    const [petId] = comment.petPhotoId.split(":")
    if (petId) {
      const pet = getPetById(petId)
      if (pet && areUsersBlocked(commenterId, pet.ownerId)) {
        return
      }
    }
  }

  if (comment.wikiArticleId) {
    const article = getWikiArticles().find((a) => a.id === comment.wikiArticleId)
    if (article && areUsersBlocked(commenterId, article.authorId)) {
      return
    }
  }

  const comments = getComments()
  const normalized = normalizeComment(comment)
  comments.push(normalized)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))

  // Award points for commenting
  if (typeof window !== "undefined") {
    import("./points-integration").then(({ awardPointsToUser }) => {
      const actionType = comment.parentCommentId ? "comment_reply" : "post_comment"
      awardPointsToUser(comment.userId, actionType)
    })
  }
}

export function updateComment(
  commentId: string,
  content: string,
  options?: { format?: "markdown" | "plaintext"; editorId?: string; status?: CommentStatus },
) {
  if (typeof window === "undefined") return
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index !== -1) {
    const updatedAt = new Date().toISOString()
    comments[index] = normalizeComment({
      ...comments[index],
      content,
      format: options?.format ?? comments[index].format ?? "markdown",
      updatedAt,
      editedBy: options?.editorId ?? comments[index].editedBy,
      status: options?.status ?? comments[index].status ?? "published",
    })
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  }
}

export function deleteComment(commentId: string) {
  if (typeof window === "undefined") return
  const comments = getComments()
  // Delete the comment and all its replies
  const filteredComments = comments.filter((c) => c.id !== commentId && c.parentCommentId !== commentId)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filteredComments))
}

export function toggleCommentReaction(commentId: string, userId: string, reactionType: string) {
  if (typeof window === "undefined") return
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index !== -1) {
    if (areUsersBlocked(userId, comments[index].userId)) {
      return
    }

    const normalized = normalizeComment(comments[index])
    const reactions = normalized.reactions!
    const reactionArray = reactions[reactionType as keyof typeof reactions] || []
    const hasReacted = reactionArray.includes(userId)
    
    if (hasReacted) {
      // Remove reaction
      reactions[reactionType as keyof typeof reactions] = reactionArray.filter((id) => id !== userId)
    } else {
      // Remove from other reactions first (user can only have one reaction)
      Object.keys(reactions).forEach((key) => {
        if (key !== reactionType) {
          reactions[key as keyof typeof reactions] = reactions[key as keyof typeof reactions].filter(
            (id) => id !== userId
          )
        }
      })
      // Add reaction
      reactions[reactionType as keyof typeof reactions] = [...reactionArray, userId]
    }
    comments[index] = { ...normalized, reactions }
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  }
}

// Photo Reaction operations
export function togglePhotoReaction(petId: string, photoIndex: number, userId: string, reactionType: ReactionType) {
  if (typeof window === "undefined") return
  const photoKey = `${petId}:${photoIndex}`
  const pet = getPetById(petId)
  if (!pet) return
  
  // Check if user is blocked
  if (areUsersBlocked(userId, pet.ownerId)) {
    return
  }

  const storageKey = "pet_social_photo_reactions"
  const allReactions = readData<Record<string, Record<ReactionType, string[]>>>(storageKey, {})
  const reactions = allReactions[photoKey] || { ...DEFAULT_REACTIONS }
  const reactionArray = reactions[reactionType] || []
  const hasReacted = reactionArray.includes(userId)
  
  if (hasReacted) {
    // Remove reaction
    reactions[reactionType] = reactionArray.filter((id) => id !== userId)
  } else {
    // Remove from other reactions first (user can only have one reaction)
    Object.keys(reactions).forEach((key) => {
      if (key !== reactionType) {
        reactions[key as ReactionType] = reactions[key as ReactionType].filter((id) => id !== userId)
      }
    })
    // Add reaction
    reactions[reactionType] = [...reactionArray, userId]
  }

  // Save to storage
  allReactions[photoKey] = reactions
  writeData(storageKey, allReactions)
}

export function getPhotoReactions(
  petId: string,
  photoIndex: number
): Record<string, Record<ReactionType, string[]>> {
  const photoKey = `${petId}:${photoIndex}`
  const storageKey = "pet_social_photo_reactions"
  const allReactions = readData<Record<string, Record<ReactionType, string[]>>>(storageKey, {})
  
  // Ensure the photo key exists with default reactions
  if (!allReactions[photoKey]) {
    allReactions[photoKey] = { ...DEFAULT_REACTIONS }
  }
  
  // Return format expected by component: { [photoKey]: reactions }
  return { [photoKey]: allReactions[photoKey] }
}

export function flagComment(
  commentId: string,
  userId: string,
  reason: CommentFlagReason,
  message?: string,
): Comment | null {
  if (typeof window === "undefined") return null
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index === -1) return null

  const existingFlags = comments[index].flags ? [...comments[index].flags] : []
  const now = new Date().toISOString()
  const existingFlagIndex = existingFlags.findIndex((flag) => flag.userId === userId)

  const newFlag: CommentFlag = {
    userId,
    reason,
    message,
    flaggedAt: now,
  }

  if (existingFlagIndex !== -1) {
    existingFlags[existingFlagIndex] = { ...existingFlags[existingFlagIndex], ...newFlag }
  } else {
    existingFlags.push(newFlag)
  }

  let status: CommentStatus = comments[index].status ?? "published"
  if (existingFlags.length >= COMMENT_FLAG_THRESHOLD && status === "published") {
    status = "pending"
  }

  comments[index] = normalizeComment({
    ...comments[index],
    flags: existingFlags,
    status,
  })

  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  return comments[index]
}

export function clearCommentFlag(commentId: string, userId: string): Comment | null {
  if (typeof window === "undefined") return null
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index === -1) return null

  const flags = comments[index].flags ? comments[index].flags.filter((flag) => flag.userId !== userId) : []
  comments[index] = normalizeComment({
    ...comments[index],
    flags,
  })
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  return comments[index]
}

export function moderateComment(
  commentId: string,
  status: CommentStatus,
  moderatorId: string,
  note?: string,
  options?: { clearFlags?: boolean },
): Comment | null {
  if (typeof window === "undefined") return null
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index === -1) return null

  const moderation: CommentModeration = {
    status,
    updatedAt: new Date().toISOString(),
    updatedBy: moderatorId,
    note,
  }

  comments[index] = normalizeComment({
    ...comments[index],
    status,
    moderation,
    flags: options?.clearFlags ? [] : comments[index].flags,
  })

  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  return comments[index]
}

// Editorial Discussion operations (separate from public comments)
export function getEditorialDiscussionsByArticleId(articleId: string): EditorialDiscussion[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.EDITORIAL_DISCUSSIONS)
  const discussions: EditorialDiscussion[] = data ? JSON.parse(data) : []
  return discussions.filter((d) => d.articleId === articleId).sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

export function addEditorialDiscussion(discussion: EditorialDiscussion): EditorialDiscussion {
  if (typeof window === "undefined") return discussion
  const discussions = getEditorialDiscussions()
  discussions.push(discussion)
  localStorage.setItem(STORAGE_KEYS.EDITORIAL_DISCUSSIONS, JSON.stringify(discussions))
  return discussion
}

export function getEditorialDiscussions(): EditorialDiscussion[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.EDITORIAL_DISCUSSIONS)
  return data ? JSON.parse(data) : []
}

export function updateEditorialDiscussion(
  discussionId: string,
  content: string,
  options?: { editorId?: string; format?: "markdown" | "plaintext" }
): EditorialDiscussion | null {
  if (typeof window === "undefined") return null
  const discussions = getEditorialDiscussions()
  const index = discussions.findIndex((d) => d.id === discussionId)
  if (index === -1) return null

  discussions[index] = {
    ...discussions[index],
    content,
    updatedAt: new Date().toISOString(),
    editedBy: options?.editorId,
    format: options?.format || discussions[index].format || "markdown",
  }

  localStorage.setItem(STORAGE_KEYS.EDITORIAL_DISCUSSIONS, JSON.stringify(discussions))
  return discussions[index]
}

export function deleteEditorialDiscussion(discussionId: string): boolean {
  if (typeof window === "undefined") return false
  const discussions = getEditorialDiscussions()
  const filtered = discussions.filter((d) => {
    // Also delete any replies to this discussion
    if (d.id === discussionId || d.parentDiscussionId === discussionId) {
      return false
    }
    return true
  })

  if (filtered.length === discussions.length) return false

  localStorage.setItem(STORAGE_KEYS.EDITORIAL_DISCUSSIONS, JSON.stringify(filtered))
  return true
}

export function toggleEditorialDiscussionReaction(
  discussionId: string,
  userId: string,
  reactionType: ReactionType
): EditorialDiscussion | null {
  if (typeof window === "undefined") return null
  const discussions = getEditorialDiscussions()
  const index = discussions.findIndex((d) => d.id === discussionId)
  if (index === -1) return null

  const discussion = discussions[index]
  const reactions = discussion.reactions || {
    like: [],
    love: [],
    laugh: [],
    wow: [],
    sad: [],
    angry: [],
  }

  const userReactions = Object.entries(reactions).find(([, userIds]) => userIds.includes(userId))
  if (userReactions && userReactions[0] === reactionType) {
    // Remove reaction if already reacted with same type
    reactions[reactionType as ReactionType] = reactions[reactionType as ReactionType].filter((id) => id !== userId)
  } else {
    // Remove from other reaction types and add to new one
    Object.keys(reactions).forEach((type) => {
      reactions[type as ReactionType] = reactions[type as ReactionType].filter((id) => id !== userId)
    })
    reactions[reactionType].push(userId)
  }

  discussions[index] = {
    ...discussion,
    reactions,
  }

  localStorage.setItem(STORAGE_KEYS.EDITORIAL_DISCUSSIONS, JSON.stringify(discussions))
  return discussions[index]
}

// Wiki operations
export function getWikiArticles(): WikiArticle[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES)
  const articles = (data ? JSON.parse(data) : []) as WikiArticle[]
  return articles.map((article, index) => normalizeWikiArticle(article, index))
}

export function getWikiArticleBySlug(slug: string): WikiArticle | undefined {
  return getWikiArticles().find((a) => a.slug === slug)
}

export function getWikiArticleById(id: string): WikiArticle | undefined {
  return getWikiArticles().find((a) => a.id === id)
}

export function getWikiArticlesByCategory(category: string): WikiArticle[] {
  return getWikiArticles().filter((a) => a.category === category)
}

export function addWikiArticle(article: WikiArticle) {
  if (typeof window === "undefined") return
  const articles = getWikiArticles()
  // Check if article with same id already exists
  const existingIndex = articles.findIndex((a) => a.id === article.id)
  if (existingIndex === -1) {
    articles.push(normalizeWikiArticle(article, articles.length))
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(articles))
  } else {
    // If exists, update it
    articles[existingIndex] = normalizeWikiArticle(article, existingIndex)
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(articles))
  }
}

export function updateWikiArticle(article: WikiArticle) {
  if (typeof window === "undefined") return
  const articles = getWikiArticles()
  const index = articles.findIndex((a) => a.id === article.id)
  if (index !== -1) {
    articles[index] = normalizeWikiArticle(article, index)
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(articles))
    
    // Invalidate cache when breed article is updated
    if (article.category === "breeds") {
      invalidateCache()
    }
  }
}

// Wiki revision operations
export function getWikiRevisions(): WikiRevision[] {
  return readData<WikiRevision[]>(STORAGE_KEYS.WIKI_REVISIONS, [])
}

export function getWikiRevisionsByArticleId(articleId: string): WikiRevision[] {
  return getWikiRevisions().filter((r) => r.articleId === articleId)
}

export function getWikiRevisionById(revisionId: string): WikiRevision | undefined {
  return getWikiRevisions().find((r) => r.id === revisionId)
}

export function addWikiRevision(revision: WikiRevision): void {
  const revisions = getWikiRevisions()
  revisions.push(revision)
  writeData(STORAGE_KEYS.WIKI_REVISIONS, revisions)
}

export function updateWikiRevision(id: string, updates: Partial<WikiRevision>): void {
  const revisions = getWikiRevisions()
  const index = revisions.findIndex((rev) => rev.id === id)
  if (index !== -1) {
    revisions[index] = { ...revisions[index], ...updates }
    writeData(STORAGE_KEYS.WIKI_REVISIONS, revisions)
  }
}

export function getStableRevision(articleId: string): WikiRevision | undefined {
  const article = getWikiArticles().find((a) => a.id === articleId)
  if (!article || !article.stableRevisionId) return undefined
  return getWikiRevisionById(article.stableRevisionId)
}

export function getLatestRevision(articleId: string): WikiRevision | undefined {
  const revisions = getWikiRevisionsByArticleId(articleId)
  if (revisions.length === 0) return undefined
  // Get most recent revision (not deprecated)
  const activeRevisions = revisions.filter((r) => r.status !== "deprecated")
  if (activeRevisions.length === 0) return undefined
  return activeRevisions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0]
}

export function isStaleContent(approvedAt?: string): boolean {
  if (!approvedAt) return false
  const approvedDate = new Date(approvedAt)
  const now = new Date()
  const monthsDiff = (now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  return monthsDiff > 12
}

export function rollbackToStableRevision(
  articleId: string,
  performedBy: string
): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  const article = getWikiArticles().find((a) => a.id === articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  const stableRevision = getStableRevision(articleId)
  if (!stableRevision) {
    return { success: false, error: "No stable revision found" }
  }

  // Update article content to stable revision
  const updatedArticle: WikiArticle = {
    ...article,
    content: stableRevision.content,
    currentRevisionId: stableRevision.id,
    updatedAt: new Date().toISOString(),
  }

  updateWikiArticle(updatedArticle)

  // Create rollback history entry
  const rollbackHistory: RollbackHistoryEntry = {
    id: `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contentId: articleId,
    contentType: "wiki",
    rolledBackFrom: article.currentRevisionId || "",
    rolledBackTo: stableRevision.id,
    performedBy,
    performedAt: new Date().toISOString(),
    reason: `Rolled back to stable revision`,
    metadata: {
      articleTitle: article.title,
      stableRevisionId: stableRevision.id,
    },
  }
  addRollbackHistoryEntry(rollbackHistory)

  // Create audit log entry
  // Note: Using empty groupId for wiki articles as they are not group-specific
  addModerationAction({
    id: `wiki_rollback_${Date.now()}`,
    groupId: "", // Not group-specific, but required by type
    actionType: "other",
    targetId: articleId,
    targetType: "other",
    performedBy,
    reason: `Rolled back wiki article "${article.title}" to stable revision ${stableRevision.id}`,
    timestamp: new Date().toISOString(),
  })

  return { success: true }
}

// Health Condition operations
export function getHealthConditions(): HealthCondition[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.HEALTH_CONDITIONS)
  return data ? JSON.parse(data) : []
}

export function getHealthConditionBySlug(slug: string): HealthCondition | undefined {
  return getHealthConditions().find((c) => c.slug === slug)
}

export function getHealthConditionById(id: string): HealthCondition | undefined {
  return getHealthConditions().find((c) => c.id === id)
}

export function getHealthConditionsBySpecies(species: string[]): HealthCondition[] {
  return getHealthConditions().filter((c) =>
    c.affectedSpecies.some((s) => species.includes(s))
  )
}

export function getHealthConditionsBySeverity(severity: HealthCondition["severity"]): HealthCondition[] {
  return getHealthConditions().filter((c) => c.severity === severity)
}

export function getUrgentHealthConditions(): HealthCondition[] {
  return getHealthConditions().filter((c) => c.urgencyFlag === true)
}

export function addHealthCondition(condition: HealthCondition) {
  if (typeof window === "undefined") return
  const conditions = getHealthConditions()
  // Check if condition with same id already exists
  const existingIndex = conditions.findIndex((c) => c.id === condition.id)
  if (existingIndex !== -1) {
    throw new Error("Health condition with this ID already exists")
  }
  conditions.push(condition)
  localStorage.setItem(STORAGE_KEYS.HEALTH_CONDITIONS, JSON.stringify(conditions))
}

export function updateHealthCondition(condition: HealthCondition) {
  if (typeof window === "undefined") return
  const conditions = getHealthConditions()
  const index = conditions.findIndex((c) => c.id === condition.id)
  if (index !== -1) {
    conditions[index] = condition
    localStorage.setItem(STORAGE_KEYS.HEALTH_CONDITIONS, JSON.stringify(conditions))
  }
}

export function deleteHealthCondition(id: string) {
  if (typeof window === "undefined") return
  const conditions = getHealthConditions()
  const filtered = conditions.filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.HEALTH_CONDITIONS, JSON.stringify(filtered))
}

// Activity operations
export function getActivities(): Activity[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES)
  return data ? JSON.parse(data) : []
}

export function addActivity(activity: Activity) {
  if (typeof window === "undefined") return
  const activities = getActivities()
  activities.unshift(activity)
  // Keep only last 100 activities
  if (activities.length > 100) {
    activities.pop()
  }
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities))
}

export function getUserConversations(userId: string): Conversation[] {
  return getConversationsForUser(userId, { includeArchived: true })
}

export function getDirectMessagesByConversation(conversationId: string): DirectMessage[] {
  return getMessagesByConversationId(conversationId)
}

export function getDirectMessageById(messageId: string): DirectMessage | undefined {
  return getAllDirectMessages().find((message) => message.id === messageId)
}

export function addDirectMessage(message: DirectMessage): void {
  addMessageToConversation(message)
}

export function updateDirectMessage(messageId: string, updates: Partial<DirectMessage>) {
  const messages = getAllDirectMessages()
  const index = messages.findIndex((message) => message.id === messageId)
  if (index === -1) {
    return
  }

  const existing = messages[index]
  const merged: DirectMessage = {
    ...existing,
    ...updates,
    readAt: updates.readAt ? { ...existing.readAt, ...updates.readAt } : existing.readAt,
    attachments: updates.attachments ?? existing.attachments,
  }

  messages[index] = merged
  saveAllDirectMessages(messages)

  if (updates.content || updates.attachments) {
    updateConversation(merged.conversationId, {
      snippet: merged.content ?? existing.content,
    })
  }
}

// Wiki Translation Functions
export function getWikiTranslations(): WikiTranslation[] {
  return readData<WikiTranslation[]>(STORAGE_KEYS.WIKI_TRANSLATIONS, [])
}

export function getWikiTranslationsByArticleId(articleId: string): WikiTranslation[] {
  return getWikiTranslations().filter((t) => t.articleId === articleId)
}

export function getWikiTranslationByArticleIdAndLang(articleId: string, languageCode: string): WikiTranslation | undefined {
  return getWikiTranslations().find((t) => t.articleId === articleId && t.languageCode === languageCode)
}

export function createWikiTranslation(translation: WikiTranslation): void {
  if (typeof window === "undefined") return
  const translations = getWikiTranslations()
  translations.push(translation)
  writeData(STORAGE_KEYS.WIKI_TRANSLATIONS, translations)
}

export function updateWikiTranslation(id: string, updates: Partial<WikiTranslation>): void {
  if (typeof window === "undefined") return
  const translations = getWikiTranslations()
  const index = translations.findIndex((t) => t.id === id)
  if (index !== -1) {
    translations[index] = { ...translations[index], ...updates }
    writeData(STORAGE_KEYS.WIKI_TRANSLATIONS, translations)
  }
}

// Translation Glossary Functions
export function getTranslationGlossary(): TranslationGlossary[] {
  return readData<TranslationGlossary[]>(STORAGE_KEYS.TRANSLATION_GLOSSARY, [])
}

export function getTranslationGlossaryById(id: string): TranslationGlossary | undefined {
  return getTranslationGlossary().find((g) => g.id === id)
}

export function createTranslationGlossary(glossary: TranslationGlossary): void {
  if (typeof window === "undefined") return
  const glossaryEntries = getTranslationGlossary()
  glossaryEntries.push(glossary)
  writeData(STORAGE_KEYS.TRANSLATION_GLOSSARY, glossaryEntries)
}

export function updateTranslationGlossary(id: string, updates: Partial<TranslationGlossary>): void {
  if (typeof window === "undefined") return
  const glossaryEntries = getTranslationGlossary()
  const index = glossaryEntries.findIndex((g) => g.id === id)
  if (index !== -1) {
    glossaryEntries[index] = { ...glossaryEntries[index], ...updates }
    writeData(STORAGE_KEYS.TRANSLATION_GLOSSARY, glossaryEntries)
  }
}

export function deleteTranslationGlossary(id: string): void {
  if (typeof window === "undefined") return
  const glossaryEntries = getTranslationGlossary()
  const filtered = glossaryEntries.filter((g) => g.id !== id)
  writeData(STORAGE_KEYS.TRANSLATION_GLOSSARY, filtered)
}

// Place Functions
export function getPlaces(): Place[] {
  return readData<Place[]>(STORAGE_KEYS.PLACES, [])
}

export function getPlaceById(id: string): Place | undefined {
  return getPlaces().find((place) => place.id === id)
}

export function getApprovedPlaces(): Place[] {
  return getPlaces().filter((place) => place.moderationStatus === "approved")
}

export function getPlacesNearLocation(lat: number, lng: number, radiusKm: number = 10): Place[] {
  const places = getApprovedPlaces()
  return places.filter((place) => {
    const distance = calculateDistance(lat, lng, place.lat, place.lng)
    return distance <= radiusKm
  })
}

export function addPlace(place: Place): void {
  const places = getPlaces()
  places.push(place)
  writeData(STORAGE_KEYS.PLACES, places)
}

export function updatePlace(id: string, updates: Partial<Place>): void {
  const places = getPlaces()
  const index = places.findIndex((place) => place.id === id)
  if (index !== -1) {
    places[index] = { ...places[index], ...updates, updatedAt: new Date().toISOString() }
    writeData(STORAGE_KEYS.PLACES, places)
  }
}

export function deletePlace(id: string): void {
  const places = getPlaces()
  const filtered = places.filter((place) => place.id !== id)
  writeData(STORAGE_KEYS.PLACES, filtered)
  
  // Also delete associated photos
  const photos = getPlacePhotos()
  const filteredPhotos = photos.filter((photo) => photo.placeId !== id)
  writeData(STORAGE_KEYS.PLACE_PHOTOS, filteredPhotos)
}

// Place Photo Functions
export function getPlacePhotos(): PlacePhoto[] {
  return readData<PlacePhoto[]>(STORAGE_KEYS.PLACE_PHOTOS, [])
}

export function getPlacePhotosByPlaceId(placeId: string): PlacePhoto[] {
  return getPlacePhotos().filter((photo) => photo.placeId === placeId)
}

export function getPlacePhotoById(id: string): PlacePhoto | undefined {
  return getPlacePhotos().find((photo) => photo.id === id)
}

export function addPlacePhoto(photo: PlacePhoto): void {
  const photos = getPlacePhotos()
  photos.push(photo)
  writeData(STORAGE_KEYS.PLACE_PHOTOS, photos)
}

export function deletePlacePhoto(id: string): void {
  const photos = getPlacePhotos()
  const filtered = photos.filter((photo) => photo.id !== id)
  writeData(STORAGE_KEYS.PLACE_PHOTOS, filtered)
}

// Helper function to calculate distance between two points in kilometers
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Organization functions
export function getOrganizations(): Organization[] {
  return readData<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, [])
}

export function getOrganizationById(id: string): Organization | undefined {
  return getOrganizations().find((org) => org.id === id)
}

export function getVerifiedOrganizations(): Organization[] {
  return getOrganizations().filter((org) => org.verifiedAt)
}

export function addOrganization(organization: Organization): void {
  const organizations = getOrganizations()
  organizations.push(organization)
  writeData(STORAGE_KEYS.ORGANIZATIONS, organizations)
}

export function updateOrganization(id: string, updates: Partial<Organization>): void {
  const organizations = getOrganizations()
  const index = organizations.findIndex((org) => org.id === id)
  if (index !== -1) {
    organizations[index] = { ...organizations[index], ...updates }
    writeData(STORAGE_KEYS.ORGANIZATIONS, organizations)
  }
}

// Expert profile functions
export function getExpertProfiles(): ExpertProfile[] {
  return readData<ExpertProfile[]>(STORAGE_KEYS.EXPERT_PROFILES, [])
}

export function getExpertProfileByUserId(userId: string): ExpertProfile | undefined {
  return getExpertProfiles().find((profile) => profile.userId === userId)
}

export function getVerifiedExpertProfiles(): ExpertProfile[] {
  return getExpertProfiles().filter((profile) => profile.verifiedAt)
}

export function isExpertVerified(userId: string): boolean {
  const profile = getExpertProfileByUserId(userId)
  if (!profile || !profile.verifiedAt) return false
  
  // Check if expired
  if (profile.status === "expired" || profile.status === "revoked") {
    return false
  }
  
  // Check expiry date
  if (profile.expiresAt) {
    const now = new Date()
    const expiresAt = new Date(profile.expiresAt)
    if (expiresAt < now) {
      return false
    }
  }
  
  return profile.status === "verified"
}

export function addExpertProfile(profile: ExpertProfile): void {
  const profiles = getExpertProfiles()
  profiles.push(profile)
  writeData(STORAGE_KEYS.EXPERT_PROFILES, profiles)
}

export function updateExpertProfile(userId: string, updates: Partial<ExpertProfile>): void {
  const profiles = getExpertProfiles()
  const index = profiles.findIndex((profile) => profile.userId === userId)
  if (index !== -1) {
    profiles[index] = { ...profiles[index], ...updates }
    writeData(STORAGE_KEYS.EXPERT_PROFILES, profiles)
  }
}

// Expert verification check for health content
export function canPublishStableHealthRevision(userId: string): boolean {
  const user = getUserById(userId)
  if (!user) return false
  
  // Check if user has vet badge (from policy.ts)
  if (user.badge === "vet") return true
  
  // Check if user has verified expert profile
  return isExpertVerified(userId)
}

/**
 * Mark a revision as stable (for health articles, requires expert status)
 * 
 * @param articleId - Article ID
 * @param revisionId - Revision ID to mark as stable
 * @param userId - User ID attempting to publish
 * @returns Success status and error message if failed
 */
export function markRevisionAsStable(
  articleId: string,
  revisionId: string,
  userId: string
): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  const article = getWikiArticles().find((a) => a.id === articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  const revision = getWikiRevisionById(revisionId)
  if (!revision) {
    return { success: false, error: "Revision not found" }
  }

  // For health articles, require expert status
  if (article.category === "health") {
    if (!canPublishStableHealthRevision(userId)) {
      return { 
        success: false, 
        error: "Only verified experts can publish stable health revisions" 
      }
    }
  }

  // Mark revision as stable
  updateWikiRevision(revisionId, {
    status: "stable",
    verifiedBy: article.category === "health" ? userId : undefined,
  })

  // Update article to reference stable revision
  const updatedArticle: WikiArticle = {
    ...article,
    stableRevisionId: revisionId,
    currentRevisionId: revisionId,
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Update healthData with review information if health article
    healthData: article.category === "health" && article.healthData ? {
      ...article.healthData,
      lastReviewedDate: new Date().toISOString(),
      expertReviewer: userId,
    } : article.healthData,
  }

  updateWikiArticle(updatedArticle)

  return { success: true }
}

// Expert Verification Request Functions
export function getExpertVerificationRequests(): ExpertVerificationRequest[] {
  return readData<ExpertVerificationRequest[]>(STORAGE_KEYS.EXPERT_VERIFICATION_REQUESTS, [])
}

export function getExpertVerificationRequestById(requestId: string): ExpertVerificationRequest | undefined {
  return getExpertVerificationRequests().find((req) => req.id === requestId)
}

export function getExpertVerificationRequestByUserId(userId: string): ExpertVerificationRequest | undefined {
  return getExpertVerificationRequests().find((req) => req.userId === userId)
}

export function getPendingExpertVerificationRequests(): ExpertVerificationRequest[] {
  return getExpertVerificationRequests().filter((req) => req.status === "pending")
}

export function createExpertVerificationRequest(
  userId: string,
  credential: string,
  credentialFileUrls: string[],
  licenseNo?: string,
  region?: string
): ExpertVerificationRequest {
  const requests = getExpertVerificationRequests()
  
  // Check if user already has a pending request
  const existingRequest = requests.find((req) => req.userId === userId && req.status === "pending")
  if (existingRequest) {
    throw new Error("You already have a pending verification request")
  }
  
  // Check if user is already verified
  if (isExpertVerified(userId)) {
    throw new Error("You are already verified as an expert")
  }

  const request: ExpertVerificationRequest = {
    id: `evr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    status: "pending",
    credential,
    licenseNo,
    region,
    credentialFileUrls,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  requests.push(request)
  writeData(STORAGE_KEYS.EXPERT_VERIFICATION_REQUESTS, requests)

  return request
}

export function updateExpertVerificationRequest(
  requestId: string,
  updates: Partial<ExpertVerificationRequest>
): ExpertVerificationRequest | null {
  const requests = getExpertVerificationRequests()
  const index = requests.findIndex((req) => req.id === requestId)
  
  if (index === -1) {
    return null
  }

  requests[index] = {
    ...requests[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  writeData(STORAGE_KEYS.EXPERT_VERIFICATION_REQUESTS, requests)
  return requests[index]
}

export function approveExpertVerificationRequest(
  requestId: string,
  reviewerId: string
): { success: boolean; error?: string } {
  const request = getExpertVerificationRequestById(requestId)
  if (!request) {
    return { success: false, error: "Request not found" }
  }

  if (request.status !== "pending") {
    return { success: false, error: "Request is not pending" }
  }

  // Update request status
  updateExpertVerificationRequest(requestId, {
    status: "approved",
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
  })

  // Create or update expert profile
  const existingProfile = getExpertProfileByUserId(request.userId)
  const profile: ExpertProfile = {
    userId: request.userId,
    credential: request.credential,
    licenseNo: request.licenseNo,
    region: request.region,
    verifiedAt: new Date().toISOString(),
    credentialFileUrls: request.credentialFileUrls,
  }

  if (existingProfile) {
    updateExpertProfile(request.userId, profile)
  } else {
    addExpertProfile(profile)
  }

  return { success: true }
}

export function rejectExpertVerificationRequest(
  requestId: string,
  reviewerId: string,
  reason: string
): { success: boolean; error?: string } {
  const request = getExpertVerificationRequestById(requestId)
  if (!request) {
    return { success: false, error: "Request not found" }
  }

  if (request.status !== "pending") {
    return { success: false, error: "Request is not pending" }
  }

  updateExpertVerificationRequest(requestId, {
    status: "rejected",
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
    reason,
  })

  return { success: true }
}

export function getDraftRevisions(): WikiRevision[] {
  return getWikiRevisions().filter((r) => r.status === "draft")
}

export function getDraftRevisionsByArticleId(articleId: string): WikiRevision[] {
  return getWikiRevisionsByArticleId(articleId).filter((r) => r.status === "draft")
}

// Edit Request Functions
export function getEditRequests(): EditRequest[] {
  return readData<EditRequest[]>(STORAGE_KEYS.EDIT_REQUESTS, [])
}

export function getEditRequestById(id: string): EditRequest | undefined {
  return getEditRequests().find((req) => req.id === id)
}

export function getEditRequestsByType(type: string): EditRequest[] {
  return getEditRequests().filter((req) => req.type === type)
}

export function getPendingEditRequests(): EditRequest[] {
  return getEditRequests().filter((req) => req.status === "pending")
}

export function getEditRequestsByAuthor(authorId: string): EditRequest[] {
  return getEditRequests().filter((req) => req.authorId === authorId)
}

export function addEditRequest(request: EditRequest): void {
  const requests = getEditRequests()
  requests.push(request)
  writeData(STORAGE_KEYS.EDIT_REQUESTS, requests)
  
  // Create audit log entry
  addEditRequestAuditLog({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    editRequestId: request.id,
    action: "created",
    performedBy: request.authorId,
    performedAt: new Date().toISOString(),
  })
}

export function updateEditRequest(id: string, updates: Partial<EditRequest>): void {
  const requests = getEditRequests()
  const index = requests.findIndex((req) => req.id === id)
  if (index !== -1) {
    const oldRequest = requests[index]
    requests[index] = { ...oldRequest, ...updates }
    writeData(STORAGE_KEYS.EDIT_REQUESTS, requests)
    
    // Create audit log for status changes
    if (updates.status) {
      const action = updates.status === "approved" ? "approved" : "rejected"
      addEditRequestAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        editRequestId: id,
        action: action as "approved" | "rejected",
        performedBy: updates.reviewedBy || oldRequest.authorId,
        performedAt: new Date().toISOString(),
        reason: updates.reason,
      })
    }
    
    // Create audit log for priority changes
    if (updates.priority && updates.priority !== oldRequest.priority) {
      addEditRequestAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        editRequestId: id,
        action: "priority_changed",
        performedBy: updates.reviewedBy || oldRequest.authorId,
        performedAt: new Date().toISOString(),
        metadata: { oldPriority: oldRequest.priority, newPriority: updates.priority },
      })
    }
  }
}

export function deleteEditRequest(id: string): void {
  const requests = getEditRequests()
  const filtered = requests.filter((req) => req.id !== id)
  writeData(STORAGE_KEYS.EDIT_REQUESTS, filtered)
}

// Edit Request Audit Log Functions
export function getEditRequestAuditLogs(): EditRequestAuditLog[] {
  return readData<EditRequestAuditLog[]>(STORAGE_KEYS.EDIT_REQUEST_AUDIT_LOGS, [])
}

export function getEditRequestAuditLogsByRequestId(editRequestId: string): EditRequestAuditLog[] {
  return getEditRequestAuditLogs().filter((log) => log.editRequestId === editRequestId)
}

export function addEditRequestAuditLog(log: EditRequestAuditLog): void {
  const logs = getEditRequestAuditLogs()
  logs.push(log)
  writeData(STORAGE_KEYS.EDIT_REQUEST_AUDIT_LOGS, logs)
}

export function getEditRequestAuditLogById(id: string): EditRequestAuditLog | undefined {
  return getEditRequestAuditLogs().find((log) => log.id === id)
}

// Re-Review Request Functions
export function getReReviewRequests(): ReReviewRequest[] {
  return readData<ReReviewRequest[]>(STORAGE_KEYS.RE_REVIEW_REQUESTS, [])
}

export function getReReviewRequestById(id: string): ReReviewRequest | undefined {
  return getReReviewRequests().find((req) => req.id === id)
}

export function getReReviewRequestsByArticle(articleId: string): ReReviewRequest[] {
  return getReReviewRequests().filter((req) => req.articleId === articleId)
}

export function getPendingReReviewRequests(): ReReviewRequest[] {
  return getReReviewRequests().filter((req) => req.status === "pending")
}

export function getReReviewRequestsByRequester(requestedBy: string): ReReviewRequest[] {
  return getReReviewRequests().filter((req) => req.requestedBy === requestedBy)
}

export function requestReReview(params: {
  articleId: string
  requestedBy: string
  reason?: string
}): { success: boolean; error?: string; requestId?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  const article = getWikiArticles().find((a) => a.id === params.articleId)
  if (!article) {
    return { success: false, error: "Article not found" }
  }

  // Check if there's already a pending request for this article from this user
  const existingRequests = getReReviewRequestsByArticle(params.articleId)
  const userPendingRequest = existingRequests.find(
    (req) => req.requestedBy === params.requestedBy && req.status === "pending"
  )

  if (userPendingRequest) {
    return { success: false, error: "You already have a pending re-review request for this article" }
  }

  // Create new re-review request
  const request: ReReviewRequest = {
    id: `rereview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    articleId: params.articleId,
    requestedBy: params.requestedBy,
    status: "pending",
    reason: params.reason,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const requests = getReReviewRequests()
  requests.push(request)
  writeData(STORAGE_KEYS.RE_REVIEW_REQUESTS, requests)

  return { success: true, requestId: request.id }
}

export function updateReReviewRequest(
  id: string,
  updates: Partial<ReReviewRequest>
): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  const requests = getReReviewRequests()
  const index = requests.findIndex((req) => req.id === id)
  if (index === -1) {
    return { success: false, error: "Re-review request not found" }
  }

  requests[index] = {
    ...requests[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  writeData(STORAGE_KEYS.RE_REVIEW_REQUESTS, requests)
  return { success: true }
}

export function deleteReReviewRequest(id: string): void {
  const requests = getReReviewRequests()
  const filtered = requests.filter((req) => req.id !== id)
  writeData(STORAGE_KEYS.RE_REVIEW_REQUESTS, filtered)
}

// Flagged Revision Functions
export function getFlaggedRevisions(): FlaggedRevision[] {
  return readData<FlaggedRevision[]>(STORAGE_KEYS.FLAGGED_REVISIONS, [])
}

export function getFlaggedRevisionById(id: string): FlaggedRevision | undefined {
  return getFlaggedRevisions().find((fr) => fr.id === id)
}

export function getFlaggedRevisionsByStatus(status: FlaggedRevisionStatus): FlaggedRevision[] {
  return getFlaggedRevisions().filter((fr) => fr.status === status)
}

export function getPendingFlaggedRevisions(): FlaggedRevision[] {
  return getFlaggedRevisions().filter((fr) => fr.status === "pending" || fr.status === "flagged")
}

export function getFlaggedRevisionsByArticleId(articleId: string): FlaggedRevision[] {
  return getFlaggedRevisions().filter((fr) => fr.articleId === articleId)
}

export function getFlaggedRevisionsByRevisionId(revisionId: string): FlaggedRevision[] {
  return getFlaggedRevisions().filter((fr) => fr.revisionId === revisionId)
}

export function getFlaggedRevisionsByCategory(category: "health" | "regulatory"): FlaggedRevision[] {
  return getFlaggedRevisions().filter((fr) => fr.category === category)
}

export function addFlaggedRevision(flaggedRevision: FlaggedRevision): void {
  const flagged = getFlaggedRevisions()
  flagged.push(flaggedRevision)
  writeData(STORAGE_KEYS.FLAGGED_REVISIONS, flagged)
  
  // Create audit log entry
  addFlaggedRevisionAuditLog({
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    flaggedRevisionId: flaggedRevision.id,
    action: "flagged",
    performedBy: flaggedRevision.flaggedBy || "system",
    performedAt: new Date().toISOString(),
    rationale: flaggedRevision.flagReason,
    newStatus: flaggedRevision.status,
  })
}

export function updateFlaggedRevision(id: string, updates: Partial<FlaggedRevision>): void {
  const flagged = getFlaggedRevisions()
  const index = flagged.findIndex((fr) => fr.id === id)
  if (index !== -1) {
    const oldFlagged = flagged[index]
    const updatedAt = new Date().toISOString()
    flagged[index] = { ...oldFlagged, ...updates, updatedAt }
    writeData(STORAGE_KEYS.FLAGGED_REVISIONS, flagged)
    
    // Create audit log for status changes
    if (updates.status && updates.status !== oldFlagged.status) {
      addFlaggedRevisionAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flaggedRevisionId: id,
        action: updates.status === "approved" ? "approved" : updates.status === "rejected" ? "rejected" : "status_changed",
        performedBy: updates.reviewedBy || oldFlagged.flaggedBy || "system",
        performedAt: updatedAt,
        rationale: updates.rationale,
        previousStatus: oldFlagged.status,
        newStatus: updates.status,
      })
    }
    
    // Create audit log for priority changes
    if (updates.priority && updates.priority !== oldFlagged.priority) {
      addFlaggedRevisionAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flaggedRevisionId: id,
        action: "priority_changed",
        performedBy: updates.reviewedBy || oldFlagged.flaggedBy || "system",
        performedAt: updatedAt,
        previousPriority: oldFlagged.priority,
        newPriority: updates.priority,
      })
    }
    
    // Create audit log for note additions
    if (updates.notes && updates.notes !== oldFlagged.notes) {
      addFlaggedRevisionAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flaggedRevisionId: id,
        action: "note_added",
        performedBy: updates.reviewedBy || oldFlagged.flaggedBy || "system",
        performedAt: updatedAt,
        rationale: updates.notes,
      })
    }
  }
}

export function deleteFlaggedRevision(id: string): void {
  const flagged = getFlaggedRevisions()
  const filtered = flagged.filter((fr) => fr.id !== id)
  writeData(STORAGE_KEYS.FLAGGED_REVISIONS, filtered)
}

// Flagged Revision Audit Log Functions
export function getFlaggedRevisionAuditLogs(): FlaggedRevisionAuditLog[] {
  return readData<FlaggedRevisionAuditLog[]>(STORAGE_KEYS.FLAGGED_REVISION_AUDIT_LOGS, [])
}

export function getFlaggedRevisionAuditLogsByFlaggedRevisionId(flaggedRevisionId: string): FlaggedRevisionAuditLog[] {
  return getFlaggedRevisionAuditLogs()
    .filter((log) => log.flaggedRevisionId === flaggedRevisionId)
    .sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime())
}

export function addFlaggedRevisionAuditLog(log: FlaggedRevisionAuditLog): void {
  const logs = getFlaggedRevisionAuditLogs()
  logs.push(log)
  writeData(STORAGE_KEYS.FLAGGED_REVISION_AUDIT_LOGS, logs)
}

export function getFlaggedRevisionAuditLogById(id: string): FlaggedRevisionAuditLog | undefined {
  return getFlaggedRevisionAuditLogs().find((log) => log.id === id)
}

// Watch Functions
export function getWatchEntries(): WatchEntry[] {
  return readData<WatchEntry[]>(STORAGE_KEYS.WATCH_ENTRIES, [])
}

export function getWatchEntriesByUserId(userId: string): WatchEntry[] {
  return getWatchEntries().filter((entry) => entry.userId === userId && entry.enabled)
}

export function getWatchEntryByTarget(userId: string, targetId: string, targetType: "post" | "wiki"): WatchEntry | undefined {
  return getWatchEntries().find(
    (entry) => entry.userId === userId && entry.targetId === targetId && entry.targetType === targetType
  )
}

export function isWatching(userId: string, targetId: string, targetType: "post" | "wiki"): boolean {
  const entry = getWatchEntryByTarget(userId, targetId, targetType)
  return entry !== undefined && entry.enabled
}

export function addWatchEntry(entry: WatchEntry): void {
  const entries = getWatchEntries()
  entries.push(entry)
  writeData(STORAGE_KEYS.WATCH_ENTRIES, entries)
}

export function updateWatchEntry(id: string, updates: Partial<WatchEntry>): void {
  const entries = getWatchEntries()
  const index = entries.findIndex((entry) => entry.id === id)
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates, updatedAt: new Date().toISOString() }
    writeData(STORAGE_KEYS.WATCH_ENTRIES, entries)
  }
}

export function removeWatchEntry(id: string): void {
  const entries = getWatchEntries()
  const filtered = entries.filter((entry) => entry.id !== id)
  writeData(STORAGE_KEYS.WATCH_ENTRIES, filtered)
}

export function toggleWatch(userId: string, targetId: string, targetType: "post" | "wiki", watchEvents: string[]): WatchEntry {
  const existing = getWatchEntryByTarget(userId, targetId, targetType)
  
  if (existing) {
    // Toggle enabled state
    updateWatchEntry(existing.id, { enabled: !existing.enabled })
    return { ...existing, enabled: !existing.enabled }
  } else {
    // Create new watch entry
    const newEntry: WatchEntry = {
      id: `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      targetId,
      targetType,
      watchEvents,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addWatchEntry(newEntry)
    return newEntry
  }
}

export function getWatchEntriesForTarget(targetId: string, targetType: "post" | "wiki"): WatchEntry[] {
  return getWatchEntries().filter(
    (entry) => entry.targetId === targetId && entry.targetType === targetType && entry.enabled
  )
}

export function notifyWatchers(
  targetId: string,
  targetType: "post" | "wiki",
  eventType: "update" | "comment" | "reaction",
  actorId: string,
  actorName: string,
  targetTitle: string,
  eventData?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return
  
  const watchers = getWatchEntriesForTarget(targetId, targetType)
  
  watchers.forEach((watch) => {
    // Skip if the watcher is the actor
    if (watch.userId === actorId) return
    
    // Check if this event type is being watched
    if (!watch.watchEvents.includes(eventType)) return
    
    // Create notification for this watcher
    addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: watch.userId,
      type: "watch_update",
      actorId,
      targetId,
      targetType,
      message: eventType === "update"
        ? `${actorName} updated ${targetTitle}`
        : eventType === "comment"
        ? `${actorName} commented on ${targetTitle}`
        : `${actorName} reacted to ${targetTitle}`,
      read: false,
      createdAt: new Date().toISOString(),
      category: targetType === "post" ? "community" : "reminders",
      priority: "normal",
      channels: ["in_app", "email", "push"],
      metadata: {
        targetType,
        eventType,
        ...eventData,
      },
    })
  })
}

// Rollback History Operations
export function getRollbackHistory(): RollbackHistoryEntry[] {
  const history = readData<RollbackHistoryEntry[]>(STORAGE_KEYS.ROLLBACK_HISTORY, [])
  // Sort by date descending (newest first)
  return history.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
}

export function getRollbackHistoryByContentId(contentId: string): RollbackHistoryEntry[] {
  return getRollbackHistory()
    .filter((entry) => entry.contentId === contentId)
}

export function getRollbackHistoryByContentType(contentType: "blog" | "wiki"): RollbackHistoryEntry[] {
  return getRollbackHistory()
    .filter((entry) => entry.contentType === contentType)
}

export function addRollbackHistoryEntry(entry: RollbackHistoryEntry): void {
  const history = getRollbackHistory()
  history.push(entry)
  writeData(STORAGE_KEYS.ROLLBACK_HISTORY, history)
}

// Article Report Operations
export function reportArticle(params: {
  articleId: string
  contentType: "blog" | "wiki"
  reporterId: string
  reason: ArticleReportReason
  message?: string
}): { success: boolean; error?: string; reportId?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  const report: ArticleReport = {
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    reporterId: params.reporterId,
    reason: params.reason,
    message: params.message,
    reportedAt: new Date().toISOString(),
    status: "pending",
  }

  // Add report to the article
  if (params.contentType === "blog") {
    const post = getBlogPostById(params.articleId)
    if (!post) {
      return { success: false, error: "Blog post not found" }
    }
    const reports = post.reports || []
    reports.push(report)
    updateBlogPost({ ...post, reports })
  } else {
    // Try by ID first, then by slug
    const articles = getWikiArticles()
    let article = articles.find((a) => a.id === params.articleId)
    if (!article) {
      article = getWikiArticleBySlug(params.articleId)
    }
    if (!article) {
      return { success: false, error: "Article not found" }
    }
    const reports = article.reports || []
    reports.push(report)
    updateWikiArticle({ ...article, reports })
  }

  // Store in global reports list for moderation dashboard
  const allReports = getArticleReports()
  allReports.push(report)
  writeData(STORAGE_KEYS.ARTICLE_REPORTS, allReports)

  return { success: true, reportId: report.id }
}

export function getArticleReports(): ArticleReport[] {
  return readData<ArticleReport[]>(STORAGE_KEYS.ARTICLE_REPORTS, [])
}

export function getPendingArticleReports(): ArticleReport[] {
  return getArticleReports().filter((r) => r.status === "pending")
}

export function updateArticleReport(
  reportId: string,
  updates: Partial<ArticleReport>
): { success: boolean; error?: string } {
  const reports = getArticleReports()
  const index = reports.findIndex((r) => r.id === reportId)
  if (index === -1) {
    return { success: false, error: "Report not found" }
  }

  reports[index] = { ...reports[index], ...updates }
  writeData(STORAGE_KEYS.ARTICLE_REPORTS, reports)

  // Also update in the article itself
  const allBlogPosts = getBlogPosts()
  for (const post of allBlogPosts) {
    if (post.reports && post.reports.length > 0) {
      const reportIndex = post.reports.findIndex((r) => r.id === reportId)
      if (reportIndex !== -1) {
        const updatedReports = [...post.reports]
        updatedReports[reportIndex] = { ...updatedReports[reportIndex], ...updates }
        updateBlogPost({ ...post, reports: updatedReports })
        break
      }
    }
  }

  const allWikiArticles = getWikiArticles()
  for (const article of allWikiArticles) {
    if (article.reports && article.reports.length > 0) {
      const reportIndex = article.reports.findIndex((r) => r.id === reportId)
      if (reportIndex !== -1) {
        const updatedReports = [...article.reports]
        updatedReports[reportIndex] = { ...updatedReports[reportIndex], ...updates }
        updateWikiArticle({ ...article, reports: updatedReports })
        break
      }
    }
  }

  return { success: true }
}

// COI Flag Operations
export function addCOIFlag(params: {
  contentId: string
  contentType: "blog" | "wiki"
  flaggedBy: string
  reason: string
  details?: string
  severity: "low" | "medium" | "high" | "critical"
  relatedEntities?: string[]
}): { success: boolean; error?: string; flagId?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Not available in server context" }
  }

  const flag: COIFlag = {
    id: `coi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    flaggedBy: params.flaggedBy,
    flaggedAt: new Date().toISOString(),
    reason: params.reason,
    details: params.details,
    severity: params.severity,
    status: "active",
    relatedEntities: params.relatedEntities,
  }

  // Add flag to the article
  if (params.contentType === "blog") {
    const post = getBlogPostById(params.contentId)
    if (!post) {
      return { success: false, error: "Blog post not found" }
    }
    const flags = post.coiFlags || []
    flags.push(flag)
    updateBlogPost({ ...post, coiFlags: flags })
  } else {
    // Try by ID first, then by slug
    const articles = getWikiArticles()
    let article = articles.find((a) => a.id === params.contentId)
    if (!article) {
      article = getWikiArticleBySlug(params.contentId)
    }
    if (!article) {
      return { success: false, error: "Article not found" }
    }
    const flags = article.coiFlags || []
    flags.push(flag)
    updateWikiArticle({ ...article, coiFlags: flags })
  }

  // Store in global COI flags list
  const allFlags = getCOIFlags()
  allFlags.push(flag)
  writeData(STORAGE_KEYS.COI_FLAGS, allFlags)

  return { success: true, flagId: flag.id }
}

export function getCOIFlags(): COIFlag[] {
  return readData<COIFlag[]>(STORAGE_KEYS.COI_FLAGS, [])
}

export function getActiveCOIFlags(): COIFlag[] {
  return getCOIFlags().filter((f) => f.status === "active")
}

export function getCOIFlagsBySeverity(severity: "low" | "medium" | "high" | "critical"): COIFlag[] {
  return getActiveCOIFlags().filter((f) => f.severity === severity)
}

export function updateCOIFlag(
  flagId: string,
  updates: Partial<COIFlag>
): { success: boolean; error?: string } {
  const flags = getCOIFlags()
  const index = flags.findIndex((f) => f.id === flagId)
  if (index === -1) {
    return { success: false, error: "COI flag not found" }
  }

  flags[index] = { ...flags[index], ...updates }
  writeData(STORAGE_KEYS.COI_FLAGS, flags)

  // Also update in the article itself
  const allBlogPosts = getBlogPosts()
  for (const post of allBlogPosts) {
    if (post.coiFlags && post.coiFlags.length > 0) {
      const flagIndex = post.coiFlags.findIndex((f) => f.id === flagId)
      if (flagIndex !== -1) {
        const updatedFlags = [...post.coiFlags]
        updatedFlags[flagIndex] = { ...updatedFlags[flagIndex], ...updates }
        updateBlogPost({ ...post, coiFlags: updatedFlags })
        break
      }
    }
  }

  const allWikiArticles = getWikiArticles()
  for (const article of allWikiArticles) {
    if (article.coiFlags && article.coiFlags.length > 0) {
      const flagIndex = article.coiFlags.findIndex((f) => f.id === flagId)
      if (flagIndex !== -1) {
        const updatedFlags = [...article.coiFlags]
        updatedFlags[flagIndex] = { ...updatedFlags[flagIndex], ...updates }
        updateWikiArticle({ ...article, coiFlags: updatedFlags })
        break
      }
    }
  }

  return { success: true }
}

// Magic Link Token Storage Functions
export function getMagicLinkTokens(): MagicLinkToken[] {
  return storage.read<MagicLinkToken[]>(STORAGE_KEYS.MAGIC_LINK_TOKENS, [])
}

export function getMagicLinkToken(token: string): MagicLinkToken | undefined {
  const tokens = getMagicLinkTokens()
  return tokens.find((t) => t.token === token && !t.used && t.expiresAt > Date.now())
}

export function createMagicLinkToken(
  email: string,
  deviceInfo?: { ip?: string; userAgent?: string }
): MagicLinkToken {
  const tokens = getMagicLinkTokens()
  
  // Generate secure random token
  const randomBytes = new Uint8Array(32)
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomBytes)
  } else if (typeof crypto !== "undefined") {
    crypto.getRandomValues(randomBytes)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256)
    }
  }
  const token = Buffer.from(randomBytes)
    .toString("base64")
    .replace(/[+/=]/g, (c) => ({ "+": "-", "/": "_", "=": "" }[c] || c))
    .substring(0, 48)
  
  const magicLink: MagicLinkToken = {
    token,
    email: email.toLowerCase().trim(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    used: false,
    createdAt: Date.now(),
    deviceInfo,
  }
  
  tokens.push(magicLink)
  storage.write(STORAGE_KEYS.MAGIC_LINK_TOKENS, tokens)
  
  // Clean up expired tokens (older than 24 hours)
  const validTokens = tokens.filter(
    (t) => !t.used && (t.expiresAt > Date.now() || t.createdAt > Date.now() - 24 * 60 * 60 * 1000)
  )
  storage.write(STORAGE_KEYS.MAGIC_LINK_TOKENS, validTokens)
  
  return magicLink
}

export function markMagicLinkTokenAsUsed(token: string): boolean {
  const tokens = getMagicLinkTokens()
  const tokenIndex = tokens.findIndex((t) => t.token === token)
  
  if (tokenIndex === -1) {
    return false
  }
  
  tokens[tokenIndex].used = true
  storage.write(STORAGE_KEYS.MAGIC_LINK_TOKENS, tokens)
  return true
}

// Session Device Storage Functions
export function getSessionDevices(userId: string): SessionDevice[] {
  const allDevices = storage.read<SessionDevice[]>(STORAGE_KEYS.SESSION_DEVICES, [])
  return allDevices.filter((d) => d.userId === userId)
}

export function getSessionDevice(deviceId: string): SessionDevice | undefined {
  const allDevices = storage.read<SessionDevice[]>(STORAGE_KEYS.SESSION_DEVICES, [])
  return allDevices.find((d) => d.deviceId === deviceId)
}

export function createSessionDevice(
  userId: string,
  deviceInfo: {
    name: string
    type: "mobile" | "tablet" | "desktop" | "other"
    os?: string
    browser?: string
    ip?: string
  }
): SessionDevice {
  const allDevices = storage.read<SessionDevice[]>(STORAGE_KEYS.SESSION_DEVICES, [])
  
  // Mark all existing devices for this user as not current
  allDevices.forEach((d) => {
    if (d.userId === userId) {
      d.isCurrent = false
    }
  })
  
  const deviceId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const now = new Date().toISOString()
  
  const device: SessionDevice = {
    deviceId,
    userId,
    name: deviceInfo.name,
    type: deviceInfo.type,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    ip: deviceInfo.ip,
    lastActivity: now,
    createdAt: now,
    isCurrent: true,
  }
  
  allDevices.push(device)
  storage.write(STORAGE_KEYS.SESSION_DEVICES, allDevices)
  
  return device
}

export function updateSessionDeviceActivity(deviceId: string): void {
  const allDevices = storage.read<SessionDevice[]>(STORAGE_KEYS.SESSION_DEVICES, [])
  const device = allDevices.find((d) => d.deviceId === deviceId)
  
  if (device) {
    device.lastActivity = new Date().toISOString()
    storage.write(STORAGE_KEYS.SESSION_DEVICES, allDevices)
  }
}

export function revokeSessionDevice(deviceId: string, userId: string): boolean {
  const allDevices = storage.read<SessionDevice[]>(STORAGE_KEYS.SESSION_DEVICES, [])
  const deviceIndex = allDevices.findIndex(
    (d) => d.deviceId === deviceId && d.userId === userId
  )
  
  if (deviceIndex === -1) {
    return false
  }
  
  allDevices.splice(deviceIndex, 1)
  storage.write(STORAGE_KEYS.SESSION_DEVICES, allDevices)
  return true
}

export function revokeAllSessionDevices(userId: string, exceptDeviceId?: string): number {
  const allDevices = storage.read<SessionDevice[]>(STORAGE_KEYS.SESSION_DEVICES, [])
  const initialLength = allDevices.length
  
  const filtered = allDevices.filter(
    (d) => d.userId !== userId || (exceptDeviceId && d.deviceId === exceptDeviceId)
  )
  
  storage.write(STORAGE_KEYS.SESSION_DEVICES, filtered)
  return initialLength - filtered.length
}

// Announcement Functions
export function getAnnouncements(): Announcement[] {
  return readData<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, [])
}

export function getAnnouncementById(id: string): Announcement | undefined {
  return getAnnouncements().find((a) => a.id === id)
}

export function getActiveAnnouncements(userId?: string): Announcement[] {
  const now = new Date().toISOString()
  const announcements = getAnnouncements()
  
  return announcements
    .filter((announcement) => {
      // Filter by status
      if (announcement.status !== "active") return false
      
      // Filter by date range
      if (announcement.startDate && announcement.startDate > now) return false
      if (announcement.endDate && announcement.endDate < now) return false
      
      // Filter by target audience
      if (announcement.targetAudience === "logged-in" && !userId) return false
      if (announcement.targetAudience === "logged-out" && userId) return false
      
      return true
    })
    .sort((a, b) => {
      // Sort by priority: urgent > high > normal > low
      const priorityOrder: Record<string, number> = {
        urgent: 4,
        high: 3,
        normal: 2,
        low: 1,
      }
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    })
}

export function addAnnouncement(announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Announcement {
  const announcements = getAnnouncements()
  const now = new Date().toISOString()
  
  const newAnnouncement: Announcement = {
    ...announcement,
    id: generateStorageId("announcement"),
    createdAt: now,
    updatedAt: now,
  }
  
  announcements.push(newAnnouncement)
  writeData(STORAGE_KEYS.ANNOUNCEMENTS, announcements)
  
  return newAnnouncement
}

export function updateAnnouncement(id: string, updates: Partial<Announcement>): Announcement | null {
  const announcements = getAnnouncements()
  const index = announcements.findIndex((a) => a.id === id)
  
  if (index === -1) return null
  
  announcements[index] = {
    ...announcements[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  
  writeData(STORAGE_KEYS.ANNOUNCEMENTS, announcements)
  return announcements[index]
}

export function deleteAnnouncement(id: string): boolean {
  const announcements = getAnnouncements()
  const filtered = announcements.filter((a) => a.id !== id)
  
  if (filtered.length === announcements.length) return false
  
  writeData(STORAGE_KEYS.ANNOUNCEMENTS, filtered)
  return true
}

// Announcement Dismissal Functions
export function getAnnouncementDismissals(userId?: string): AnnouncementDismissal[] {
  const dismissals = readData<AnnouncementDismissal[]>(STORAGE_KEYS.ANNOUNCEMENT_DISMISSALS, [])
  const now = new Date().toISOString()
  
  // Filter by user and active dismissals (not expired)
  return dismissals.filter((d) => {
    if (userId && d.userId !== userId) return false
    if (!userId && d.userId !== undefined) return false // Session-based dismissals for anonymous users
    
    // Check if temporary dismissal has expired
    if (d.expiresAt && d.expiresAt < now) return false
    
    return true
  })
}

export function isAnnouncementDismissed(announcementId: string, userId?: string): boolean {
  const dismissals = getAnnouncementDismissals(userId)
  return dismissals.some((d) => d.announcementId === announcementId)
}

export function dismissAnnouncement(
  announcementId: string,
  userId?: string,
  dismissalPolicy: AnnouncementDismissalPolicy = "permanent"
): void {
  const dismissals = readData<AnnouncementDismissal[]>(STORAGE_KEYS.ANNOUNCEMENT_DISMISSALS, [])
  const now = new Date().toISOString()
  
  // Remove existing dismissal for this announcement and user
  const filtered = dismissals.filter(
    (d) => !(d.announcementId === announcementId && d.userId === userId)
  )
  
  // Calculate expiration based on dismissal policy
  let expiresAt: string | undefined
  if (dismissalPolicy === "temporary") {
    // Temporary dismissals expire after 24 hours
    const expiryDate = new Date()
    expiryDate.setHours(expiryDate.getHours() + 24)
    expiresAt = expiryDate.toISOString()
  } else if (dismissalPolicy === "session") {
    // Session dismissals expire after browser session (we'll handle this in the component)
    // For now, we'll set a short expiry (handled by component clearing on refresh)
    expiresAt = undefined
  }
  
  const dismissal: AnnouncementDismissal = {
    announcementId,
    userId,
    dismissedAt: now,
    expiresAt,
  }
  
  filtered.push(dismissal)
  writeData(STORAGE_KEYS.ANNOUNCEMENT_DISMISSALS, filtered)
}

export function clearExpiredDismissals(): void {
  const dismissals = readData<AnnouncementDismissal[]>(STORAGE_KEYS.ANNOUNCEMENT_DISMISSALS, [])
  const now = new Date().toISOString()
  
  const active = dismissals.filter((d) => {
    if (!d.expiresAt) return true // Permanent dismissals
    return d.expiresAt >= now
  })
  
  writeData(STORAGE_KEYS.ANNOUNCEMENT_DISMISSALS, active)
}

// Source Functions
export function getSources(): Source[] {
  return readData<Source[]>(STORAGE_KEYS.SOURCES, [])
}

export function getSourceById(id: string): Source | undefined {
  return getSources().find((source) => source.id === id)
}

export function addSource(source: Source): void {
  const sources = getSources()
  sources.push(source)
  writeData(STORAGE_KEYS.SOURCES, sources)
}

export function updateSource(id: string, updates: Partial<Source>): void {
  const sources = getSources()
  const index = sources.findIndex((source) => source.id === id)
  if (index !== -1) {
    sources[index] = { ...sources[index], ...updates }
    writeData(STORAGE_KEYS.SOURCES, sources)
  }
}

export function deleteSource(id: string): void {
  const sources = getSources()
  const filtered = sources.filter((source) => source.id !== id)
  writeData(STORAGE_KEYS.SOURCES, filtered)
}

// Moderation Queue Storage Functions
export function getModerationQueueItems(): ModerationQueueItem[] {
  return readData<ModerationQueueItem[]>(STORAGE_KEYS.MODERATION_QUEUE, [])
}

export function addModerationQueueItem(item: ModerationQueueItem): void {
  const items = getModerationQueueItems()
  items.push(item)
  writeData(STORAGE_KEYS.MODERATION_QUEUE, items)
}

export function updateModerationQueueItem(id: string, updates: Partial<ModerationQueueItem>): void {
  const items = getModerationQueueItems()
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() }
    writeData(STORAGE_KEYS.MODERATION_QUEUE, items)
  }
}

export function deleteModerationQueueItem(id: string): void {
  const items = getModerationQueueItems()
  const filtered = items.filter((item) => item.id !== id)
  writeData(STORAGE_KEYS.MODERATION_QUEUE, filtered)
}

export function getModerationActionLogs(): ModerationActionLogType[] {
  return readData<ModerationActionLogType[]>(STORAGE_KEYS.MODERATION_ACTION_LOGS, [])
}

export function addModerationActionLog(log: ModerationActionLogType): void {
  const logs = getModerationActionLogs()
  logs.push(log)
  writeData(STORAGE_KEYS.MODERATION_ACTION_LOGS, logs)
}

export function getSoftDeleteRecords(): SoftDeleteRecord[] {
  return readData<SoftDeleteRecord[]>(STORAGE_KEYS.SOFT_DELETE_RECORDS, [])
}

export function addSoftDeleteRecord(record: SoftDeleteRecord): void {
  const records = getSoftDeleteRecords()
  records.push(record)
  writeData(STORAGE_KEYS.SOFT_DELETE_RECORDS, records)
}

export function deleteSoftDeleteRecord(id: string): void {
  const records = getSoftDeleteRecords()
  const filtered = records.filter((record) => record.id !== id)
  writeData(STORAGE_KEYS.SOFT_DELETE_RECORDS, filtered)
}

// Integration Operations
export function getIntegrationSettings(): IntegrationSettings {
  return readData<IntegrationSettings>(STORAGE_KEYS.INTEGRATIONS, {
    webhooks: [],
    apiKeys: [],
  })
}

export function saveIntegrationSettings(settings: IntegrationSettings): void {
  writeData(STORAGE_KEYS.INTEGRATIONS, settings)
}

// Webhook Operations
export function getWebhooks(): Webhook[] {
  const settings = getIntegrationSettings()
  return settings.webhooks
}

export function getWebhookById(webhookId: string): Webhook | null {
  const webhooks = getWebhooks()
  return webhooks.find((w) => w.id === webhookId) || null
}

export function createWebhook(webhook: Omit<Webhook, "id" | "createdAt" | "updatedAt">): Webhook {
  const settings = getIntegrationSettings()
  const newWebhook: Webhook = {
    ...webhook,
    id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryHistory: [],
  }
  settings.webhooks.push(newWebhook)
  saveIntegrationSettings(settings)
  return newWebhook
}

export function updateWebhook(webhookId: string, updates: Partial<Webhook>): { success: boolean; error?: string } {
  const settings = getIntegrationSettings()
  const index = settings.webhooks.findIndex((w) => w.id === webhookId)
  if (index === -1) {
    return { success: false, error: "Webhook not found" }
  }
  settings.webhooks[index] = {
    ...settings.webhooks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  saveIntegrationSettings(settings)
  return { success: true }
}

export function deleteWebhook(webhookId: string): { success: boolean; error?: string } {
  const settings = getIntegrationSettings()
  const index = settings.webhooks.findIndex((w) => w.id === webhookId)
  if (index === -1) {
    return { success: false, error: "Webhook not found" }
  }
  settings.webhooks.splice(index, 1)
  saveIntegrationSettings(settings)
  return { success: true }
}

export function addWebhookDelivery(webhookId: string, delivery: WebhookDelivery): void {
  const webhook = getWebhookById(webhookId)
  if (!webhook) return
  if (!webhook.deliveryHistory) {
    webhook.deliveryHistory = []
  }
  webhook.deliveryHistory.push(delivery)
  // Keep only last 50 deliveries
  if (webhook.deliveryHistory.length > 50) {
    webhook.deliveryHistory = webhook.deliveryHistory.slice(-50)
  }
  webhook.lastDeliveryAt = delivery.createdAt
  webhook.lastDeliveryStatus = delivery.status === "success" ? "success" : "failed"
  updateWebhook(webhookId, webhook)
}

// API Key Operations
export function getApiKeys(): ApiKey[] {
  const settings = getIntegrationSettings()
  return settings.apiKeys
}

export function getApiKeyById(keyId: string): ApiKey | null {
  const keys = getApiKeys()
  return keys.find((k) => k.id === keyId) || null
}

export function createApiKey(
  name: string,
  scopes: string[],
  expiresAt?: string
): { success: boolean; error?: string; apiKey?: ApiKey } {
  const settings = getIntegrationSettings()
  
  // Generate API key (32 random bytes as hex string = 64 characters)
  const keyBytes = new Uint8Array(32)
  crypto.getRandomValues(keyBytes)
  const key = Array.from(keyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  
  const newApiKey: ApiKey = {
    id: `ak_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    name,
    key,
    keyPrefix: key.substring(0, 8),
    scopes,
    createdAt: new Date().toISOString(),
    expiresAt,
    isActive: true,
  }
  
  settings.apiKeys.push(newApiKey)
  saveIntegrationSettings(settings)
  
  return { success: true, apiKey: newApiKey }
}

export function updateApiKey(keyId: string, updates: Partial<ApiKey>): { success: boolean; error?: string } {
  const settings = getIntegrationSettings()
  const index = settings.apiKeys.findIndex((k) => k.id === keyId)
  if (index === -1) {
    return { success: false, error: "API key not found" }
  }
  settings.apiKeys[index] = { ...settings.apiKeys[index], ...updates }
  saveIntegrationSettings(settings)
  return { success: true }
}

export function deleteApiKey(keyId: string): { success: boolean; error?: string } {
  const settings = getIntegrationSettings()
  const index = settings.apiKeys.findIndex((k) => k.id === keyId)
  if (index === -1) {
    return { success: false, error: "API key not found" }
  }
  settings.apiKeys.splice(index, 1)
  saveIntegrationSettings(settings)
  return { success: true }
}

export function revokeApiKey(keyId: string): { success: boolean; error?: string } {
  return updateApiKey(keyId, { isActive: false })
}

export function activateApiKey(keyId: string): { success: boolean; error?: string } {
  return updateApiKey(keyId, { isActive: true })
}

// Pinned Items Operations
export function getPinnedItems(): PinnedItem[] {
  return readData<PinnedItem[]>(STORAGE_KEYS.PINNED_ITEMS, [])
}

export function isItemPinned(type: PinnedItemType, itemId: string): boolean {
  const items = getPinnedItems()
  return items.some((item) => item.type === type && item.itemId === itemId)
}

export function addPinnedItem(
  type: PinnedItemType,
  itemId: string,
  metadata?: { title?: string; description?: string; image?: string }
): { success: boolean; error?: string } {
  const items = getPinnedItems()
  
  // Check if already pinned
  if (isItemPinned(type, itemId)) {
    return { success: false, error: "Item is already pinned" }
  }

  const newItem: PinnedItem = {
    id: generateStorageId("pinned"),
    type,
    itemId,
    pinnedAt: new Date().toISOString(),
    ...metadata,
  }

  items.push(newItem)
  writeData(STORAGE_KEYS.PINNED_ITEMS, items)
  return { success: true }
}

export function removePinnedItem(type: PinnedItemType, itemId: string): { success: boolean; error?: string } {
  const items = getPinnedItems()
  const filtered = items.filter((item) => !(item.type === type && item.itemId === itemId))
  
  if (filtered.length === items.length) {
    return { success: false, error: "Item is not pinned" }
  }

  writeData(STORAGE_KEYS.PINNED_ITEMS, filtered)
  return { success: true }
}

export function togglePinnedItem(
  type: PinnedItemType,
  itemId: string,
  metadata?: { title?: string; description?: string; image?: string }
): { success: boolean; error?: string; isPinned: boolean } {
  const isPinned = isItemPinned(type, itemId)
  
  if (isPinned) {
    const result = removePinnedItem(type, itemId)
    return { ...result, isPinned: false }
  } else {
    const result = addPinnedItem(type, itemId, metadata)
    return { ...result, isPinned: true }
  }
}

// Care Guides Storage Functions

function getCareGuides(): CareGuide[] {
  const guides = readData<CareGuide[]>(STORAGE_KEYS.CARE_GUIDES, [])
  if (guides.length === 0 && isBrowser) {
    // Initialize with mock data on first load
    writeData(STORAGE_KEYS.CARE_GUIDES, mockCareGuides)
    return mockCareGuides
  }
  return guides
}

function writeCareGuides(guides: CareGuide[]): void {
  writeData(STORAGE_KEYS.CARE_GUIDES, guides)
}

export function getAllCareGuides(): CareGuide[] {
  return getCareGuides()
}

export function getCareGuideBySlug(slug: string): CareGuide | null {
  const guides = getCareGuides()
  return guides.find((guide) => guide.slug === slug) || null
}

export function getCareGuidesByCategory(category: CareGuideCategory): CareGuide[] {
  const guides = getCareGuides()
  return guides.filter((guide) => guide.category === category)
}

export function getCareGuidesBySpecies(species: string): CareGuide[] {
  const guides = getCareGuides()
  return guides.filter((guide) => guide.species.includes(species as any))
}

export function incrementCareGuideViews(slug: string): void {
  const guides = getCareGuides()
  const guide = guides.find((g) => g.slug === slug)
  if (guide) {
    guide.views += 1
    writeCareGuides(guides)
  }
}

export function toggleCareGuideLike(slug: string, userId: string): { success: boolean; isLiked: boolean } {
  const guides = getCareGuides()
  const guide = guides.find((g) => g.slug === slug)
  
  if (!guide) {
    return { success: false, isLiked: false }
  }
  
  const index = guide.likes.indexOf(userId)
  if (index > -1) {
    guide.likes.splice(index, 1)
    writeCareGuides(guides)
    return { success: true, isLiked: false }
  } else {
    guide.likes.push(userId)
    writeCareGuides(guides)
    return { success: true, isLiked: true }
  }
}
