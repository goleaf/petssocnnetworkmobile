import type { 
  User, 
  Pet, 
  FeedPost,
  BlogPost, 
  Comment, 
  WikiArticle, 
  Activity, 
  ReactionType,
  Group,
  GroupMember,
  GroupTopic,
  GroupPoll,
  PollVote,
  GroupEvent,
  EventRSVP,
  GroupResource,
  GroupActivity,
  GroupCategory,
  GroupMemberRole,
  GroupWarning,
  GroupBan,
  ModerationAction
} from "./types"
import { 
  mockUsers, 
  mockPets, 
  mockBlogPosts, 
  mockComments, 
  mockWikiArticles,
  mockGroups,
  mockGroupMembers,
  mockGroupTopics,
  mockGroupPolls,
  mockPollVotes,
  mockGroupEvents,
  mockEventRSVPs,
  mockGroupResources,
  mockGroupCategories
} from "./mock-data"

// Cache management import - avoid circular dependency with lazy loading
let invalidateCacheFn: (() => void) | null = null

if (typeof window !== "undefined") {
  import("./cache").then((module) => {
    invalidateCacheFn = module.invalidateCache
  })
}

const STORAGE_KEYS = {
  USERS: "pet_social_users",
  PETS: "pet_social_pets",
  FEED_POSTS: "pet_social_feed_posts",
  BLOG_POSTS: "pet_social_blog_posts",
  COMMENTS: "pet_social_comments",
  WIKI_ARTICLES: "pet_social_wiki_articles",
  ACTIVITIES: "pet_social_activities",
  CURRENT_USER: "pet_social_current_user",
  GROUPS: "pet_social_groups",
  GROUP_MEMBERS: "pet_social_group_members",
  GROUP_TOPICS: "pet_social_group_topics",
  GROUP_POLLS: "pet_social_group_polls",
  POLL_VOTES: "pet_social_poll_votes",
  GROUP_EVENTS: "pet_social_group_events",
  EVENT_RSVPS: "pet_social_event_rsvps",
  GROUP_RESOURCES: "pet_social_group_resources",
  GROUP_ACTIVITIES: "pet_social_group_activities",
  GROUP_CATEGORIES: "pet_social_group_categories",
  GROUP_WARNINGS: "pet_social_group_warnings",
  GROUP_BANS: "pet_social_group_bans",
  MODERATION_ACTIONS: "pet_social_moderation_actions",
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

// Helper function to generate slug from group name
export function generateGroupSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

// Initialize storage with mock data if empty
export function initializeStorage() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers))
  }
  if (!localStorage.getItem(STORAGE_KEYS.PETS)) {
    // Generate slugs for all pets if they don't have them
    const petsWithSlugs = mockPets.map((pet) => ({
      ...pet,
      slug: pet.slug || generatePetSlug(pet.name),
    }))
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(petsWithSlugs))
  } else {
    // Ensure existing pets have slugs
    const existingPets = JSON.parse(localStorage.getItem(STORAGE_KEYS.PETS) || "[]") as Pet[]
    const updatedPets = existingPets.map((pet) => ({
      ...pet,
      slug: pet.slug || generatePetSlug(pet.name),
    }))
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updatedPets))
  }
  if (!localStorage.getItem(STORAGE_KEYS.FEED_POSTS)) {
    localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)) {
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(mockBlogPosts))
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(mockComments))
  }
  if (!localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES)) {
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(mockWikiArticles))
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]))
  }
  
  // Initialize group categories
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_CATEGORIES, JSON.stringify(mockGroupCategories))
  }
  
  // Initialize groups
  if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(mockGroups))
  }
  
  // Initialize group members
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_MEMBERS)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_MEMBERS, JSON.stringify(mockGroupMembers))
  }
  
  // Initialize group topics
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_TOPICS)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_TOPICS, JSON.stringify(mockGroupTopics))
  }
  
  // Initialize group polls
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_POLLS)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_POLLS, JSON.stringify(mockGroupPolls))
  }
  
  // Initialize poll votes
  if (!localStorage.getItem(STORAGE_KEYS.POLL_VOTES)) {
    localStorage.setItem(STORAGE_KEYS.POLL_VOTES, JSON.stringify(mockPollVotes))
  }
  
  // Initialize group events
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_EVENTS)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_EVENTS, JSON.stringify(mockGroupEvents))
  }
  
  // Initialize event RSVPs
  if (!localStorage.getItem(STORAGE_KEYS.EVENT_RSVPS)) {
    localStorage.setItem(STORAGE_KEYS.EVENT_RSVPS, JSON.stringify(mockEventRSVPs))
  }
  
  // Initialize group resources
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_RESOURCES)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_RESOURCES, JSON.stringify(mockGroupResources))
  }
  
  // Initialize group activities
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_ACTIVITIES)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_ACTIVITIES, JSON.stringify([]))
  }
  
  // Initialize group warnings
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_WARNINGS)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_WARNINGS, JSON.stringify([]))
  }
  
  // Initialize group bans
  if (!localStorage.getItem(STORAGE_KEYS.GROUP_BANS)) {
    localStorage.setItem(STORAGE_KEYS.GROUP_BANS, JSON.stringify([]))
  }
  
  // Initialize moderation actions
  if (!localStorage.getItem(STORAGE_KEYS.MODERATION_ACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.MODERATION_ACTIONS, JSON.stringify([]))
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
  return data ? JSON.parse(data) : []
}

