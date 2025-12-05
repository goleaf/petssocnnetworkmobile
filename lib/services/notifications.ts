// Notification Service Module
// Manages user notification preferences and delivery logic

import { prisma } from '@/lib/prisma'
import type {
  NotificationSettings,
  NotificationChannelPreference,
  NotificationFrequency,
  NotificationPriorityThreshold,
  NotificationChannel,
  QuietHoursSettings,
  NotificationPreviewSettings
} from '@/lib/types/settings'

/**
 * Get default notification settings for a new user
 */
export function getDefaultNotificationSettings(userId: string): NotificationSettings {
  return {
    userId,
    channelPreferences: {
      in_app: {
        enabled: true,
        frequency: 'real-time',
        priorityThreshold: 'low',
        categories: []
      },
      push: {
        enabled: true,
        frequency: 'real-time',
        priorityThreshold: 'normal',
        categories: []
      },
      email: {
        enabled: true,
        frequency: 'daily',
        priorityThreshold: 'normal',
        categories: []
      },
      sms: {
        enabled: false,
        frequency: 'real-time',
        priorityThreshold: 'urgent',
        categories: []
      },
      digest: {
        enabled: true,
        frequency: 'daily',
        priorityThreshold: 'low',
        categories: []
      }
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      allowCritical: true
    },
    previewSettings: {
      showPreviews: true,
      showOnLockScreen: true
    }
  }
}

/**
 * Get notification settings for a user
 * Returns default settings if none exist
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationSettings: true }
  })
  
  if (!user?.notificationSettings) {
    return getDefaultNotificationSettings(userId)
  }
  
  // Merge with defaults to ensure all fields exist
  const defaults = getDefaultNotificationSettings(userId)
  const stored = user.notificationSettings as Partial<NotificationSettings>
  
  return {
    userId,
    channelPreferences: {
      in_app: { ...defaults.channelPreferences.in_app, ...(stored.channelPreferences?.in_app || {}) },
      push: { ...defaults.channelPreferences.push, ...(stored.channelPreferences?.push || {}) },
      email: { ...defaults.channelPreferences.email, ...(stored.channelPreferences?.email || {}) },
      sms: { ...defaults.channelPreferences.sms, ...(stored.channelPreferences?.sms || {}) },
      digest: { ...defaults.channelPreferences.digest, ...(stored.channelPreferences?.digest || {}) }
    },
    quietHours: { ...defaults.quietHours, ...(stored.quietHours || {}) },
    previewSettings: { ...defaults.previewSettings, ...(stored.previewSettings || {}) }
  }
}

/**
 * Update notification settings for a user
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<void> {
  // Get current settings
  const currentSettings = await getNotificationSettings(userId)
  
  // Merge with new settings
  const updatedSettings: NotificationSettings = {
    userId,
    channelPreferences: {
      in_app: { ...currentSettings.channelPreferences.in_app, ...(settings.channelPreferences?.in_app || {}) },
      push: { ...currentSettings.channelPreferences.push, ...(settings.channelPreferences?.push || {}) },
      email: { ...currentSettings.channelPreferences.email, ...(settings.channelPreferences?.email || {}) },
      sms: { ...currentSettings.channelPreferences.sms, ...(settings.channelPreferences?.sms || {}) },
      digest: { ...currentSettings.channelPreferences.digest, ...(settings.channelPreferences?.digest || {}) }
    },
    quietHours: { ...currentSettings.quietHours, ...(settings.quietHours || {}) },
    previewSettings: { ...currentSettings.previewSettings, ...(settings.previewSettings || {}) }
  }
  
  // Save to database
  await prisma.user.update({
    where: { id: userId },
    data: { 
      notificationSettings: updatedSettings as any
    }
  })
}

/**
 * Check if a notification should be sent based on user preferences
 * 
 * @param settings - User's notification settings
 * @param channel - Delivery channel (in_app, push, email, sms, digest)
 * @param category - Notification category (interactions, social, messages, etc.)
 * @param priority - Notification priority (low, normal, high, urgent)
 * @returns true if notification should be sent, false otherwise
 */
export function shouldSendNotification(
  settings: NotificationSettings,
  channel: NotificationChannel,
  category: string,
  priority: NotificationPriorityThreshold
): boolean {
  const channelPref = settings.channelPreferences[channel]
  
  // Check if channel is enabled
  if (!channelPref?.enabled) {
    return false
  }
  
  // Check category filter (empty array means all categories allowed)
  if (channelPref.categories.length > 0 && !channelPref.categories.includes(category)) {
    return false
  }
  
  // Check priority threshold
  const priorityLevels: NotificationPriorityThreshold[] = ['low', 'normal', 'high', 'urgent']
  const requiredIndex = priorityLevels.indexOf(channelPref.priorityThreshold)
  const actualIndex = priorityLevels.indexOf(priority)
  
  if (actualIndex < requiredIndex) {
    return false
  }
  
  // Check quiet hours (only for push notifications)
  if (channel === 'push' && settings.quietHours.enabled) {
    // Critical notifications bypass quiet hours if allowed
    if (priority === 'urgent' && settings.quietHours.allowCritical) {
      return true
    }
    
    // Check if current time is within quiet hours
    if (isWithinQuietHours(settings.quietHours)) {
      return false
    }
  }
  
  return true
}

/**
 * Check if current time is within quiet hours
 */
function isWithinQuietHours(quietHours: QuietHoursSettings): boolean {
  const now = new Date()
  const currentDay = now.getDay() // 0-6, Sunday-Saturday
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  // Check if today is in the quiet hours days
  if (!quietHours.days.includes(currentDay)) {
    return false
  }
  
  // Check if current time is within the range
  return isTimeInRange(currentTime, quietHours.startTime, quietHours.endTime)
}

/**
 * Check if a time is within a time range
 * Handles ranges that cross midnight (e.g., 22:00 to 07:00)
 */
function isTimeInRange(current: string, start: string, end: string): boolean {
  const currentMinutes = timeToMinutes(current)
  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)
  
  // Range doesn't cross midnight
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }
  
  // Range crosses midnight (e.g., 22:00 to 07:00)
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

/**
 * Convert HH:mm time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Get notification categories
 * Returns the list of available notification categories
 */
export function getNotificationCategories(): Array<{
  id: string
  name: string
  description: string
}> {
  return [
    {
      id: 'interactions',
      name: 'Interactions',
      description: 'Likes, comments, and reactions on your posts'
    },
    {
      id: 'social',
      name: 'Social',
      description: 'New followers, friend requests, and mentions'
    },
    {
      id: 'messages',
      name: 'Messages',
      description: 'Direct messages and chat notifications'
    },
    {
      id: 'posts',
      name: 'Posts',
      description: 'New posts from people you follow'
    },
    {
      id: 'pets',
      name: 'Pets',
      description: 'Pet health reminders and updates'
    },
    {
      id: 'events',
      name: 'Events',
      description: 'Event invitations and reminders'
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Product listings and marketplace activity'
    },
    {
      id: 'community',
      name: 'Community',
      description: 'Group posts and community updates'
    },
    {
      id: 'system',
      name: 'System',
      description: 'Security alerts and account notifications'
    }
  ]
}

/**
 * Check if a notification should show preview content
 */
export function shouldShowNotificationPreview(
  settings: NotificationSettings,
  isLockScreen: boolean
): boolean {
  if (!settings.previewSettings.showPreviews) {
    return false
  }
  
  if (isLockScreen && !settings.previewSettings.showOnLockScreen) {
    return false
  }
  
  return true
}
