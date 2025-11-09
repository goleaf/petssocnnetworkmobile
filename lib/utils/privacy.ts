import type { User, BlogPost, Pet, PrivacyLevel, ProfileSection } from "@/lib/types"
import { getUserById as getUserByIdFromStorage } from "@/lib/storage"

// Helper to get user by ID
function getUserById(userId: string): User | undefined {
  return getUserByIdFromStorage(userId)
}

function canViewUserScopedProperty(
  profileUser: User,
  viewerId: string | null,
  privacy: PrivacyLevel | undefined
): boolean {
  if (!viewerId) {
    return privacy === "public" || !privacy
  }

  if (viewerId === profileUser.id) {
    return true
  }

  if (profileUser.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(profileUser.id)) {
    return false
  }

  const isFollower = profileUser.followers.includes(viewerId)
  return canViewContent(privacy, viewerId, profileUser.id, isFollower)
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

function resolvePetPrivacy(pet: Pet): { visibility?: PrivacyLevel; interactions?: PrivacyLevel } {
  const rawPrivacy = pet.privacy
  if (
    rawPrivacy &&
    typeof rawPrivacy === "object" &&
    "visibility" in rawPrivacy &&
    "interactions" in rawPrivacy
  ) {
    return {
      visibility: rawPrivacy.visibility as PrivacyLevel,
      interactions: rawPrivacy.interactions as PrivacyLevel,
    }
  }

  if (typeof rawPrivacy === "string") {
    return {
      visibility: rawPrivacy,
      interactions: rawPrivacy,
    }
  }

  return {}
}

function getPetPrivacySettings(pet: Pet, owner: User): { visibility: PrivacyLevel; interactions: PrivacyLevel } {
  const resolved = resolvePetPrivacy(pet)
  const ownerPetsPrivacy = owner.privacy?.sections?.pets ?? owner.privacy?.pets
  const fallback = ownerPetsPrivacy ?? "public"

  return {
    visibility: resolved.visibility ?? fallback,
    interactions: resolved.interactions ?? fallback,
  }
}

/**
 * Check if viewer can see user profile
 */
export function canViewProfile(profileUser: User, viewerId: string | null): boolean {
  return canViewUserScopedProperty(profileUser, viewerId, profileUser.privacy?.profile)
}

/**
 * Check if viewer can see user's posts
 */
export function canViewUserPosts(profileUser: User, viewerId: string | null): boolean {
  return canViewUserScopedProperty(profileUser, viewerId, profileUser.privacy?.posts)
}

/**
 * Check if viewer can see user's pets
 */
export function canViewUserPets(profileUser: User, viewerId: string | null): boolean {
  const sectionPrivacy = profileUser.privacy?.sections?.pets
  const effectivePrivacy = sectionPrivacy ?? profileUser.privacy?.pets
  return canViewUserScopedProperty(profileUser, viewerId, effectivePrivacy)
}

/**
 * Check if viewer can see user's followers list
 */
export function canViewFollowers(profileUser: User, viewerId: string | null): boolean {
  const sectionPrivacy = profileUser.privacy?.sections?.friends
  const effectivePrivacy = sectionPrivacy ?? profileUser.privacy?.followers
  return canViewUserScopedProperty(profileUser, viewerId, effectivePrivacy)
}

/**
 * Check if viewer can see user's following list
 */
export function canViewFollowing(profileUser: User, viewerId: string | null): boolean {
  const sectionPrivacy = profileUser.privacy?.sections?.friends
  const effectivePrivacy = sectionPrivacy ?? profileUser.privacy?.following
  return canViewUserScopedProperty(profileUser, viewerId, effectivePrivacy)
}

/**
 * Check if viewer can see a specific post
 */
export function canViewPost(post: BlogPost, profileUser: User, viewerId: string | null): boolean {
  // Check post privacy first
  if (!viewerId) {
    // Public only for signed-out
    if (post.visibilityMode === 'custom') return false
    if (post.visibilityMode === 'friends') return false
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
  // Custom allow list
  if (post.visibilityMode === 'custom') {
    const list = new Set(post.allowedUserIds || [])
    return list.has(viewerId)
  }

  // Mutual friends (mutual followers)
  if (post.visibilityMode === 'friends') {
    const mutual = profileUser.followers.includes(viewerId) && profileUser.following.includes(viewerId)
    return mutual
  }

  const postPrivacy = post.privacy || profileUser.privacy?.posts || "public"
  return canViewContent(postPrivacy as PrivacyLevel, viewerId, post.authorId, isFollower)
}

/**
 * Check if viewer can see a pet
 */
export function canViewPet(pet: Pet, owner: User, viewerId: string | null): boolean {
  const { visibility } = getPetPrivacySettings(pet, owner)

  if (!viewerId) {
    return visibility === "public"
  }

  if (viewerId === owner.id) {
    return true
  }

  if (owner.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(owner.id)) {
    return false
  }

  const isFollower = owner.followers.includes(viewerId) || pet.followers.includes(viewerId)
  return canViewContent(visibility, viewerId, owner.id, isFollower)
}

/**
 * Check if viewer can interact with a pet (follow, react, etc.)
 */
export function canInteractWithPet(pet: Pet, owner: User, viewerId: string | null): boolean {
  const { interactions } = getPetPrivacySettings(pet, owner)

  if (!viewerId) {
    return false
  }

  if (viewerId === owner.id) {
    return true
  }

  if (owner.blockedUsers?.includes(viewerId)) {
    return false
  }

  const viewer = getUserById(viewerId)
  if (viewer?.blockedUsers?.includes(owner.id)) {
    return false
  }

  if (interactions === "public") {
    return true
  }

  const followsOwner = owner.followers.includes(viewerId)
  const followsPet = pet.followers.includes(viewerId)

  if (interactions === "followers-only") {
    return followsOwner || followsPet
  }

  // private
  return false
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
 * Check if viewer can see a profile section (basics, statistics, friends, pets, activity)
 */
export function canViewProfileSection(
  section: ProfileSection,
  profileUser: User,
  viewerId: string | null
): boolean {
  const sectionsPrivacy = profileUser.privacy?.sections
  const profilePrivacy = profileUser.privacy?.profile

  switch (section) {
    case "basics":
    case "statistics":
      return canViewUserScopedProperty(profileUser, viewerId, sectionsPrivacy?.[section] ?? profilePrivacy)
    case "friends":
      return canViewUserScopedProperty(
        profileUser,
        viewerId,
        sectionsPrivacy?.friends ??
          profileUser.privacy?.followers ??
          profileUser.privacy?.following ??
          profilePrivacy
      )
    case "pets":
      return canViewUserPets(profileUser, viewerId)
    case "activity":
      return canViewUserScopedProperty(
        profileUser,
        viewerId,
        sectionsPrivacy?.activity ?? profileUser.privacy?.posts ?? profilePrivacy
      )
    default:
      return true
  }
}

/**
 * Check if viewer can see specific profile field (email, location, etc.)
 */
export function canViewProfileField(
  field: "email" | "location",
  profileUser: User,
  viewerId: string | null
): boolean {
  const basicsPrivacy = profileUser.privacy?.sections?.basics ?? profileUser.privacy?.profile
  if (!canViewUserScopedProperty(profileUser, viewerId, basicsPrivacy)) {
    return false
  }

  const fieldPrivacy = (profileUser.privacy?.[field] ?? profileUser.privacy?.profile) as PrivacyLevel | undefined
  return canViewUserScopedProperty(profileUser, viewerId, fieldPrivacy)
}
