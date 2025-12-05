// Privacy Enforcement Module
// Enforces privacy settings across the application

import { prisma } from '@/lib/prisma'
import { 
  canViewContent, 
  isUserBlocked, 
  isUserMuted,
  getPrivacySettings 
} from '@/lib/services/privacy'
import type { PrivacyLevel, PrivacySettings } from '@/lib/types/settings'

/**
 * Check if viewer can view a user's profile
 * Returns true if allowed, false otherwise
 */
export async function canViewUserProfile(
  targetUserId: string,
  viewerId: string | null
): Promise<boolean> {
  // Get target user with privacy settings
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { 
      id: true,
      privacy: true
    }
  })
  
  if (!targetUser) {
    return false
  }
  
  const privacy = await getPrivacySettings(targetUserId)
  const profilePrivacy = privacy.profile || 'public'
  
  // Not logged in - only public profiles
  if (!viewerId) {
    return profilePrivacy === 'public'
  }
  
  // Owner can always view their own profile
  if (viewerId === targetUserId) {
    return true
  }
  
  // Check if blocked
  const isBlocked = await isUserBlocked(targetUserId, viewerId)
  if (isBlocked) {
    return false
  }
  
  // Check privacy level
  return await canViewContent(viewerId, targetUserId, profilePrivacy)
}

/**
 * Check if viewer can view a specific profile section
 */
export async function canViewProfileSection(
  targetUserId: string,
  viewerId: string | null,
  section: 'basics' | 'statistics' | 'friends' | 'pets' | 'activity'
): Promise<boolean> {
  // First check if can view profile at all
  const canViewProfile = await canViewUserProfile(targetUserId, viewerId)
  if (!canViewProfile) {
    return false
  }
  
  const privacy = await getPrivacySettings(targetUserId)
  const sectionPrivacy = privacy.sections?.[section]
  
  if (!sectionPrivacy) {
    // If no specific section privacy, use profile privacy
    return canViewProfile
  }
  
  if (!viewerId) {
    return sectionPrivacy === 'public'
  }
  
  if (viewerId === targetUserId) {
    return true
  }
  
  return await canViewContent(viewerId, targetUserId, sectionPrivacy)
}

/**
 * Check if viewer can tag the target user
 */
export async function canTagUser(
  targetUserId: string,
  taggerId: string | null
): Promise<boolean> {
  if (!taggerId) {
    return false
  }
  
  if (taggerId === targetUserId) {
    return true
  }
  
  // Check if blocked
  const isBlocked = await isUserBlocked(targetUserId, taggerId)
  if (isBlocked) {
    return false
  }
  
  const privacy = await getPrivacySettings(targetUserId)
  const allowTagging = privacy.allowTagging || 'public'
  
  return await canViewContent(taggerId, targetUserId, allowTagging)
}

/**
 * Check if tag requires approval before showing on profile
 */
export async function requiresTagApproval(targetUserId: string): Promise<boolean> {
  const privacy = await getPrivacySettings(targetUserId)
  return privacy.tagReviewRequired || false
}

/**
 * Check if viewer can mention the target user
 */
export async function canMentionUser(
  targetUserId: string,
  mentionerId: string | null
): Promise<boolean> {
  if (!mentionerId) {
    return false
  }
  
  if (mentionerId === targetUserId) {
    return true
  }
  
  // Check if blocked
  const isBlocked = await isUserBlocked(targetUserId, mentionerId)
  if (isBlocked) {
    return false
  }
  
  const privacy = await getPrivacySettings(targetUserId)
  const allowMentions = privacy.allowMentions || 'public'
  
  // If set to 'no-one', suppress mentions entirely
  if (allowMentions === 'no-one') {
    return false
  }
  
  return await canViewContent(mentionerId, targetUserId, allowMentions)
}

/**
 * Check if viewer can send a message to the target user
 */
export async function canSendMessage(
  targetUserId: string,
  senderId: string | null
): Promise<boolean> {
  if (!senderId) {
    return false
  }
  
  if (senderId === targetUserId) {
    return true
  }
  
  // Check if blocked
  const isBlocked = await isUserBlocked(targetUserId, senderId)
  if (isBlocked) {
    return false
  }
  
  const privacy = await getPrivacySettings(targetUserId)
  const messagingPrivacy = (privacy as any).messagingPrivacy
  const whoCanMessage = messagingPrivacy?.whoCanMessage || 'public'
  
  return await canViewContent(senderId, targetUserId, whoCanMessage)
}

