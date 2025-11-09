import { getUsers, getPets, getBlogPosts, getComments, getActivities, getGroups, getGroupMembersByGroupId } from "@/lib/storage"
import type { User, Activity } from "@/lib/types"

export interface ProfileOverview {
  userId: string
  followersCount: number
  followingCount: number
  postsCount: number
  petsCount: number
  commentsCount: number
  lastActivity: {
    timestamp: string | null
    type: Activity["type"] | null
    description: string | null
  }
  groupsCount: number
  badges?: {
    verified?: boolean
    pro?: boolean
    shelter?: boolean
    vet?: boolean
  }
  highlights?: {
    recentFollowers?: number
    recentPosts?: number
    highEngagement?: boolean
  }
  completionPercent: number
}

/**
 * Get comprehensive profile overview for a user including counts and last activity
 */
export function getProfileOverview(userId: string): ProfileOverview | null {
  const allUsers = getUsers()
  const user = allUsers.find((u) => u.id === userId)
  
  if (!user) {
    return null
  }

  const allPets = getPets()
  const allPosts = getBlogPosts()
  const allComments = getComments()
  const allActivities = getActivities()
  const allGroups = getGroups()
  
  // Get all group memberships for user
  let groupsCount = 0
  allGroups.forEach((group) => {
    const members = getGroupMembersByGroupId(group.id)
    const userMember = members.find((member) => member.userId === userId && member.status === "active")
    if (userMember) {
      groupsCount++
    }
  })

  // Count followers and following
  const followersCount = user.followers?.length ?? 0
  const followingCount = user.following?.length ?? 0

  // Count user's pets
  const petsCount = allPets.filter((pet) => pet.ownerId === userId).length

  // Count user's posts
  const postsCount = allPosts.filter((post) => post.authorId === userId).length

  // Count user's comments (on posts, wiki articles, pet photos)
  const commentsCount = allComments.filter((comment) => comment.userId === userId).length

  // Get last activity
  const userActivities = allActivities
    .filter((activity) => activity.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const lastActivity = userActivities.length > 0
    ? {
        timestamp: userActivities[0].createdAt,
        type: userActivities[0].type,
        description: getActivityDescription(userActivities[0]),
      }
    : {
        timestamp: null,
        type: null,
        description: null,
      }

  // Extract badges from user profile
  const badges = {
    verified: user.badge === "verified",
    pro: user.badge === "pro" || user.isPro === true,
    shelter: user.badge === "shelter",
    vet: user.badge === "vet",
  }

  // Calculate highlights
  const highlights = calculateHighlights(user, allActivities, allPosts, allUsers)

  // Completion percent
  const completionPercent = calculateProfileCompletionPercent(user, petsCount)

  return {
    userId,
    followersCount,
    followingCount,
    postsCount,
    petsCount,
    commentsCount,
    lastActivity,
    groupsCount,
    badges: Object.keys(badges).some((key) => badges[key as keyof typeof badges]) ? badges : undefined,
    highlights: Object.keys(highlights).length > 0 ? highlights : undefined,
    completionPercent,
  }
}

/**
 * Calculate profile completion percent based on weighted fields.
 * Weights:
 * - Profile photo 10%
 * - Cover photo 5%
 * - Bio 15%
 * - Location 5%
 * - Birthday 5%
 * - Phone verified 10%
 * - Email verified 10%
 * - Interests 10%
 * - At least one pet added 20%
 * - Contact info 5%
 * - Social links 5%
 */
export function calculateProfileCompletionPercent(user: User, petsCount: number): number {
  const weights = {
    avatar: 10,
    cover: 5,
    bio: 15,
    location: 5,
    birthday: 5,
    phoneVerified: 10,
    emailVerified: 10,
    interests: 10,
    hasPet: 20,
    contactInfo: 5,
    socialLinks: 5,
  }

  let total = 0

  // Profile photo
  if (user.avatar && user.avatar.trim().length > 0) total += weights.avatar
  // Cover photo
  if (user.coverPhoto && user.coverPhoto.trim().length > 0) total += weights.cover
  // Bio
  if (user.bio && user.bio.trim().length > 0) total += weights.bio
  // Location
  if (user.location && user.location.trim().length > 0) total += weights.location
  // Birthday
  if (user.dateOfBirth && user.dateOfBirth.trim().length > 0) total += weights.birthday
  // Phone verified (fallback: consider a dedicated flag if present, else require phone present + boolean true)
  const phoneVerified = (user as any).phoneVerified === true
  if (phoneVerified) total += weights.phoneVerified
  // Email verified
  const emailVerified = Boolean(user.emailVerified || user.emailVerification?.status === 'verified')
  if (emailVerified) total += weights.emailVerified
  // Interests
  if (Array.isArray(user.interests) && user.interests.length > 0) total += weights.interests
  // Pets
  if (petsCount > 0) total += weights.hasPet
  // Contact info (phone or website present)
  if ((user.phone && user.phone.trim().length > 0) || (user.website && user.website.trim().length > 0)) {
    total += weights.contactInfo
  }
  // Social links
  const social = (user as any).socialMedia || {}
  const hasSocial = Boolean(
    social.instagram || social.facebook || social.twitter || social.youtube || social.linkedin || social.tiktok
  )
  if (hasSocial) total += weights.socialLinks

  // Clamp between 0 and 100
  total = Math.max(0, Math.min(100, total))
  return Math.round(total)
}

/**
 * Get activity description for display
 */
function getActivityDescription(activity: Activity): string {
  const targetLabels: Record<Activity["targetType"], string> = {
    user: "a community member",
    pet: "a pet profile",
    post: "a post",
    wiki: "a wiki article",
  }

  switch (activity.type) {
    case "follow":
      return `Followed ${targetLabels[activity.targetType]}`
    case "like":
      return `Liked ${targetLabels[activity.targetType]}`
    case "comment":
      return `Commented on ${targetLabels[activity.targetType]}`
    case "post":
      return activity.targetType === "post"
        ? "Published a new post"
        : `Shared a new ${targetLabels[activity.targetType]}`
    default:
      return "Recent activity"
  }
}

/**
 * Calculate profile highlights based on recent activity
 */
function calculateHighlights(
  user: User,
  allActivities: Activity[],
  allPosts: any[],
  allUsers: User[]
): ProfileOverview["highlights"] {
  const allComments = getComments()
  const highlights: ProfileOverview["highlights"] = {}
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

  // Recent followers (last 7 days)
  const recentFollowers = user.followers?.filter((followerId) => {
    const follower = allUsers.find((u) => u.id === followerId)
    if (!follower) return false
    const joinDate = new Date(follower.joinedAt).getTime()
    return joinDate >= sevenDaysAgo
  }).length ?? 0

  if (recentFollowers > 0) {
    highlights.recentFollowers = recentFollowers
  }

  // Recent posts (last 30 days)
  const userPosts = allPosts.filter((post) => post.authorId === user.id)
  const recentPosts = userPosts.filter((post) => {
    const postDate = new Date(post.createdAt).getTime()
    return postDate >= thirtyDaysAgo
  }).length

  if (recentPosts > 0) {
    highlights.recentPosts = recentPosts
  }

  // High engagement (posts with >10 likes or >5 comments in last 30 days)
  const highEngagementPosts = userPosts.filter((post) => {
    const postDate = new Date(post.createdAt).getTime()
    if (postDate < thirtyDaysAgo) return false
    const likes = post.likes?.length ?? 0
    const comments = allComments.filter((c) => c.postId === post.id).length
    return likes > 10 || comments > 5
  })

  if (highEngagementPosts.length > 0) {
    highlights.highEngagement = true
  }

  return highlights
}
