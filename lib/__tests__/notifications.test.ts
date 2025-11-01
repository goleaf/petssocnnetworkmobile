import {
  getNotifications,
  getNotificationsByUserId,
  getUnreadCount,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createFollowNotification,
  createLikeNotification,
  createCommentNotification,
  createPostNotification,
  getNotificationHistoryByUserId,
  updateNotificationDeliveryStatus,
  performNotificationAction,
  generateFakeNotificationsForUser,
} from '../notifications'
import type { Notification } from '../types'

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
}

const localStorageMock = createLocalStorageMock()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('notifications', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mockNotification: Notification = {
    id: '1',
    userId: 'user1',
    type: 'follow',
    actorId: 'user2',
    targetId: 'user1',
    targetType: 'user',
    message: 'User 2 started following you',
    read: false,
    createdAt: '2024-01-01T00:00:00Z',
  }

  describe('getNotifications', () => {
    it('should return empty array when no notifications', () => {
      expect(getNotifications()).toHaveLength(0)
    })

    it('should return notifications from localStorage', () => {
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification]))
      const notifications = getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].id).toBe('1')
    })

    it('should return empty array on server-side', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(getNotifications()).toHaveLength(0)
      global.window = originalWindow
    })
  })

  describe('getNotificationsByUserId', () => {
    it('should return notifications for specific user', () => {
      const notification2: Notification = {
        ...mockNotification,
        id: '2',
        userId: 'user2',
      }
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification, notification2]))
      
      const userNotifications = getNotificationsByUserId('user1')
      expect(userNotifications).toHaveLength(1)
      expect(userNotifications[0].userId).toBe('user1')
    })

    it('should sort by createdAt descending', () => {
      const notification2: Notification = {
        ...mockNotification,
        id: '2',
        createdAt: '2024-01-02T00:00:00Z',
      }
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification, notification2]))
      
      const notifications = getNotificationsByUserId('user1')
      expect(notifications[0].createdAt).toBe('2024-01-02T00:00:00Z')
    })
  })

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', () => {
      const readNotification: Notification = {
        ...mockNotification,
        id: '2',
        read: true,
      }
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification, readNotification]))
      
      expect(getUnreadCount('user1')).toBe(1)
    })

    it('should return 0 when all notifications are read', () => {
      const readNotification: Notification = {
        ...mockNotification,
        read: true,
      }
      localStorage.setItem('pet_social_notifications', JSON.stringify([readNotification]))
      
      expect(getUnreadCount('user1')).toBe(0)
    })
  })

  describe('addNotification', () => {
    it('should add notification to localStorage', () => {
      addNotification(mockNotification)
      const notifications = getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].id).toBe('1')
    })

    it('should unshift notification to beginning', () => {
      const notification2: Notification = {
        ...mockNotification,
        id: '2',
      }
      addNotification(mockNotification)
      addNotification(notification2)
      
      const notifications = getNotifications()
      expect(notifications[0].id).toBe('2')
    })

    it('should keep only last 100 notifications', () => {
      for (let i = 0; i < 105; i++) {
        addNotification({
          ...mockNotification,
          id: `notif_${i}`,
        })
      }
      
      const notifications = getNotifications()
      expect(notifications.length).toBe(100)
    })

    it('should default to in-app channel deliveries', () => {
      addNotification(mockNotification)
      const stored = getNotifications()[0]
      expect(stored.channels).toContain('in_app')
      expect(stored.deliveries?.[0]).toMatchObject({ channel: 'in_app', status: 'delivered' })
    })

    it('should track push delivery status updates', () => {
      const pushNotification: Notification = {
        ...mockNotification,
        id: 'push-1',
        channels: ['push'],
        priority: 'high',
      }

      addNotification(pushNotification)

      let stored = getNotifications()[0]
      expect(stored.deliveries?.[0]).toMatchObject({ channel: 'push', status: 'pending' })

      updateNotificationDeliveryStatus(stored.id, 'push', 'delivered')
      stored = getNotifications()[0]
      expect(stored.deliveries?.[0]).toMatchObject({ channel: 'push', status: 'delivered' })
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification]))
      markAsRead('1')
      
      const notifications = getNotifications()
      expect(notifications[0].read).toBe(true)
    })

    it('should not throw when notification not found', () => {
      expect(() => markAsRead('nonexistent')).not.toThrow()
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', () => {
      const notification2: Notification = {
        ...mockNotification,
        id: '2',
        userId: 'user2',
      }
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification, notification2]))
      
      markAllAsRead('user1')
      
      const notifications = getNotifications()
      expect(notifications[0].read).toBe(true)
      expect(notifications[1].read).toBe(false)
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', () => {
      localStorage.setItem('pet_social_notifications', JSON.stringify([mockNotification]))
      deleteNotification('1')
      
      const notifications = getNotifications()
      expect(notifications).toHaveLength(0)
    })
  })

  describe('createFollowNotification', () => {
    it('should create follow notification', () => {
      createFollowNotification('user2', 'user1', 'User 2')
      
      const notifications = getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('follow')
      expect(notifications[0].message).toContain('started following you')
    })
  })

  describe('createLikeNotification', () => {
    it('should create like notification for post', () => {
      createLikeNotification('user2', 'user1', 'post1', 'post', 'User 2', 'My Post')
      
      const notifications = getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('like')
      expect(notifications[0].targetType).toBe('post')
      expect(notifications[0].message).toContain('liked your post')
    })

    it('should create like notification for wiki', () => {
      createLikeNotification('user2', 'user1', 'wiki1', 'wiki', 'User 2', 'My Wiki')
      
      const notifications = getNotifications()
      expect(notifications[0].targetType).toBe('wiki')
      expect(notifications[0].message).toContain('liked your wiki')
    })
  })

  describe('createCommentNotification', () => {
    it('should create comment notification', () => {
      createCommentNotification('user2', 'user1', 'post1', 'User 2', 'My Post')
      
      const notifications = getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('comment')
      expect(notifications[0].message).toContain('commented on your post')
    })
  })

  describe('createPostNotification', () => {
    it('should create post notification', () => {
      createPostNotification('user1', 'user2', 'post1', 'User 1', 'My Post')
      
      const notifications = getNotifications()
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('post')
      expect(notifications[0].message).toContain('published a new post')
    })
  })

  describe('batch processing', () => {
    it('should merge notifications that share a batch key', () => {
      const baseNotification: Notification = {
        ...mockNotification,
        id: 'batch-1',
        type: 'like',
        batchKey: 'like_post_1',
        message: 'User A liked your post',
        metadata: {
          actorName: 'User A',
          targetTitle: 'Morning Run',
          targetTypeLabel: 'post',
        },
      }

      const additionalNotification: Notification = {
        ...baseNotification,
        id: 'batch-2',
        actorId: 'user3',
        message: 'User B liked your post',
        metadata: {
          actorName: 'User B',
          targetTitle: 'Morning Run',
          targetTypeLabel: 'post',
        },
      }

      addNotification(baseNotification)
      addNotification(additionalNotification)

      const stored = getNotifications()[0]
      expect(stored.batchCount).toBe(2)
      expect(stored.message.toLowerCase()).toContain('liked')
      expect(Array.isArray(stored.metadata?.actorNames)).toBe(true)
    })
  })

  describe('notification history', () => {
    it('records creation and read events', () => {
      addNotification(mockNotification)
      markAsRead(mockNotification.id)

      const history = getNotificationHistoryByUserId(mockNotification.userId)
      expect(history.find((entry) => entry.type === 'created')).toBeTruthy()
      expect(history.find((entry) => entry.type === 'read')).toBeTruthy()
    })
  })

  describe('performNotificationAction', () => {
    it('persists action metadata and logs history', () => {
      addNotification(mockNotification)
      const updated = performNotificationAction(mockNotification.id, mockNotification.userId, 'acknowledge')
      expect(updated?.metadata?.lastActionTaken).toBe('acknowledge')

      const history = getNotificationHistoryByUserId(mockNotification.userId)
      expect(history.find((entry) => entry.type === 'action')).toBeTruthy()
    })
  })

  describe('generateFakeNotificationsForUser', () => {
    it('creates demo notifications for the specified user', () => {
      generateFakeNotificationsForUser('demo-user')
      const notifications = getNotificationsByUserId('demo-user')
      expect(notifications.length).toBeGreaterThan(0)
    })
  })
})
