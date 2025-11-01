import type { User, BlogPost, Pet, PrivacyLevel } from "@/lib/types"
import { getUserById as getUserByIdFromStorage, getUsers } from "@/lib/storage"

// Helper to get user by ID
function getUserById(userId: string): User | undefined {
  return getUserByIdFromStorage(userId)
}

/**
 * Check if a viewer can see content based on privacy level
 */
export function canViewContent(
  privacy: PrivacyLevel | undefined,
  viewerId: string | null,
  ownerId: string,
  isFollower: boolean = false
): boolean {
  if (!viewerId) {
    // Not logged in - only public content
    return privacy === "public" || !privacy
  }

  // Owner can always see their own content
  if (viewerId === ownerId) {
    return true
  }

  // Check privacy level
  if (!privacy || privacy === "public") {
    return true
  }

  if (privacy === "private") {
    return false
  }

  // followers-only
  return isFollower
}

/**
 * Check if viewer can see user profile
 */
export function canViewProfile(profileUser: User, viewerId: string | null): boolean {
  if (!viewerId) {
    // Not logged in - only public profiles
    return profileUser.privacy?.profile === "public" || !profileUser.privacy?.profile
  }

  // Owner can always see their own profile
  if (viewerId === profileUser.id) {
    return true
  }

  // Check if viewer is blocked
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  // Check if profile owner is blocked by viewer
  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(profileUser.privacy?.profile, viewerId, profileUser.id, isFollower)
}

/**
 * Check if viewer can see user's posts
 */
export function canViewUserPosts(profileUser: User, viewerId: string | null): boolean {
  if (!viewerId) {
    return profileUser.privacy?.posts === "public" || !profileUser.privacy?.posts
  }

  if (viewerId === profileUser.id) {
    return true
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(profileUser.privacy?.posts, viewerId, profileUser.id, isFollower)
}

/**
 * Check if viewer can see user's pets
 */
export function canViewUserPets(profileUser: User, viewerId: string | null): boolean {
  if (!viewerId) {
    return profileUser.privacy?.pets === "public" || !profileUser.privacy?.pets
  }

  if (viewerId === profileUser.id) {
    return true
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(profileUser.privacy?.pets, viewerId, profileUser.id, isFollower)
}

/**
 * Check if viewer can see user's followers list
 */
export function canViewFollowers(profileUser: User, viewerId: string | null): boolean {
  if (!viewerId) {
    return profileUser.privacy?.followers === "public" || !profileUser.privacy?.followers
  }

  if (viewerId === profileUser.id) {
    return true
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(profileUser.privacy?.followers, viewerId, profileUser.id, isFollower)
}

/**
 * Check if viewer can see user's following list
 */
export function canViewFollowing(profileUser: User, viewerId: string | null): boolean {
  if (!viewerId) {
    return profileUser.privacy?.following === "public" || !profileUser.privacy?.following
  }

  if (viewerId === profileUser.id) {
    return true
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(profileUser.privacy?.following, viewerId, profileUser.id, isFollower)
}

/**
 * Check if viewer can see a specific post
 */
export function canViewPost(post: BlogPost, profileUser: User, viewerId: string | null): boolean {
  // Check post privacy first
  if (!viewerId) {
    return post.privacy === "public" || !post.privacy
  }

  if (viewerId === post.authorId) {
    return true
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(post.authorId)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  const postPrivacy = post.privacy || profileUser.privacy?.posts || "public"
  return canViewContent(postPrivacy as PrivacyLevel, viewerId, post.authorId, isFollower)
}

/**
 * Check if viewer can see a pet
 */
export function canViewPet(pet: Pet, owner: User, viewerId: string | null): boolean {
  if (!viewerId) {
    return pet.privacy === "public" || owner.privacy?.pets === "public" || !pet.privacy
  }

  if (viewerId === owner.id) {
    return true
  }

  // Check blocking
  if (owner.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(owner.id)) {
    return false
  }

  const isFollower = owner.followers.includes(viewerId) || pet.followers.includes(viewerId)
  const petPrivacy = pet.privacy || owner.privacy?.pets || "public"
  return canViewContent(petPrivacy as PrivacyLevel, viewerId, owner.id, isFollower)
}

/**
 * Check if user can search for another user
 */
export function isSearchable(user: User): boolean {
  return user.privacy?.searchable !== false
}

/**
 * Check if user can send follow request to another user
 */
export function canSendFollowRequest(profileUser: User, viewerId: string | null): boolean {
  if (!viewerId) {
    return false // Must be logged in to follow
  }

  if (viewerId === profileUser.id) {
    return false // Can't follow yourself
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  // Check if already following
  if (profileUser.followers.includes(viewerId)) {
    return false
  }

  const allowFollowRequests = profileUser.privacy?.allowFollowRequests || "public"
  if (allowFollowRequests === "public") {
    return true
  }

  // followers-only means only followers can send requests (weird, but for completeness)
  const isFollower = profileUser.followers.includes(viewerId)
  return isFollower
}

/**
 * Check if viewer can see specific profile field (email, location, etc.)
 */
export function canViewProfileField(
  field: "email" | "location",
  profileUser: User,
  viewerId: string | null
): boolean {
  if (!viewerId) {
    return profileUser.privacy?.[field] === "public" || !profileUser.privacy?.[field]
  }

  if (viewerId === profileUser.id) {
    return true
  }

  // Check blocking
  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(profileUser.privacy?.[field], viewerId, profileUser.id, isFollower)
}