export function getUserByUsername(username: string): User | undefined {
  return getUsers().find((u) => u.username === username)
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function updateUser(userId: string, updates: Partial<User>) {
  if (typeof window === "undefined") return
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
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
  if (following.blockedUsers?.includes(followerId) || follower.blockedUsers?.includes(followingId)) {
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

  users[userIndex] = user
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
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

  users[userIndex] = user
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

// Pet operations
export function getPets(): Pet[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PETS)
  return data ? JSON.parse(data) : []
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

export function updatePet(pet: Pet) {
  if (typeof window === "undefined") return
  const pets = getPets()
  const index = pets.findIndex((p) => p.id === pet.id)
  if (index !== -1) {
    pets[index] = pet
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
  }
}

export function addPet(pet: Pet) {
  if (typeof window === "undefined") return
  const pets = getPets()
  // Generate slug if not provided
  if (!pet.slug) {
    pet.slug = generatePetSlug(pet.name)
  }
  pets.push(pet)
  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
}

export function deletePet(petId: string) {
  if (typeof window === "undefined") return
  const pets = getPets().filter((p) => p.id !== petId)
  localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets))
}

// Feed post operations
export function getFeedPosts(): FeedPost[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.FEED_POSTS)
  return data ? JSON.parse(data) : []
}

export function getFeedPostById(id: string): FeedPost | undefined {
  return getFeedPosts().find((p) => p.id === id)
}

export function getFeedPostsByPetId(petId: string): FeedPost[] {
  return getFeedPosts().filter((p) => p.petId === petId)
}

export function getFeedPostsByAuthorId(authorId: string): FeedPost[] {
  return getFeedPosts().filter((p) => p.authorId === authorId)
}

export function addFeedPost(post: FeedPost) {
  if (typeof window === "undefined") return
  const posts = getFeedPosts()
  posts.unshift(post)
  localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(posts))
}

export function updateFeedPost(post: FeedPost, userId?: string) {
  if (typeof window === "undefined") return
  
  // Validate ownership - only the author can update their post
  if (userId && post.authorId !== userId) {
    throw new Error("You can only edit your own posts")
  }
  
  const posts = getFeedPosts()
  const existingPost = posts.find((p) => p.id === post.id)
  
  // Verify the post exists and user owns it
  if (!existingPost) {
    throw new Error("Post not found")
  }
  
  if (userId && existingPost.authorId !== userId) {
    throw new Error("You can only edit your own posts")
  }
  
  const index = posts.findIndex((p) => p.id === post.id)
  if (index !== -1) {
    posts[index] = {
      ...post,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(posts))
    if (invalidateCacheFn) invalidateCacheFn()
  }
}

export function deleteFeedPost(postId: string, userId?: string) {
  if (typeof window === "undefined") return
  
  const posts = getFeedPosts()
  const post = posts.find((p) => p.id === postId)
  
  if (!post) {
    throw new Error("Post not found")
  }
  
  // Validate ownership - only the author can delete their post
  if (userId && post.authorId !== userId) {
    throw new Error("You can only delete your own posts")
  }
  
  const filteredPosts = posts.filter((p) => p.id !== postId)
  localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(filteredPosts))
  if (invalidateCacheFn) invalidateCacheFn()
}

/**
 * Generate fake feed posts for sarahpaws (user ID "1")
 * This is useful for testing and demonstration purposes
 */