/**
 * Get list of blocked user IDs for a user
 * Used to filter content in feeds and searches
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.blockedUser.findMany({
    where: { userId },
    select: { blockedId: true }
  })
  
  return blocks.map(b => b.blockedId)
}

/**
 * Get list of muted user IDs for a user
 * Used to filter content in feeds
 */
export async function getMutedUserIds(userId: string): Promise<string[]> {
  const mutes = await prisma.mutedUser.findMany({
    where: { userId },
    select: { mutedId: true }
  })
  
  return mutes.map(m => m.mutedId)
}

/**
 * Get list of users who have blocked the given user
 * Used to prevent the user from viewing their content
 */
export async function getUsersWhoBlockedUser(userId: string): Promise<string[]> {
  const blocks = await prisma.blockedUser.findMany({
    where: { blockedId: userId },
    select: { userId: true }
  })
  
  return blocks.map(b => b.userId)
}

/**
 * Filter posts to exclude blocked and muted users
 * Returns array of user IDs to exclude from queries
 */
export async function getUserIdsToExcludeFromFeed(
  viewerId: string
): Promise<string[]> {
  const [blockedByViewer, mutedByViewer, blockedViewer] = await Promise.all([
    getBlockedUserIds(viewerId),
    getMutedUserIds(viewerId),
    getUsersWhoBlockedUser(viewerId)
  ])
  
  // Combine all lists and remove duplicates
  return Array.from(new Set([
    ...blockedByViewer,
    ...mutedByViewer,
    ...blockedViewer
  ]))
}

/**
 * Check if user should be indexed by search engines
 */
export async function shouldIndexProfile(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { searchIndexingEnabled: true }
  })
  
  return user?.searchIndexingEnabled !== false
}

/**
 * Check if user should appear in internal search results
 */
export async function shouldShowInSearch(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { showInSearch: true }
  })
  
  return user?.showInSearch !== false
}

/**
 * Check if user should appear in recommendations
 */
export async function shouldShowInRecommendations(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { showInRecommendations: true }
  })
  
  return user?.showInRecommendations !== false
}

/**
 * Validate and enforce privacy before creating a tag
 * Throws error if not allowed
 */
export async function enforceTagPrivacy(
  targetUserId: string,
  taggerId: string
): Promise<{ allowed: boolean; requiresApproval: boolean; error?: string }> {
  const canTag = await canTagUser(targetUserId, taggerId)
  
  if (!canTag) {
    return {
      allowed: false,
      requiresApproval: false,
      error: 'You do not have permission to tag this user'
    }
  }
  
  const requiresApproval = await requiresTagApproval(targetUserId)
  
  return {
    allowed: true,
    requiresApproval
  }
}

/**
 * Validate and enforce privacy before creating a mention
 * Returns whether the mention should be created and if notifications should be sent
 */
export async function enforceMentionPrivacy(
  targetUserId: string,
  mentionerId: string
): Promise<{ allowed: boolean; sendNotification: boolean; error?: string }> {
  const canMention = await canMentionUser(targetUserId, mentionerId)
  
  if (!canMention) {
    return {
      allowed: false,
      sendNotification: false,
      error: 'You do not have permission to mention this user'
    }
  }
  
  const privacy = await getPrivacySettings(targetUserId)
  const allowMentions = privacy.allowMentions || 'public'
  
  // If set to 'no-one', suppress notifications
  const sendNotification = allowMentions !== 'no-one'
  
  return {
    allowed: true,
    sendNotification
  }
}

/**
 * Validate and enforce privacy before sending a message
 * Throws error if not allowed
 */
export async function enforceMessagingPrivacy(
  targetUserId: string,
  senderId: string
): Promise<{ allowed: boolean; error?: string }> {
  const canMessage = await canSendMessage(targetUserId, senderId)
  
  if (!canMessage) {
    return {
      allowed: false,
      error: 'You do not have permission to message this user'
    }
  }
  
  return {
    allowed: true
  }
}
