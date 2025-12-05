'use server'

import { getCurrentUser } from '@/lib/auth-server'
import {
  updatePrivacySettings as updatePrivacySettingsService,
  getPrivacySettings as getPrivacySettingsService,
  blockUser,
  unblockUser,
  muteUser,
  unmuteUser,
  getBlockedUsers,
  getMutedUsers,
  bulkBlockUsers
} from '@/lib/services/privacy'
import {
  canViewUserProfile,
  canViewProfileSection,
  canTagUser,
  canMentionUser,
  canSendMessage,
  shouldIndexProfile,
  shouldShowInSearch,
  shouldShowInRecommendations
} from '@/lib/services/privacy-enforcement'
import { prisma } from '@/lib/prisma'
import type { PrivacySettings, MessagingPrivacySettings } from '@/lib/types/settings'

export async function updatePrivacySettingsAction(settings: any) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    await updatePrivacySettingsService(user.id, settings)
    return { success: true }
  } catch (error) {
    console.error('Error updating privacy settings:', error)
    return { success: false, error: 'Failed to update privacy settings' }
  }
}

export async function getPrivacySettingsAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', settings: null }
    }
    
    const settings = await getPrivacySettingsService(user.id)
    return { success: true, settings }
  } catch (error) {
    console.error('Error getting privacy settings:', error)
    return { success: false, error: 'Failed to get privacy settings', settings: null }
  }
}

export async function updateMessagingPrivacyAction(settings: MessagingPrivacySettings) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const currentPrivacy = await getPrivacySettingsService(user.id)
    
    // Merge messaging settings into privacy settings
    const updatedPrivacy = {
      ...currentPrivacy,
      messagingPrivacy: settings
    }
    
    await updatePrivacySettingsService(user.id, updatedPrivacy)
    return { success: true }
  } catch (error) {
    console.error('Error updating messaging privacy:', error)
    return { success: false, error: 'Failed to update messaging privacy' }
  }
}

export async function getMessagingPrivacyAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', settings: null }
    }
    
    const privacySettings = await getPrivacySettingsService(user.id)
    const messagingPrivacy = (privacySettings as any).messagingPrivacy || {
      whoCanMessage: 'public',
      readReceipts: true,
      typingIndicators: true,
      allowForwarding: true
    }
    
    return { success: true, settings: messagingPrivacy }
  } catch (error) {
    console.error('Error getting messaging privacy:', error)
    return { success: false, error: 'Failed to get messaging privacy', settings: null }
  }
}

export async function blockUserAction(username: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })
    
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }
    
    await blockUser(user.id, targetUser.id)
    return { success: true }
  } catch (error: any) {
    console.error('Error blocking user:', error)
    return { success: false, error: error.message || 'Failed to block user' }
  }
}

export async function unblockUserAction(username: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })
    
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }
    
    await unblockUser(user.id, targetUser.id)
    return { success: true }
  } catch (error) {
    console.error('Error unblocking user:', error)
    return { success: false, error: 'Failed to unblock user' }
  }
}

export async function muteUserAction(username: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })
    
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }
    
    await muteUser(user.id, targetUser.id)
    return { success: true }
  } catch (error: any) {
    console.error('Error muting user:', error)
    return { success: false, error: error.message || 'Failed to mute user' }
  }
}

export async function unmuteUserAction(username: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    })
    
    if (!targetUser) {
      return { success: false, error: 'User not found' }
    }
    
    await unmuteUser(user.id, targetUser.id)
    return { success: true }
  } catch (error) {
    console.error('Error unmuting user:', error)
    return { success: false, error: 'Failed to unmute user' }
  }
}

export async function getBlockedUsersAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', users: [] }
    }
    
    const blockedUsers = await getBlockedUsers(user.id)
    return { success: true, users: blockedUsers }
  } catch (error) {
    console.error('Error getting blocked users:', error)
    return { success: false, error: 'Failed to get blocked users', users: [] }
  }
}

export async function getMutedUsersAction() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', users: [] }
    }
    
    const mutedUsers = await getMutedUsers(user.id)
    return { success: true, users: mutedUsers }
  } catch (error) {
    console.error('Error getting muted users:', error)
    return { success: false, error: 'Failed to get muted users', users: [] }
  }
}

export async function bulkBlockUsersAction(usernames: string[]) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Unauthorized', results: [] }
    }
    
    const results = await bulkBlockUsers(user.id, usernames)
    return { success: true, results }
  } catch (error) {
    console.error('Error bulk blocking users:', error)
    return { success: false, error: 'Failed to block users', results: [] }
  }
}

// Privacy check actions for client components
export async function canViewProfileAction(targetUserId: string) {
  try {
    const user = await getCurrentUser()
    const viewerId = user?.id || null
    
    const canView = await canViewUserProfile(targetUserId, viewerId)
    return { success: true, canView }
  } catch (error) {
    console.error('Error checking profile view permission:', error)
    return { success: false, canView: false, error: 'Failed to check permission' }
  }
}

export async function canViewProfileSectionAction(
  targetUserId: string,
  section: 'basics' | 'statistics' | 'friends' | 'pets' | 'activity'
) {
  try {
    const user = await getCurrentUser()
    const viewerId = user?.id || null
    
    const canView = await canViewProfileSection(targetUserId, viewerId, section)
    return { success: true, canView }
  } catch (error) {
    console.error('Error checking section view permission:', error)
    return { success: false, canView: false, error: 'Failed to check permission' }
  }
}

export async function canTagUserAction(targetUserId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: true, canTag: false }
    }
    
    const canTag = await canTagUser(targetUserId, user.id)
    return { success: true, canTag }
  } catch (error) {
    console.error('Error checking tag permission:', error)
    return { success: false, canTag: false, error: 'Failed to check permission' }
  }
}

export async function canMentionUserAction(targetUserId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: true, canMention: false }
    }
    
    const canMention = await canMentionUser(targetUserId, user.id)
    return { success: true, canMention }
  } catch (error) {
    console.error('Error checking mention permission:', error)
    return { success: false, canMention: false, error: 'Failed to check permission' }
  }
}

export async function canSendMessageAction(targetUserId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: true, canSend: false }
    }
    
    const canSend = await canSendMessage(targetUserId, user.id)
    return { success: true, canSend }
  } catch (error) {
    console.error('Error checking message permission:', error)
    return { success: false, canSend: false, error: 'Failed to check permission' }
  }
}

export async function getProfileMetadataAction(userId: string) {
  try {
    const shouldIndex = await shouldIndexProfile(userId)
    const showInSearch = await shouldShowInSearch(userId)
    const showInRecommendations = await shouldShowInRecommendations(userId)
    
    return {
      success: true,
      metadata: {
        shouldIndex,
        showInSearch,
        showInRecommendations
      }
    }
  } catch (error) {
    console.error('Error getting profile metadata:', error)
    return {
      success: false,
      error: 'Failed to get profile metadata',
      metadata: null
    }
  }
}