export function generateFakeFeedPostsForUser(userId: string) {
  if (typeof window === "undefined") return

  // Clear existing feed posts for this user first
  const existingPosts = getFeedPosts()
  const filteredPosts = existingPosts.filter((p) => p.authorId !== userId)
  localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(filteredPosts))

  // Get user's pets
  const userPets = getPetsByOwnerId(userId)
  if (userPets.length === 0) return

  const now = new Date()
  const fakePosts: FeedPost[] = []

  // Generate posts for Max (pet ID "1")
  const maxPet = userPets.find((p) => p.id === "1")
  if (maxPet) {
    fakePosts.push({
      id: `feed_${Date.now()}_max1`,
      petId: "1",
      authorId: userId,
      content: "Max had an amazing day at the beach today! He loves swimming and playing fetch in the waves 🌊🐕 #goldenretriever #beachday #max",
      likes: ["2", "3", "4"],
      reactions: {
        like: ["2", "3"],
        love: ["4"],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
      updatedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      privacy: "public",
      hashtags: ["goldenretriever", "beachday", "max"],
    })

    fakePosts.push({
      id: `feed_${Date.now()}_max2`,
      petId: "1",
      authorId: userId,
      content: "Max just aced his agility training session! So proud of this smart boy 🏆 #agilitytraining #dogtraining #proudmom",
      likes: ["2", "5", "6"],
      reactions: {
        like: ["2", "5"],
        love: ["6"],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(), // 5 hours ago
      updatedAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
      privacy: "public",
      hashtags: ["agilitytraining", "dogtraining", "proudmom"],
    })

    fakePosts.push({
      id: `feed_${Date.now()}_max3`,
      petId: "1",
      authorId: userId,
      content: "Max made so many new friends at the dog park today! He's such a social butterfly 🦋 #dogpark #social #goldenretriever",
      likes: ["3", "4", "7"],
      reactions: {
        like: ["3", "4"],
        love: ["7"],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(), // 1 day ago
      updatedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      privacy: "public",
      hashtags: ["dogpark", "social", "goldenretriever"],
    })

    fakePosts.push({
      id: `feed_${Date.now()}_max4`,
      petId: "1",
      authorId: userId,
      content: "Max's favorite snack time! Can't get enough of these carrots 🥕 #healthy #snacks #goldenretriever",
      likes: ["2", "8"],
      reactions: {
        like: ["2", "8"],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(), // 2 days ago
      updatedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      privacy: "public",
      hashtags: ["healthy", "snacks", "goldenretriever"],
    })
  }

  // Generate posts for Luna (pet ID "2")
  const lunaPet = userPets.find((p) => p.id === "2")
  if (lunaPet) {
    fakePosts.push({
      id: `feed_${Date.now()}_luna1`,
      petId: "2",
      authorId: userId,
      content: "Luna learned a new trick today! She's so eager to learn 🎓 #luna #tricks #smartdog",
      likes: ["3", "4", "5"],
      reactions: {
        like: ["3", "4"],
        love: ["5"],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 30 * 60000).toISOString(), // 30 minutes ago
      updatedAt: new Date(now.getTime() - 30 * 60000).toISOString(),
      privacy: "public",
      hashtags: ["luna", "tricks", "smartdog"],
    })

    fakePosts.push({
      id: `feed_${Date.now()}_luna2`,
      petId: "2",
      authorId: userId,
      content: "Luna and Max playing together in the backyard! Best siblings ever 💕 #siblings #playtime #goldenretrievers",
      likes: ["2", "6", "7", "8"],
      reactions: {
        like: ["2", "6"],
        love: ["7", "8"],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
      updatedAt: new Date(now.getTime() - 4 * 3600000).toISOString(),
      privacy: "public",
      hashtags: ["siblings", "playtime", "goldenretrievers"],
    })

    fakePosts.push({
      id: `feed_${Date.now()}_luna3`,
      petId: "2",
      authorId: userId,
      content: "Luna's first agility class was a huge success! She's a natural athlete 🏃‍♀️ #agility #firstclass #proudmom",
      likes: ["4", "5"],
      reactions: {
        like: ["4", "5"],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(), // 3 days ago
      updatedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      privacy: "public",
      hashtags: ["agility", "firstclass", "proudmom"],
    })

    fakePosts.push({
      id: `feed_${Date.now()}_luna4`,
      petId: "2",
      authorId: userId,
      content: "Luna enjoying some frozen blueberries on this hot day! Her favorite summer treat 🫐 #summer #treats #luna",
      likes: ["3", "6"],
      reactions: {
        like: ["3", "6"],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date(now.getTime() - 4 * 86400000).toISOString(), // 4 days ago
      updatedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
      privacy: "public",
      hashtags: ["summer", "treats", "luna"],
    })
  }

  // Generate some posts with both pets
  fakePosts.push({
    id: `feed_${Date.now()}_both1`,
    petId: "1", // Using Max as primary, but mentioning both
    authorId: userId,
    content: "Max and Luna had an amazing hike today! They both did so well on the trail 🏔️ #hiking #adventure #goldenretrievers",
    likes: ["2", "3", "4", "5", "6"],
    reactions: {
      like: ["2", "3", "4"],
      love: ["5", "6"],
      laugh: [],
      wow: [],
      sad: [],
      angry: [],
    },
    createdAt: new Date(now.getTime() - 6 * 3600000).toISOString(), // 6 hours ago
    updatedAt: new Date(now.getTime() - 6 * 3600000).toISOString(),
    privacy: "public",
    hashtags: ["hiking", "adventure", "goldenretrievers"],
  })

  fakePosts.push({
    id: `feed_${Date.now()}_both2`,
    petId: "2", // Using Luna as primary
    authorId: userId,
    content: "Family photo time! Max and Luna are growing up so fast 🐕🐕 #family #photoshoot #goldenretrievers",
    likes: ["2", "4", "7", "8", "9"],
    reactions: {
      like: ["2", "4", "7"],
      love: ["8", "9"],
      laugh: [],
      wow: [],
      sad: [],
      angry: [],
    },
    createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(), // 5 days ago
    updatedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    privacy: "public",
    hashtags: ["family", "photoshoot", "goldenretrievers"],
  })

  // Add all posts
  fakePosts.forEach((post) => {
    addFeedPost(post)
  })

  return fakePosts.length
}

export function toggleFeedPostReaction(postId: string, userId: string, reactionType: string) {
  if (typeof window === "undefined") return
  const posts = getFeedPosts()
  const index = posts.findIndex((p) => p.id === postId)
  if (index !== -1) {
    const post = posts[index]
    
    // Initialize reactions object if it doesn't exist
    if (!post.reactions) {
      post.reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      }
    }
    
    // Initialize likes array for backward compatibility
    if (!post.likes) {
      post.likes = []
    }
    
    const reactions = post.reactions
    const reactionArray = reactions[reactionType as keyof typeof reactions] || []
    const hasReacted = reactionArray.includes(userId)
    
    if (hasReacted) {
      // Remove reaction
      reactions[reactionType as keyof typeof reactions] = reactionArray.filter((id) => id !== userId)
      // Remove from likes if it was a like
      if (reactionType === "like") {
        post.likes = post.likes.filter((id) => id !== userId)
      }
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
      // Update likes for backward compatibility
      if (reactionType === "like") {
        post.likes = [...post.likes.filter((id) => id !== userId), userId]
      } else {
        // Remove from likes if it was previously liked
        post.likes = post.likes.filter((id) => id !== userId)
      }
    }
    
    posts[index] = post
    localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(posts))
  }
}

// Blog post operations
export function getBlogPosts(): BlogPost[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)
  return data ? JSON.parse(data) : []
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
  posts.unshift(post)
  localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
}

export function updateBlogPost(post: BlogPost) {
  if (typeof window === "undefined") return
  const posts = getBlogPosts()
  const index = posts.findIndex((p) => p.id === post.id)
  if (index !== -1) {
    posts[index] = post
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
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
    if (!posts[index].reactions) {
      posts[index].reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      }
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
    }
    localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(posts))
  }
}

// Comment operations
export function getComments(): Comment[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.COMMENTS)
  return data ? JSON.parse(data) : []
}

