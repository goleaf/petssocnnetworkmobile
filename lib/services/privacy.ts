// Privacy Service Module
// Manages user privacy settings and access control

import { prisma } from '@/lib/prisma'
import type { PrivacySettings, PrivacyLevel, MessagingPrivacySettings } from '@/lib/types/settings'

/**
 * Get default privacy settings for a new user
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return {
    // Profile visibility
    profile: 'public',
    email: 'private',
    phone: 'private',
    birthday: 'public_hide_year',
    age: 'public',
    location: 'followers-only',
    onlineStatus: true,
    
    // Content visibility
    pets: 'public',
    posts: 'public',
    followers: 'public',
    following: 'public',
    
    // Interaction permissions
    allowTagging: 'public',
    tagReviewRequired: false,
    tagNotifications: true,
    allowMentions: 'public',
    
    // Search and discoverability
    searchable: true,
    searchIndexingEnabled: true,
    showInSearch: true,
    showInRecommendations: true,
    
    // Profile sections
    sections: {
      basics: 'public',
      statistics: 'public',
      friends: 'public',
      pets: 'public',
      activity: 'public'
    }
  }
}

/**
 * Get default messaging privacy settings
 */
export function getDefaultMessagingPrivacySettings(): MessagingPrivacySettings {
  return {
    whoCanMessage: 'public',
    readReceipts: true,
    typingIndicators: true,
    allowForwarding: true
  }
}

/**
 * Get privacy settings for a user
 */
export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { privacy: true }
  })
  
  if (!user?.privacy) {
    return getDefaultPrivacySettings()
  }
  
  // Merge with defaults to ensure all fields exist
  return {
    ...getDefaultPrivacySettings(),
    ...(user.privacy as Partial<PrivacySettings>)
  }
}

/**
 * Update privacy settings for a user
 */
export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<void> {
  // Get current settings
  const currentSettings = await getPrivacySettings(userId)
  
  // Merge with new settings
  const updatedSettings = {
    ...currentSettings,
    ...settings,
    sections: {
      ...currentSettings.sections,
      ...(settings.sections || {})
    }
  }
  
  // Save to database
  await prisma.user.update({
    where: { id: userId },
    data: { 
      privacy: updatedSettings as any,
      // Update top-level fields if they're in the settings
      searchIndexingEnabled: settings.searchIndexingEnabled ?? currentSettings.searchIndexingEnabled,
      showInSearch: settings.showInSearch ?? currentSettings.showInSearch,
      showInRecommendations: settings.showInRecommendations ?? currentSettings.showInRecommendations
    }
  })
}

/**
 * Check if a viewer can view a target user's profile based on privacy level
 */
export async function canViewProfile(
  viewerId: string | null,
  targetUserId: string
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
  
  const privacy = targetUser.privacy as PrivacySettings | null
  const profilePrivacy = privacy?.profile || 'public'
  
  return canViewContent(viewerId, targetUserId, profilePrivacy)
}

/**
 * Check if viewer can see content based on privacy level
 * This is a helper function that checks privacy levels and relationships
 */
export async function canViewContent(
  viewerId: string | null,
  ownerId: string,
  privacyLevel: PrivacyLevel
): Promise<boolean> {
  // Not logged in - only public content
  if (!viewerId) {
    return privacyLevel === 'public'
  }
  
  // Owner can always see their own content
  if (viewerId === ownerId) {
    return true
  }
  
  // Check if blocked
  const isBlocked = await isUserBlocked(ownerId, viewerId)
  if (isBlocked) {
    return false
  }
  
  // Check privacy level
  if (privacyLevel === 'public') {
    return true
  }
  
  if (privacyLevel === 'private' || privacyLevel === 'no-one') {
    return false
  }
  
  // For followers-only and friends-only, check relationship
  if (privacyLevel === 'followers-only') {
    return await isFollower(ownerId, viewerId)
  }
  
  if (privacyLevel === 'friends-only') {
    return await areMutualFollowers(ownerId, viewerId)
  }
  
  return false
}

/**
 * Check if user A is blocked by user B
 */
export async function isUserBlocked(userId: string, potentialBlockedId: string): Promise<boolean> {
  const block = await prisma.blockedUser.findUnique({
    where: {
      userId_blockedId: {
        userId,
        blockedId: potentialBlockedId
      }
    }
  })
  
  return !!block
}

/**
 * Check if viewer is a follower of the target user
 * Note: This is a placeholder - actual implementation depends on your follower system
 */
async function isFollower(targetUserId: string, viewerId: string): Promise<boolean> {
  // TODO: Implement based on your follower system
  // This might query a Follower table or check a followers array
  return false
}

/**
 * Check if two users are mutual followers (friends)
 */
async function areMutualFollowers(userId1: string, userId2: string): Promise<boolean> {
  // TODO: Implement based on your follower system
  const isUser1FollowingUser2 = await isFollower(userId1, userId2)
  const isUser2FollowingUser1 = await isFollower(userId2, userId1)
  
  return isUser1FollowingUser2 && isUser2FollowingUser1
}

/**
 * Block a user
 */
export async function blockUser(userId: string, blockedId: string): Promise<void> {
  // Prevent self-blocking
  if (userId === blockedId) {
    throw new Error('Cannot block yourself')
  }
  
  // Create block relationship
  await prisma.blockedUser.create({
    data: {
      userId,
      blockedId
    }
  })
  
  // TODO: Remove follower relationships if they exist
  // TODO: Remove from feeds
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string, blockedId: string): Promise<void> {
  await prisma.blockedUser.deleteMany({
    where: {
      userId,
      blockedId
    }
  })
}

/**
 * Mute a user
 */
export async function muteUser(userId: string, mutedId: string): Promise<void> {
  // Prevent self-muting
  if (userId === mutedId) {
    throw new Error('Cannot mute yourself')
  }
  
  await prisma.mutedUser.create({
    data: {
      userId,
      mutedId
    }
  })
}

/**
 * Unmute a user
 */
export async function unmuteUser(userId: string, mutedId: string): Promise<void> {
  await prisma.mutedUser.deleteMany({
    where: {
      userId,
      mutedId
    }
  })
}

/**
 * Get list of blocked users for a user
 */
export async function getBlockedUsers(userId: string) {
  return await prisma.blockedUser.findMany({
    where: { userId },
    include: {
      blocked: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { blockedAt: 'desc' }
  })
}

/**
 * Get list of muted users for a user
 */
export async function getMutedUsers(userId: string) {
  return await prisma.mutedUser.findMany({
    where: { userId },
    include: {
      muted: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { mutedAt: 'desc' }
  })
}

/**
 * Check if user is muted by another user
 */
export async function isUserMuted(userId: string, potentialMutedId: string): Promise<boolean> {
  const mute = await prisma.mutedUser.findUnique({
    where: {
      userId_mutedId: {
        userId,
        mutedId: potentialMutedId
      }
    }
  })
  
  return !!mute
}
