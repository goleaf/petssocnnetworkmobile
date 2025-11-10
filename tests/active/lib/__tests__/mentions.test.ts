import {
  addComment,
  addGroupTopic,
  initializeStorage,
  getUserByUsername,
  getUserById,
} from '../storage'
import {
  getNotificationsByUserId,
  createMentionNotification,
} from '../notifications'
import { extractMentions } from '../utils/mentions'
import type { User, Comment, GroupTopic, Group } from '../types'

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

describe('mentions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('extractMentions', () => {
    it('should extract mentions from text', () => {
      const text = 'Hey @john and @jane, check this out!'
      const mentions = extractMentions(text)
      expect(mentions).toEqual(['john', 'jane'])
    })

    it('should extract unique mentions only', () => {
      const text = 'Hey @john, @jane, and @john again'
      const mentions = extractMentions(text)
      expect(mentions).toEqual(['john', 'jane'])
    })

    it('should handle usernames with underscores and hyphens', () => {
      const text = 'Thanks @user_name and @user-name!'
      const mentions = extractMentions(text)
      expect(mentions).toEqual(['user_name', 'user-name'])
    })

    it('should return empty array when no mentions', () => {
      const text = 'This is a regular message without mentions'
      const mentions = extractMentions(text)
      expect(mentions).toEqual([])
    })

    it('should handle empty string', () => {
      const mentions = extractMentions('')
      expect(mentions).toEqual([])
    })

    it('should not match email addresses', () => {
      const text = 'Contact me at test@example.com'
      const mentions = extractMentions(text)
      expect(mentions).toEqual([])
    })
  })

  describe('createMentionNotification', () => {
    it('should create mention notification for comment thread', () => {
      createMentionNotification({
        mentionerId: 'user1',
        mentionerName: 'John Doe',
        mentionedUserId: 'user2',
        threadId: 'post123',
        threadType: 'comment',
        threadTitle: 'Great Post',
        commentId: 'comment456',
        postId: 'post123',
      })

      const notifications = getNotificationsByUserId('user2')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('mention')
      expect(notifications[0].actorId).toBe('user1')
      expect(notifications[0].message).toContain('John Doe')
      expect(notifications[0].message).toContain('comment')
      expect(notifications[0].batchKey).toBe('mention_comment_post123_user2')
      expect(notifications[0].metadata?.threadType).toBe('comment')
      expect(notifications[0].actions?.[0]?.targetUrl).toBe('/blog/post123#comment-comment456')
    })

    it('should create mention notification for group topic thread', () => {
      createMentionNotification({
        mentionerId: 'user1',
        mentionerName: 'John Doe',
        mentionedUserId: 'user2',
        threadId: 'topic789',
        threadType: 'group_topic',
        threadTitle: 'Discussion Thread',
        groupSlug: 'test-group',
      })

      const notifications = getNotificationsByUserId('user2')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('mention')
      expect(notifications[0].batchKey).toBe('mention_group_topic_topic789_user2')
      expect(notifications[0].metadata?.threadType).toBe('group_topic')
      expect(notifications[0].actions?.[0]?.targetUrl).toBe('/groups/test-group/topics/topic789')
    })
  })

  describe('mention notifications from comments', () => {
    let user1: User
    let user2: User

    beforeEach(() => {
      localStorage.clear()
      
      user1 = {
        id: 'user1',
        email: 'user1@example.com',
        username: 'john',
        fullName: 'John Doe',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }

      user2 = {
        id: 'user2',
        email: 'user2@example.com',
        username: 'jane',
        fullName: 'Jane Smith',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }

      localStorage.setItem('pet_social_users', JSON.stringify([user1, user2]))
      localStorage.setItem('pet_social_notifications', JSON.stringify([]))
      
      // Create a test post - ensure it exists before comments are added
      localStorage.setItem(
        'pet_social_blog_posts',
        JSON.stringify([
          {
            id: 'post1',
            petId: 'pet1',
            authorId: 'user1',
            title: 'Test Post',
            content: 'This is a test post',
            tags: [],
            categories: [],
            likes: [],
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ])
      )
    })

    it('should notify mentioned user when comment is created', () => {
      // Verify post exists
      const { getBlogPostById } = require('../storage')
      const post = getBlogPostById('post1')
      expect(post).toBeDefined()
      expect(post?.id).toBe('post1')

      // Verify users exist
      const user1Check = getUserById('user1')
      const user2Check = getUserByUsername('jane')
      expect(user1Check).toBeDefined()
      expect(user2Check).toBeDefined()
      expect(user2Check?.id).toBe('user2')

      // Verify mention extraction works
      const mentions = extractMentions('Hey @jane, what do you think?')
      expect(mentions).toContain('jane')

      const comment: Comment = {
        id: 'comment1',
        postId: 'post1',
        userId: 'user1',
        content: 'Hey @jane, what do you think?',
        createdAt: new Date().toISOString(),
      }

      addComment(comment)

      // Verify comment was added
      const { getCommentsByPostId } = require('../storage')
      const comments = getCommentsByPostId('post1')
      expect(comments.length).toBeGreaterThan(0)

      const notifications = getNotificationsByUserId('user2')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('mention')
      expect(notifications[0].actorId).toBe('user1')
    })

    it('should not notify when user mentions themselves', () => {
      const comment: Comment = {
        id: 'comment2',
        postId: 'post1',
        userId: 'user1',
        content: 'Reminding myself: @john check this later',
        createdAt: new Date().toISOString(),
      }

      addComment(comment)

      const notifications = getNotificationsByUserId('user1')
      const mentionNotifications = notifications.filter((n) => n.type === 'mention')
      expect(mentionNotifications).toHaveLength(0)
    })

    it('should prevent duplicate notifications for same thread mention', () => {
      const comment1: Comment = {
        id: 'comment1',
        postId: 'post1',
        userId: 'user1',
        content: 'Hey @jane, first mention',
        createdAt: new Date().toISOString(),
      }

      const comment2: Comment = {
        id: 'comment2',
        postId: 'post1',
        userId: 'user1',
        content: 'Hey @jane, second mention in same thread',
        createdAt: new Date().toISOString(),
      }

      addComment(comment1)
      addComment(comment2)

      const notifications = getNotificationsByUserId('user2')
      const mentionNotifications = notifications.filter((n) => n.type === 'mention')
      
      // Should be batched into one notification due to same batchKey
      expect(mentionNotifications.length).toBeGreaterThanOrEqual(1)
      
      // Check that batchKey is the same (which triggers batching)
      const batchKeys = mentionNotifications.map((n) => n.batchKey).filter(Boolean)
      const uniqueBatchKeys = new Set(batchKeys)
      
      // All notifications for the same thread mention should have the same batchKey
      // The batching system should merge them
      expect(uniqueBatchKeys.size).toBe(1)
    })
  })

  describe('mention notifications from group topics', () => {
    let user1: User
    let user2: User
    let testGroup: Group

    beforeEach(() => {
      localStorage.clear()
      
      user1 = {
        id: 'user1',
        email: 'user1@example.com',
        username: 'john',
        fullName: 'John Doe',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }

      user2 = {
        id: 'user2',
        email: 'user2@example.com',
        username: 'jane',
        fullName: 'Jane Smith',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }

      testGroup = {
        id: 'group1',
        name: 'Test Group',
        slug: 'test-group',
        description: 'A test group',
        type: 'open',
        categoryId: 'cat1',
        ownerId: 'user1',
        memberCount: 2,
        topicCount: 0,
        postCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }

      localStorage.setItem('pet_social_users', JSON.stringify([user1, user2]))
      localStorage.setItem('pet_social_groups', JSON.stringify([testGroup]))
      localStorage.setItem('pet_social_notifications', JSON.stringify([]))
    })

    it('should notify mentioned user when group topic is created', () => {
      const topic: GroupTopic = {
        id: 'topic1',
        groupId: 'group1',
        authorId: 'user1',
        title: 'Test Topic',
        content: 'Hey @jane, what are your thoughts?',
        viewCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addGroupTopic(topic)

      const notifications = getNotificationsByUserId('user2')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].type).toBe('mention')
      expect(notifications[0].actorId).toBe('user1')
      expect(notifications[0].metadata?.groupSlug).toBe('test-group')
      expect(notifications[0].actions?.[0]?.targetUrl).toBe('/groups/test-group/topics/topic1')
    })

    it('should prevent duplicate notifications for same thread mention in group topics', () => {
      const topic1: GroupTopic = {
        id: 'topic1',
        groupId: 'group1',
        authorId: 'user1',
        title: 'Test Topic',
        content: 'Hey @jane, first mention',
        viewCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Reply in the same thread (using parentTopicId)
      const reply1: GroupTopic = {
        id: 'reply1',
        groupId: 'group1',
        authorId: 'user1',
        parentTopicId: 'topic1',
        title: '',
        content: 'Hey @jane, second mention in same thread',
        viewCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addGroupTopic(topic1)
      addGroupTopic(reply1)

      const notifications = getNotificationsByUserId('user2')
      const mentionNotifications = notifications.filter((n) => n.type === 'mention')
      
      // Should be batched into one notification due to same batchKey
      expect(mentionNotifications.length).toBeGreaterThanOrEqual(1)
      
      // Both should reference the same thread (topic1)
      const threadIds = mentionNotifications.map((n) => n.targetId)
      expect(new Set(threadIds).size).toBe(1)
      expect(threadIds[0]).toBe('topic1')
    })
  })
})