export function getCommentsByPostId(postId: string): Comment[] {
  return getComments().filter((c) => c.postId === postId)
}

export function getCommentsByFeedPostId(feedPostId: string): Comment[] {
  return getComments().filter((c) => c.feedPostId === feedPostId)
}

export function getCommentsByWikiArticleId(articleId: string): Comment[] {
  return getComments().filter((c) => c.wikiArticleId === articleId)
}

export function getCommentsByPetPhotoId(petPhotoId: string): Comment[] {
  return getComments().filter((c) => c.petPhotoId === petPhotoId)
}

export function addComment(comment: Comment) {
  if (typeof window === "undefined") return
  const comments = getComments()
  comments.push(comment)
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
}

export function updateComment(commentId: string, content: string) {
  if (typeof window === "undefined") return
  const comments = getComments()
  const index = comments.findIndex((c) => c.id === commentId)
  if (index !== -1) {
    comments[index].content = content
    comments[index].updatedAt = new Date().toISOString()
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
    if (!comments[index].reactions) {
      comments[index].reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      }
    }
    const reactions = comments[index].reactions!
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
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments))
  }
}

// Wiki operations
export function getWikiArticles(): WikiArticle[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.WIKI_ARTICLES)
  return data ? JSON.parse(data) : []
}

export function getWikiArticleBySlug(slug: string): WikiArticle | undefined {
  return getWikiArticles().find((a) => a.slug === slug)
}

export function getWikiArticlesByCategory(category: string): WikiArticle[] {
  return getWikiArticles().filter((a) => a.category === category)
}

// Helper function to generate slug from wiki article title
export function generateWikiSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
}

export function addWikiArticle(article: WikiArticle) {
  if (typeof window === "undefined") return
  const articles = getWikiArticles()
  // Generate slug if not provided
  if (!article.slug) {
    article.slug = generateWikiSlug(article.title)
  }
  articles.push(article)
  localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(articles))
}

export function updateWikiArticle(article: WikiArticle) {
  if (typeof window === "undefined") return
  const articles = getWikiArticles()
  const index = articles.findIndex((a) => a.id === article.id)
  if (index !== -1) {
    articles[index] = article
    localStorage.setItem(STORAGE_KEYS.WIKI_ARTICLES, JSON.stringify(articles))
  }
}

// Photo reactions - stored per photo
export function getPhotoReactions(petId: string, photoIndex: number): Record<ReactionType, string[]> {
  if (typeof window === "undefined") return {
    like: [],
    love: [],
    laugh: [],
    wow: [],
    sad: [],
    angry: [],
  }
  const pets = getPets()
  const pet = pets.find((p) => p.id === petId)
  if (!pet || !pet.photos || photoIndex >= pet.photos.length) return {
    like: [],
    love: [],
    laugh: [],
    wow: [],
    sad: [],
    angry: [],
  }
  
  // Use a key format: petId:photoIndex
  const photoKey = `${petId}:${photoIndex}`
  const reactionsKey = `pet_photo_reactions_${photoKey}`
  const data = localStorage.getItem(reactionsKey)
  if (!data) return {
    like: [],
    love: [],
    laugh: [],
    wow: [],
    sad: [],
    angry: [],
  }
  return JSON.parse(data)
}

export function togglePhotoReaction(petId: string, photoIndex: number, userId: string, reactionType: ReactionType) {
  if (typeof window === "undefined") return
  const photoKey = `${petId}:${photoIndex}`
  const reactionsKey = `pet_photo_reactions_${photoKey}`
  const currentReactions = getPhotoReactions(petId, photoIndex)
  
  const reactionArray = currentReactions[reactionType] || []
  const hasReacted = reactionArray.includes(userId)
  
  const updatedReactions = { ...currentReactions }
  
  if (hasReacted) {
    // Remove reaction
    updatedReactions[reactionType] = reactionArray.filter((id) => id !== userId)
  } else {
    // Remove from other reactions first (user can only have one reaction)
    Object.keys(updatedReactions).forEach((key) => {
      if (key !== reactionType) {
        updatedReactions[key as ReactionType] = updatedReactions[key as ReactionType].filter(
          (id) => id !== userId
        )
      }
    })
    // Add reaction
    updatedReactions[reactionType] = [...reactionArray, userId]
  }
  
  localStorage.setItem(reactionsKey, JSON.stringify(updatedReactions))
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

// Group operations
export function getGroups(): Group[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUPS)
  return data ? JSON.parse(data) : []
}

export function getGroupById(id: string): Group | undefined {
  return getGroups().find((g) => g.id === id)
}

export function getGroupBySlug(slug: string): Group | undefined {
  return getGroups().find((g) => g.slug === slug)
}

