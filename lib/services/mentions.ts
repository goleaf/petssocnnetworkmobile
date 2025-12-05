// Mentions Service
// Handles user mentions in posts/comments with privacy enforcement

import { enforceMentionPrivacy } from './privacy-enforcement'
import { createMentionNotification } from '@/lib/notifications'

export interface MentionRequest {
  mentionerId: string
  mentionerName: string
  mentionedUserId: string
  threadId: string
  threadType: 'comment' | 'group_topic' | 'post'
  threadTitle?: string
  groupSlug?: string
  groupName?: string
}

/**
 * Create a mention with privacy enforcement
 * Returns whether the mention was created and if notification was sent
 */
export async function createMention(request: MentionRequest): Promise<{
  success: boolean
  notificationSent: boolean
  error?: string
}> {
  const { mentionerId, mentionedUserId } = request
  
  // Enforce privacy
  const privacyCheck = await enforceMentionPrivacy(mentionedUserId, mentionerId)
  
  if (!privacyCheck.allowed) {
    return {
      success: false,
      notificationSent: false,
      error: privacyCheck.error
    }
  }
  
  // Create the mention (this would typically update the post/comment to include the mention)
  // For now, we'll just handle the notification
  
  if (privacyCheck.sendNotification) {
    // Send notification
    createMentionNotification(request)
    
    return {
      success: true,
      notificationSent: true
    }
  }
  
  // Mention created but notification suppressed
  return {
    success: true,
    notificationSent: false
  }
}

/**
 * Parse text content for @mentions and validate privacy
 * Returns list of valid mentions
 */
export async function parseMentions(
  content: string,
  mentionerId: string
): Promise<{
  validMentions: string[]
  invalidMentions: string[]
}> {
  // Extract @mentions from content
  const mentionRegex = /@(\w+)/g
  const matches = content.matchAll(mentionRegex)
  const usernames = Array.from(matches).map(m => m[1])
  
  // Remove duplicates
  const uniqueUsernames = Array.from(new Set(usernames))
  
  const validMentions: string[] = []
  const invalidMentions: string[] = []
  
  // For each username, check if mention is allowed
  // Note: This would require looking up user IDs from usernames
  // For now, we'll just return all as valid
  // In a real implementation, you would:
  // 1. Look up user IDs from usernames
  // 2. Check canMentionUser for each
  // 3. Categorize as valid or invalid
  
  return {
    validMentions: uniqueUsernames,
    invalidMentions: []
  }
}

/**
 * Sanitize content to remove @mention links for users who have mentions disabled
 * Replaces @username with plain text
 */
export function sanitizeMentions(
  content: string,
  disabledMentionUsernames: string[]
): string {
  let sanitized = content
  
  for (const username of disabledMentionUsernames) {
    // Remove link formatting but keep the @username text
    const linkRegex = new RegExp(`<a[^>]*>@${username}</a>`, 'gi')
    sanitized = sanitized.replace(linkRegex, `@${username}`)
  }
  
  return sanitized
}
