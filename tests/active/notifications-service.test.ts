import {
  getDefaultNotificationSettings,
  shouldSendNotification,
  getNotificationCategories
} from '@/lib/services/notifications'
import type { NotificationSettings } from '@/lib/types/settings'

describe('Notification Service', () => {
  describe('getDefaultNotificationSettings', () => {
    it('should return default settings with all required fields', () => {
      const userId = 'test-user-id'
      const settings = getDefaultNotificationSettings(userId)
      
      expect(settings.userId).toBe(userId)
      expect(settings.channelPreferences).toBeDefined()
      expect(settings.channelPreferences.in_app).toBeDefined()
      expect(settings.channelPreferences.push).toBeDefined()
      expect(settings.channelPreferences.email).toBeDefined()
      expect(settings.channelPreferences.sms).toBeDefined()
      expect(settings.channelPreferences.digest).toBeDefined()
      expect(settings.quietHours).toBeDefined()
      expect(settings.previewSettings).toBeDefined()
    })
    
    it('should have in_app enabled by default', () => {
      const settings = getDefaultNotificationSettings('test-user')
      expect(settings.channelPreferences.in_app.enabled).toBe(true)
    })
    
    it('should have SMS disabled by default', () => {
      const settings = getDefaultNotificationSettings('test-user')
      expect(settings.channelPreferences.sms.enabled).toBe(false)
    })
    
    it('should have quiet hours disabled by default', () => {
      const settings = getDefaultNotificationSettings('test-user')
      expect(settings.quietHours.enabled).toBe(false)
    })
  })
  
  describe('shouldSendNotification', () => {
    let settings: NotificationSettings
    
    beforeEach(() => {
      settings = getDefaultNotificationSettings('test-user')
    })
    
    it('should return false if channel is disabled', () => {
      settings.channelPreferences.push.enabled = false
      
      const result = shouldSendNotification(settings, 'push', 'interactions', 'normal')
      expect(result).toBe(false)
    })
    
    it('should return true if channel is enabled and no filters apply', () => {
      settings.channelPreferences.push.enabled = true
      settings.channelPreferences.push.categories = []
      
      const result = shouldSendNotification(settings, 'push', 'interactions', 'normal')
      expect(result).toBe(true)
    })
    
    it('should return false if category is not in allowed list', () => {
      settings.channelPreferences.push.enabled = true
      settings.channelPreferences.push.categories = ['social', 'messages']
      
      const result = shouldSendNotification(settings, 'push', 'interactions', 'normal')
      expect(result).toBe(false)
    })
    
    it('should return true if category is in allowed list', () => {
      settings.channelPreferences.push.enabled = true
      settings.channelPreferences.push.categories = ['interactions', 'social']
      
      const result = shouldSendNotification(settings, 'push', 'interactions', 'normal')
      expect(result).toBe(true)
    })
    
    it('should return false if priority is below threshold', () => {
      settings.channelPreferences.push.enabled = true
      settings.channelPreferences.push.priorityThreshold = 'high'
      
      const result = shouldSendNotification(settings, 'push', 'interactions', 'normal')
      expect(result).toBe(false)
    })
    
    it('should return true if priority meets threshold', () => {
      settings.channelPreferences.push.enabled = true
      settings.channelPreferences.push.priorityThreshold = 'normal'
      
      const result = shouldSendNotification(settings, 'push', 'interactions', 'high')
      expect(result).toBe(true)
    })
    
    it('should allow urgent notifications during quiet hours if allowCritical is true', () => {
      settings.channelPreferences.push.enabled = true
      settings.quietHours.enabled = true
      settings.quietHours.allowCritical = true
      
      const result = shouldSendNotification(settings, 'push', 'system', 'urgent')
      expect(result).toBe(true)
    })
  })
  
  describe('getNotificationCategories', () => {
    it('should return 9 categories', () => {
      const categories = getNotificationCategories()
      expect(categories).toHaveLength(9)
    })
    
    it('should include all expected categories', () => {
      const categories = getNotificationCategories()
      const categoryIds = categories.map(c => c.id)
      
      expect(categoryIds).toContain('interactions')
      expect(categoryIds).toContain('social')
      expect(categoryIds).toContain('messages')
      expect(categoryIds).toContain('posts')
      expect(categoryIds).toContain('pets')
      expect(categoryIds).toContain('events')
      expect(categoryIds).toContain('marketplace')
      expect(categoryIds).toContain('community')
      expect(categoryIds).toContain('system')
    })
    
    it('should have name and description for each category', () => {
      const categories = getNotificationCategories()
      
      categories.forEach(category => {
        expect(category.id).toBeTruthy()
        expect(category.name).toBeTruthy()
        expect(category.description).toBeTruthy()
      })
    })
  })
})