export function getGroupsByCategory(categoryId: string): Group[] {
  return getGroups().filter((g) => g.categoryId === categoryId)
}

export function getUserGroups(userId: string): Group[] {
  const memberships = getGroupMembersByUserId(userId)
  const groupIds = memberships.map((m) => m.groupId)
  return getGroups().filter((g) => groupIds.includes(g.id))
}

export function searchGroups(query: string): Group[] {
  const lowerQuery = query.toLowerCase()
  return getGroups().filter(
    (g) =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.description.toLowerCase().includes(lowerQuery) ||
      g.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}

export function addGroup(group: Group) {
  if (typeof window === "undefined") return
  const groups = getGroups()
  groups.push(group)
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups))
  
  // Invalidate cache when data changes
  if (invalidateCacheFn) {
    invalidateCacheFn()
  }
}

export function updateGroup(groupId: string, updates: Partial<Group>) {
  if (typeof window === "undefined") return
  const groups = getGroups()
  const index = groups.findIndex((g) => g.id === groupId)
  if (index !== -1) {
    groups[index] = { ...groups[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups))
    
    // Invalidate cache when data changes
    if (invalidateCacheFn) {
      invalidateCacheFn()
    }
  }
}

export function deleteGroup(groupId: string) {
  if (typeof window === "undefined") return
  const groups = getGroups().filter((g) => g.id !== groupId)
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups))
  
  // Invalidate cache when data changes
  if (invalidateCacheFn) {
    invalidateCacheFn()
  }
}

// Group Member operations
export function getGroupMembers(): GroupMember[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_MEMBERS)
  return data ? JSON.parse(data) : []
}

export function getGroupMembersByGroupId(groupId: string): GroupMember[] {
  return getGroupMembers().filter((m) => m.groupId === groupId)
}

export function getGroupMembersByUserId(userId: string): GroupMember[] {
  return getGroupMembers().filter((m) => m.userId === userId)
}

export function getGroupMember(groupId: string, userId: string): GroupMember | undefined {
  return getGroupMembers().find((m) => m.groupId === groupId && m.userId === userId)
}

export function addGroupMember(member: GroupMember) {
  if (typeof window === "undefined") return
  const members = getGroupMembers()
  members.push(member)
  localStorage.setItem(STORAGE_KEYS.GROUP_MEMBERS, JSON.stringify(members))
  
  // Update group member count
  const group = getGroupById(member.groupId)
  if (group) {
    updateGroup(member.groupId, { memberCount: group.memberCount + 1 })
  }
}

export function updateGroupMember(memberId: string, updates: Partial<GroupMember>) {
  if (typeof window === "undefined") return
  const members = getGroupMembers()
  const index = members.findIndex((m) => m.id === memberId)
  if (index !== -1) {
    members[index] = { ...members[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.GROUP_MEMBERS, JSON.stringify(members))
  }
}

export function removeGroupMember(groupId: string, userId: string) {
  if (typeof window === "undefined") return
  const members = getGroupMembers().filter((m) => !(m.groupId === groupId && m.userId === userId))
  localStorage.setItem(STORAGE_KEYS.GROUP_MEMBERS, JSON.stringify(members))
  
  // Update group member count
  const group = getGroupById(groupId)
  if (group) {
    updateGroup(groupId, { memberCount: Math.max(0, group.memberCount - 1) })
  }
}

export function isUserMemberOfGroup(groupId: string, userId: string): boolean {
  return getGroupMember(groupId, userId) !== undefined
}

export function getUserRoleInGroup(groupId: string, userId: string): GroupMemberRole | null {
  const member = getGroupMember(groupId, userId)
  return member ? member.role : null
}

// Group Topic operations
export function getGroupTopics(): GroupTopic[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_TOPICS)
  return data ? JSON.parse(data) : []
}

export function getGroupTopicsByGroupId(groupId: string): GroupTopic[] {
  return getGroupTopics().filter((t) => t.groupId === groupId)
}

export function getGroupTopicById(topicId: string): GroupTopic | undefined {
  return getGroupTopics().find((t) => t.id === topicId)
}

export function getGroupTopicsByParentId(parentTopicId: string): GroupTopic[] {
  return getGroupTopics().filter((t) => t.parentTopicId === parentTopicId)
}

export function addGroupTopic(topic: GroupTopic) {
  if (typeof window === "undefined") return
  const topics = getGroupTopics()
  topics.unshift(topic)
  localStorage.setItem(STORAGE_KEYS.GROUP_TOPICS, JSON.stringify(topics))
  
  // Update group topic count
  const group = getGroupById(topic.groupId)
  if (group) {
    updateGroup(topic.groupId, { topicCount: group.topicCount + 1 })
  }
}

export function updateGroupTopic(topicId: string, updates: Partial<GroupTopic>) {
  if (typeof window === "undefined") return
  const topics = getGroupTopics()
  const index = topics.findIndex((t) => t.id === topicId)
  if (index !== -1) {
    topics[index] = { ...topics[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.GROUP_TOPICS, JSON.stringify(topics))
  }
}

export function deleteGroupTopic(topicId: string) {
  if (typeof window === "undefined") return
  const topic = getGroupTopicById(topicId)
  const topics = getGroupTopics().filter((t) => t.id !== topicId)
  localStorage.setItem(STORAGE_KEYS.GROUP_TOPICS, JSON.stringify(topics))
  
  // Update group topic count
  if (topic) {
    const group = getGroupById(topic.groupId)
    if (group) {
      updateGroup(topic.groupId, { topicCount: Math.max(0, group.topicCount - 1) })
    }
  }
}

// Group Poll operations
export function getGroupPolls(): GroupPoll[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_POLLS)
  return data ? JSON.parse(data) : []
}

