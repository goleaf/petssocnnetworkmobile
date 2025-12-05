// Messaging Privacy Service
// Enforces privacy settings for direct messaging

import { enforceMessagingPrivacy } from './privacy-enforcement'
import { getPrivacySettings } from './privacy'

export interface MessageRequest {
  senderId: string
  recipientId: string
  content: string
  conversationId?: string
}

/**
 * Validate message privacy before sending
 * Returns whether the message can be sent
 */
export async function validateMessagePrivacy(
  senderId: string,
  recipientId: string
): Promise<{
  allowed: boolean
  error?: string
}> {
  return await enforceMessagingPrivacy(recipientId, senderId)
}

/**
 * Check if read receipts should be shown for a conversation
 * Returns true if both users have read receipts enabled
 */
export async function shouldShowReadReceipts(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const [privacy1, privacy2] = await Promise.all([
    getPrivacySettings(userId1),
    getPrivacySettings(userId2)
  ])
  
  const messaging1 = (privacy1 as any).messagingPrivacy
  const messaging2 = (privacy2 as any).messagingPrivacy
  
  const readReceipts1 = messaging1?.readReceipts !== false
  const readReceipts2 = messaging2?.readReceipts !== false
  
  // Both users must have read receipts enabled
  return readReceipts1 && readReceipts2
}

/**
 * Check if typing indicators should be shown for a user
 */
export async function shouldShowTypingIndicator(
  userId: string
): Promise<boolean> {
  const privacy = await getPrivacySettings(userId)
  const messagingPrivacy = (privacy as any).messagingPrivacy
  
  return messagingPrivacy?.typingIndicators !== false
}

/**
 * Check if message forwarding is allowed for a message
 */
export async function canForwardMessage(
  originalSenderId: string
): Promise<boolean> {
  const privacy = await getPrivacySettings(originalSenderId)
  const messagingPrivacy = (privacy as any).messagingPrivacy
  
  return messagingPrivacy?.allowForwarding !== false
}

/**
 * Validate and send a message with privacy enforcement
 */
export async function sendMessageWithPrivacy(
  request: MessageRequest
): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const { senderId, recipientId, content } = request
  
  // Validate privacy
  const privacyCheck = await validateMessagePrivacy(senderId, recipientId)
  
  if (!privacyCheck.allowed) {
    return {
      success: false,
      error: privacyCheck.error
    }
  }
  
  // Message is allowed - would integrate with actual messaging system here
  // For now, just return success
  return {
    success: true,
    messageId: `msg_${Date.now()}`
  }
}

/**
 * Filter read receipts based on privacy settings
 * Returns read status only if both users allow read receipts
 */
export async function filterReadReceipts(
  messageReadAt: Record<string, string>,
  senderId: string,
  recipientId: string
): Promise<Record<string, string>> {
  const shouldShow = await shouldShowReadReceipts(senderId, recipientId)
  
  if (!shouldShow) {
    // Return empty object to hide read receipts
    return {}
  }
  
  return messageReadAt
}