export function getGroupPollById(pollId: string): GroupPoll | undefined {
  return getGroupPolls().find((p) => p.id === pollId)
}

export function getGroupPollsByGroupId(groupId: string): GroupPoll[] {
  return getGroupPolls().filter((p) => p.groupId === groupId)
}

export function getGroupPollsByTopicId(topicId: string): GroupPoll[] {
  return getGroupPolls().filter((p) => p.topicId === topicId)
}

export function addGroupPoll(poll: GroupPoll) {
  if (typeof window === "undefined") return
  const polls = getGroupPolls()
  polls.unshift(poll)
  localStorage.setItem(STORAGE_KEYS.GROUP_POLLS, JSON.stringify(polls))
}

export function updateGroupPoll(pollId: string, updates: Partial<GroupPoll>) {
  if (typeof window === "undefined") return
  const polls = getGroupPolls()
  const index = polls.findIndex((p) => p.id === pollId)
  if (index !== -1) {
    polls[index] = { ...polls[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.GROUP_POLLS, JSON.stringify(polls))
  }
}

export function deleteGroupPoll(pollId: string) {
  if (typeof window === "undefined") return
  const polls = getGroupPolls().filter((p) => p.id !== pollId)
  localStorage.setItem(STORAGE_KEYS.GROUP_POLLS, JSON.stringify(polls))
}

// Poll Vote operations
export function getPollVotes(): PollVote[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.POLL_VOTES)
  return data ? JSON.parse(data) : []
}

export function getPollVotesByPollId(pollId: string): PollVote[] {
  return getPollVotes().filter((v) => v.pollId === pollId)
}

export function getUserPollVote(pollId: string, userId: string): PollVote | undefined {
  return getPollVotes().find((v) => v.pollId === pollId && v.userId === userId)
}

export function addPollVote(vote: PollVote) {
  if (typeof window === "undefined") return
  const votes = getPollVotes()
  
  // Remove existing vote if user already voted
  const existingVote = getUserPollVote(vote.pollId, vote.userId)
  if (existingVote) {
    removePollVote(vote.pollId, vote.userId)
  }
  
  votes.push(vote)
  localStorage.setItem(STORAGE_KEYS.POLL_VOTES, JSON.stringify(votes))
  
  // Update poll vote counts
  updatePollVoteCounts(vote.pollId)
}

export function removePollVote(pollId: string, userId: string) {
  if (typeof window === "undefined") return
  const votes = getPollVotes().filter((v) => !(v.pollId === pollId && v.userId === userId))
  localStorage.setItem(STORAGE_KEYS.POLL_VOTES, JSON.stringify(votes))
  
  // Update poll vote counts
  updatePollVoteCounts(pollId)
}

function updatePollVoteCounts(pollId: string) {
  const poll = getGroupPollById(pollId)
  if (!poll) return
  
  const votes = getPollVotesByPollId(pollId)
  const optionCounts: Record<string, number> = {}
  
  votes.forEach((vote) => {
    vote.optionIds.forEach((optionId) => {
      optionCounts[optionId] = (optionCounts[optionId] || 0) + 1
    })
  })
  
  const updatedOptions = poll.options.map((option) => ({
    ...option,
    voteCount: optionCounts[option.id] || 0,
  }))
  
  const totalVotes = votes.length
  updateGroupPoll(pollId, { 
    options: updatedOptions,
    voteCount: totalVotes
  })
}

// Group Event operations
export function getGroupEvents(): GroupEvent[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_EVENTS)
  return data ? JSON.parse(data) : []
}

export function getGroupEventById(eventId: string): GroupEvent | undefined {
  return getGroupEvents().find((e) => e.id === eventId)
}

export function getGroupEventsByGroupId(groupId: string): GroupEvent[] {
  return getGroupEvents()
    .filter((e) => e.groupId === groupId)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}

export function addGroupEvent(event: GroupEvent) {
  if (typeof window === "undefined") return
  const events = getGroupEvents()
  events.push(event)
  localStorage.setItem(STORAGE_KEYS.GROUP_EVENTS, JSON.stringify(events))
}

export function updateGroupEvent(eventId: string, updates: Partial<GroupEvent>) {
  if (typeof window === "undefined") return
  const events = getGroupEvents()
  const index = events.findIndex((e) => e.id === eventId)
  if (index !== -1) {
    events[index] = { ...events[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.GROUP_EVENTS, JSON.stringify(events))
  }
}

export function deleteGroupEvent(eventId: string) {
  if (typeof window === "undefined") return
  const events = getGroupEvents().filter((e) => e.id !== eventId)
  localStorage.setItem(STORAGE_KEYS.GROUP_EVENTS, JSON.stringify(events))
}

// Event RSVP operations
export function getEventRSVPs(): EventRSVP[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.EVENT_RSVPS)
  return data ? JSON.parse(data) : []
}

export function getEventRSVPsByEventId(eventId: string): EventRSVP[] {
  return getEventRSVPs().filter((r) => r.eventId === eventId)
}

export function getUserEventRSVP(eventId: string, userId: string): EventRSVP | undefined {
  return getEventRSVPs().find((r) => r.eventId === eventId && r.userId === userId)
}

export function addEventRSVP(rsvp: EventRSVP) {
  if (typeof window === "undefined") return
  const rsvps = getEventRSVPs()
  
  // Remove existing RSVP if user already responded
  const existingRSVP = getUserEventRSVP(rsvp.eventId, rsvp.userId)
  if (existingRSVP) {
    removeEventRSVP(rsvp.eventId, rsvp.userId)
  }
  
  rsvps.push(rsvp)
  localStorage.setItem(STORAGE_KEYS.EVENT_RSVPS, JSON.stringify(rsvps))
  
  // Update event attendee count
  updateEventAttendeeCount(rsvp.eventId)
}

export function removeEventRSVP(eventId: string, userId: string) {
  if (typeof window === "undefined") return
  const rsvps = getEventRSVPs().filter((r) => !(r.eventId === eventId && r.userId === userId))
  localStorage.setItem(STORAGE_KEYS.EVENT_RSVPS, JSON.stringify(rsvps))
  
  // Update event attendee count
  updateEventAttendeeCount(eventId)
}

function updateEventAttendeeCount(eventId: string) {
  const event = getGroupEventById(eventId)
  if (!event) return
  
  const rsvps = getEventRSVPsByEventId(eventId)
  const goingCount = rsvps.filter((r) => r.status === "going").length
  
  updateGroupEvent(eventId, { attendeeCount: goingCount })
}

// Group Resource operations
export function getGroupResources(): GroupResource[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_RESOURCES)
  return data ? JSON.parse(data) : []
}

export function getGroupResourceById(resourceId: string): GroupResource | undefined {
  return getGroupResources().find((r) => r.id === resourceId)
}

export function getGroupResourcesByGroupId(groupId: string): GroupResource[] {
  return getGroupResources()
    .filter((r) => r.groupId === groupId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function addGroupResource(resource: GroupResource) {
  if (typeof window === "undefined") return
  const resources = getGroupResources()
  resources.unshift(resource)
  localStorage.setItem(STORAGE_KEYS.GROUP_RESOURCES, JSON.stringify(resources))
}

export function updateGroupResource(resourceId: string, updates: Partial<GroupResource>) {
  if (typeof window === "undefined") return
  const resources = getGroupResources()
  const index = resources.findIndex((r) => r.id === resourceId)
  if (index !== -1) {
    resources[index] = { ...resources[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.GROUP_RESOURCES, JSON.stringify(resources))
  }
}

export function deleteGroupResource(resourceId: string) {
  if (typeof window === "undefined") return
  const resources = getGroupResources().filter((r) => r.id !== resourceId)
  localStorage.setItem(STORAGE_KEYS.GROUP_RESOURCES, JSON.stringify(resources))
}

// Group Activity operations
export function getGroupActivities(): GroupActivity[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_ACTIVITIES)
  return data ? JSON.parse(data) : []
}

export function getGroupActivitiesByGroupId(groupId: string): GroupActivity[] {
  return getGroupActivities()
    .filter((a) => a.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function addGroupActivity(activity: GroupActivity) {
  if (typeof window === "undefined") return
  const activities = getGroupActivities()
  activities.unshift(activity)
  // Keep only last 1000 activities per group
  const groupActivities = activities.filter((a) => a.groupId === activity.groupId)
  if (groupActivities.length > 1000) {
    const toRemove = groupActivities.slice(1000)
    const filteredActivities = activities.filter((a) => !toRemove.includes(a))
    localStorage.setItem(STORAGE_KEYS.GROUP_ACTIVITIES, JSON.stringify(filteredActivities))
  } else {
    localStorage.setItem(STORAGE_KEYS.GROUP_ACTIVITIES, JSON.stringify(activities))
  }
}

// Group Category operations
export function getGroupCategories(): GroupCategory[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_CATEGORIES)
  return data ? JSON.parse(data) : []
}

export function getGroupCategoryById(categoryId: string): GroupCategory | undefined {
  return getGroupCategories().find((c) => c.id === categoryId)
}

export function getGroupCategoryBySlug(slug: string): GroupCategory | undefined {
  return getGroupCategories().find((c) => c.slug === slug)
}

export function addGroupCategory(category: GroupCategory) {
  if (typeof window === "undefined") return
  const categories = getGroupCategories()
  categories.push(category)
  localStorage.setItem(STORAGE_KEYS.GROUP_CATEGORIES, JSON.stringify(categories))
}

export function updateGroupCategory(categoryId: string, updates: Partial<GroupCategory>) {
  if (typeof window === "undefined") return
  const categories = getGroupCategories()
  const index = categories.findIndex((c) => c.id === categoryId)
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates }
    localStorage.setItem(STORAGE_KEYS.GROUP_CATEGORIES, JSON.stringify(categories))
  }
}

// Permission checking functions
export function canUserModerate(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  return member.role === "owner" || member.role === "admin" || member.role === "moderator"
}

export function canUserPost(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  const permissions = member.permissions
  return permissions?.canPost !== false // Default to true unless explicitly false
}

export function canUserComment(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  const permissions = member.permissions
  return permissions?.canComment !== false // Default to true unless explicitly false
}

export function canUserCreateTopic(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  const permissions = member.permissions
  return permissions?.canCreateTopic !== false // Default to true unless explicitly false
}

export function canUserManageMembers(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  return member.role === "owner" || member.role === "admin"
}

export function canUserManageSettings(groupId: string, userId: string): boolean {
  const member = getGroupMember(groupId, userId)
  if (!member) return false
  return member.role === "owner" || member.role === "admin"
}

export function canUserViewGroup(groupId: string, userId?: string): boolean {
  const group = getGroupById(groupId)
  if (!group) return false
  
  // Check if user is banned
  if (userId && isUserBannedFromGroup(groupId, userId)) {
    return false
  }
  
  // Open groups are visible to everyone
  if (group.type === "open") return true
  
  // Closed groups are visible but require membership to interact
  if (group.type === "closed") return true
  
  // Secret groups are only visible to members
  if (group.type === "secret") {
    if (!userId) return false
    return isUserMemberOfGroup(groupId, userId)
  }
  
  return false
}

// Group Warning operations
export function getGroupWarnings(): GroupWarning[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_WARNINGS)
  return data ? JSON.parse(data) : []
}

export function getGroupWarningsByGroupId(groupId: string): GroupWarning[] {
  return getGroupWarnings().filter((w) => w.groupId === groupId)
}

export function getGroupWarningsByUserId(groupId: string, userId: string): GroupWarning[] {
  return getGroupWarnings().filter((w) => w.groupId === groupId && w.userId === userId)
}

export function addGroupWarning(warning: GroupWarning) {
  if (typeof window === "undefined") return
  const warnings = getGroupWarnings()
  warnings.push(warning)
  localStorage.setItem(STORAGE_KEYS.GROUP_WARNINGS, JSON.stringify(warnings))
  
  // Log moderation action
  addModerationAction({
    id: `mod_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    groupId: warning.groupId,
    actionType: "warn",
    targetId: warning.userId,
    targetType: "member",
    performedBy: warning.issuedBy,
    reason: warning.reason,
    metadata: { level: warning.level, notes: warning.notes },
    timestamp: warning.createdAt,
  })
}

export function getWarningCount(groupId: string, userId: string): number {
  return getGroupWarningsByUserId(groupId, userId).length
}

// Group Ban operations
export function getGroupBans(): GroupBan[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.GROUP_BANS)
  return data ? JSON.parse(data) : []
}

export function getGroupBansByGroupId(groupId: string): GroupBan[] {
  return getGroupBans().filter((b) => b.groupId === groupId)
}

export function getActiveGroupBansByGroupId(groupId: string): GroupBan[] {
  const now = new Date()
  return getGroupBansByGroupId(groupId).filter((ban) => {
    if (!ban.isActive) return false
    if (!ban.expiresAt) return true // Permanent ban
    return new Date(ban.expiresAt) > now
  })
}

export function getUserBan(groupId: string, userId: string): GroupBan | undefined {
  const activeBans = getActiveGroupBansByGroupId(groupId)
  return activeBans.find((ban) => ban.userId === userId)
}

export function isUserBannedFromGroup(groupId: string, userId: string): boolean {
  return getUserBan(groupId, userId) !== undefined
}

export function banGroupMember(ban: GroupBan) {
  if (typeof window === "undefined") return
  const bans = getGroupBans()
  bans.push(ban)
  localStorage.setItem(STORAGE_KEYS.GROUP_BANS, JSON.stringify(bans))
  
  // Log moderation action
  addModerationAction({
    id: `mod_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    groupId: ban.groupId,
    actionType: "ban",
    targetId: ban.userId,
    targetType: "member",
    performedBy: ban.bannedBy,
    reason: ban.reason,
    metadata: { expiresAt: ban.expiresAt, permanent: !ban.expiresAt },
    timestamp: ban.createdAt,
  })
  
  // Remove member from group
  removeGroupMember(ban.groupId, ban.userId)
}

export function unbanGroupMember(groupId: string, userId: string, unbannedBy: string) {
  if (typeof window === "undefined") return
  const bans = getGroupBans()
  const banIndex = bans.findIndex((b) => b.groupId === groupId && b.userId === userId && b.isActive)
  if (banIndex !== -1) {
    bans[banIndex].isActive = false
    localStorage.setItem(STORAGE_KEYS.GROUP_BANS, JSON.stringify(bans))
    
    // Log moderation action
    addModerationAction({
      id: `mod_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      actionType: "unban",
      targetId: userId,
      targetType: "member",
      performedBy: unbannedBy,
      timestamp: new Date().toISOString(),
    })
  }
}

// Moderation Action operations
export function getModerationActions(): ModerationAction[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.MODERATION_ACTIONS)
  return data ? JSON.parse(data) : []
}

export function getModerationActionsByGroupId(groupId: string): ModerationAction[] {
  return getModerationActions()
    .filter((action) => action.groupId === groupId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function addModerationAction(action: ModerationAction) {
  if (typeof window === "undefined") return
  const actions = getModerationActions()
  actions.unshift(action)
  // Keep only last 1000 actions per group
  const groupActions = actions.filter((a) => a.groupId === action.groupId)
  if (groupActions.length > 1000) {
    const toRemove = groupActions.slice(1000)
    const filteredActions = actions.filter((a) => !toRemove.includes(a))
    localStorage.setItem(STORAGE_KEYS.MODERATION_ACTIONS, JSON.stringify(filteredActions))
  } else {
    localStorage.setItem(STORAGE_KEYS.MODERATION_ACTIONS, JSON.stringify(actions))
  }
}
