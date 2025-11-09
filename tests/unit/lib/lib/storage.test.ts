import {
  initializeStorage,
  getCurrentUser,
  setCurrentUser,
  getUsers,
  getUserByUsername,
  getUserById,
  updateUser,
  toggleFollow,
  blockUser,
  unblockUser,
  areUsersBlocked,
  togglePetFollow,
  getPets,
  getPetById,
  getPetsByOwnerId,
  updatePet,
  addPet,
  getBlogPosts,
  getBlogPostById,
  getBlogPostsByPetId,
  addBlogPost,
  updateBlogPost,
  getComments,
  getCommentsByPostId,
  addComment,
  flagComment,
  clearCommentFlag,
  moderateComment,
  getWikiArticles,
  getWikiArticleBySlug,
  getWikiArticlesByCategory,
  updateWikiArticle,
  getActivities,
  addActivity,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  removePetFriendship,
  getGroupTopicsByGroupId,
  getGroupTopicById,
  addGroupTopic,
} from '@/lib/storage'
import type { User, Pet, BlogPost, Comment, WikiArticle, Activity, GroupTopic } from '@/lib/types'

// Mock localStorage with Jest-compatible methods
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

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initializeStorage', () => {
    it('should initialize empty storage with mock data', () => {
      initializeStorage()
      expect(localStorage.getItem('pet_social_users')).toBeTruthy()
      expect(localStorage.getItem('pet_social_pets')).toBeTruthy()
      expect(localStorage.getItem('pet_social_blog_posts')).toBeTruthy()
    })
  })

  describe('User operations', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      fullName: 'Test User',
      joinedAt: '2024-01-01',
      followers: [],
      following: [],
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_users', JSON.stringify([mockUser]))
    })

    it('should get all users', () => {
      const users = getUsers()
      expect(users).toHaveLength(1)
      expect(users[0].username).toBe('testuser')
    })

    it('should get user by username', () => {
      const user = getUserByUsername('testuser')
      expect(user).toBeDefined()
      expect(user?.username).toBe('testuser')
    })

    it('should return undefined for non-existent username', () => {
      const user = getUserByUsername('nonexistent')
      expect(user).toBeUndefined()
    })

    it('should get user by id', () => {
      const user = getUserById('1')
      expect(user).toBeDefined()
      expect(user?.id).toBe('1')
    })

    it('should return undefined for non-existent id', () => {
      const user = getUserById('999')
      expect(user).toBeUndefined()
    })

    it('should update user', () => {
      updateUser('1', { fullName: 'Updated Name' })
      const user = getUserById('1')
      expect(user?.fullName).toBe('Updated Name')
    })

    it('should set current user', () => {
      setCurrentUser('1')
      expect(localStorage.getItem('pet_social_current_user')).toBe('1')
    })

    it('should get current user', () => {
      setCurrentUser('1')
      const user = getCurrentUser()
      expect(user).toBeDefined()
      expect(user?.id).toBe('1')
    })

    it('should return null when no current user', () => {
      const user = getCurrentUser()
      expect(user).toBeNull()
    })

    it('should toggle follow relationship', () => {
      const user2: User = {
        id: '2',
        email: 'user2@example.com',
        username: 'user2',
        fullName: 'User 2',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }
      localStorage.setItem('pet_social_users', JSON.stringify([mockUser, user2]))

      toggleFollow('1', '2')
      const user1 = getUserById('1')
      const user2Updated = getUserById('2')
      expect(user1?.following).toContain('2')
      expect(user2Updated?.followers).toContain('1')

      toggleFollow('1', '2')
      const user1Unfollow = getUserById('1')
      const user2Unfollow = getUserById('2')
      expect(user1Unfollow?.following).not.toContain('2')
      expect(user2Unfollow?.followers).not.toContain('1')
    })

    it('should report when users are blocked', () => {
      const user2: User = {
        id: '2',
        email: 'user2@example.com',
        username: 'user2',
        fullName: 'User 2',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }
      localStorage.setItem('pet_social_users', JSON.stringify([mockUser, user2]))

      expect(areUsersBlocked('1', '2')).toBe(false)

      blockUser('1', '2')
      expect(areUsersBlocked('1', '2')).toBe(true)
      expect(areUsersBlocked('2', '1')).toBe(true)

      unblockUser('1', '2')
      expect(areUsersBlocked('1', '2')).toBe(false)
    })
  })

  describe('Pet operations', () => {
    const mockPet: Pet = {
      id: '1',
      ownerId: 'user1',
      name: 'Fluffy',
      species: 'cat',
      followers: [],
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_pets', JSON.stringify([mockPet]))
    })

    it('should get all pets', () => {
      const pets = getPets()
      expect(pets).toHaveLength(1)
      expect(pets[0].name).toBe('Fluffy')
    })

    it('should get pet by id', () => {
      const pet = getPetById('1')
      expect(pet).toBeDefined()
      expect(pet?.name).toBe('Fluffy')
    })

    it('should return undefined for non-existent pet id', () => {
      const pet = getPetById('999')
      expect(pet).toBeUndefined()
    })

    it('should get pets by owner id', () => {
      const pets = getPetsByOwnerId('user1')
      expect(pets).toHaveLength(1)
      expect(pets[0].ownerId).toBe('user1')
    })

    it('should return empty array for owner with no pets', () => {
      const pets = getPetsByOwnerId('nonexistent')
      expect(pets).toHaveLength(0)
    })

    it('should update pet', () => {
      updatePet({ ...mockPet, name: 'Updated Name' })
      const pet = getPetById('1')
      expect(pet?.name).toBe('Updated Name')
    })

    it('should add new pet', () => {
      const newPet: Pet = {
        id: '2',
        ownerId: 'user1',
        name: 'Buddy',
        species: 'dog',
        followers: [],
      }
      addPet(newPet)
      const pets = getPets()
      expect(pets).toHaveLength(2)
      expect(pets.find(p => p.id === '2')?.name).toBe('Buddy')
    })
  })

  describe('Follow operations', () => {
    it('should toggle pet follow relationship', () => {
      const follower: User = {
        id: '1',
        email: 'follower@example.com',
        username: 'follower',
        fullName: 'Follower User',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
        followingPets: [],
      }
      const owner: User = {
        id: 'owner1',
        email: 'owner@example.com',
        username: 'owner',
        fullName: 'Owner User',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
        followingPets: [],
      }
      localStorage.setItem('pet_social_users', JSON.stringify([follower, owner]))

      const pet: Pet = {
        id: 'pet1',
        ownerId: 'owner1',
        name: 'Buddy',
        species: 'dog',
        followers: [],
      }
      localStorage.setItem('pet_social_pets', JSON.stringify([pet]))

      togglePetFollow('1', 'pet1')
      const updatedUser = getUserById('1')
      const updatedPet = getPetById('pet1')
      expect(updatedUser?.followingPets).toContain('pet1')
      expect(updatedPet?.followers).toContain('1')

      togglePetFollow('1', 'pet1')
      const userAfterUnfollow = getUserById('1')
      const petAfterUnfollow = getPetById('pet1')
      expect(userAfterUnfollow?.followingPets).not.toContain('pet1')
      expect(petAfterUnfollow?.followers).not.toContain('1')
    })

    it('should prevent following a pet when owner blocks the user', () => {
      const follower: User = {
        id: '1',
        email: 'follower@example.com',
        username: 'follower',
        fullName: 'Follower User',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
        followingPets: [],
      }
      const owner: User = {
        id: 'owner1',
        email: 'owner@example.com',
        username: 'owner',
        fullName: 'Owner User',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
        followingPets: [],
        blockedUsers: ['1'],
      }
      localStorage.setItem('pet_social_users', JSON.stringify([follower, owner]))

      const pet: Pet = {
        id: 'pet1',
        ownerId: 'owner1',
        name: 'Buddy',
        species: 'dog',
        followers: [],
      }
      localStorage.setItem('pet_social_pets', JSON.stringify([pet]))

      togglePetFollow('1', 'pet1')
      const updatedUser = getUserById('1')
      const updatedPet = getPetById('pet1')
      expect(updatedUser?.followingPets).not.toContain('pet1')
      expect(updatedPet?.followers).not.toContain('1')
    })
  })

  describe('Friend request operations', () => {
    const petA: Pet = {
      id: 'pet1',
      ownerId: 'user1',
      name: 'Rex',
      species: 'dog',
      followers: [],
      friends: [],
    }

    const petB: Pet = {
      id: 'pet2',
      ownerId: 'user2',
      name: 'Mittens',
      species: 'cat',
      followers: [],
      friends: [],
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_pets', JSON.stringify([petA, petB]))
      localStorage.setItem('pet_social_friend_requests', JSON.stringify([]))
    })

    it('should create a pending friend request', () => {
      const result = sendFriendRequest('pet1', 'pet2')
      expect(result.success).toBe(true)
      const requests = getFriendRequests()
      expect(requests).toHaveLength(1)
      expect(requests[0].status).toBe('pending')
      expect(requests[0].senderPetId).toBe('pet1')
      expect(requests[0].receiverPetId).toBe('pet2')
    })

    it('should accept a friend request and add friendship', () => {
      const { request } = sendFriendRequest('pet1', 'pet2')
      expect(request).toBeDefined()
      const acceptResult = acceptFriendRequest(request!.id, 'pet2')
      expect(acceptResult.success).toBe(true)

      const updatedPetA = getPetById('pet1')
      const updatedPetB = getPetById('pet2')

      expect(updatedPetA?.friends).toContain('pet2')
      expect(updatedPetB?.friends).toContain('pet1')
      const storedRequest = getFriendRequests().find((r) => r.id === request!.id)
      expect(storedRequest?.status).toBe('accepted')
    })

    it('should decline a friend request without adding friendship', () => {
      const { request } = sendFriendRequest('pet1', 'pet2')
      expect(request).toBeDefined()
      const declineResult = declineFriendRequest(request!.id, 'pet2')
      expect(declineResult.success).toBe(true)

      const updatedPetA = getPetById('pet1')
      const updatedPetB = getPetById('pet2')

      expect(updatedPetA?.friends).not.toContain('pet2')
      expect(updatedPetB?.friends).not.toContain('pet1')
      const storedRequest = getFriendRequests().find((r) => r.id === request!.id)
      expect(storedRequest?.status).toBe('declined')
    })

    it('should cancel a sent friend request', () => {
      const { request } = sendFriendRequest('pet1', 'pet2')
      expect(request).toBeDefined()
      const cancelResult = cancelFriendRequest(request!.id, 'pet1')
      expect(cancelResult.success).toBe(true)
      const storedRequest = getFriendRequests().find((r) => r.id === request!.id)
      expect(storedRequest?.status).toBe('cancelled')
    })

    it('should remove an existing friendship between pets', () => {
      const { request } = sendFriendRequest('pet1', 'pet2')
      expect(request).toBeDefined()
      expect(acceptFriendRequest(request!.id, 'pet2').success).toBe(true)

      const removalResult = removePetFriendship('pet1', 'pet2')
      expect(removalResult.success).toBe(true)

      const updatedPetA = getPetById('pet1')
      const updatedPetB = getPetById('pet2')

      expect(updatedPetA?.friends).not.toContain('pet2')
      expect(updatedPetB?.friends).not.toContain('pet1')
    })
  })

  describe('Blog post operations', () => {
    const mockPost: BlogPost = {
      id: '1',
      petId: 'pet1',
      authorId: 'user1',
      title: 'Test Post',
      content: 'Test content',
      tags: ['test'],
      categories: ['Testing'],
      likes: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_blog_posts', JSON.stringify([mockPost]))
    })

    it('should get all blog posts', () => {
      const posts = getBlogPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0].title).toBe('Test Post')
    })

    it('should get blog post by id', () => {
      const post = getBlogPostById('1')
      expect(post).toBeDefined()
      expect(post?.title).toBe('Test Post')
    })

    it('should return undefined for non-existent post id', () => {
      const post = getBlogPostById('999')
      expect(post).toBeUndefined()
    })

    it('should get blog posts by pet id', () => {
      const posts = getBlogPostsByPetId('pet1')
      expect(posts).toHaveLength(1)
      expect(posts[0].petId).toBe('pet1')
    })

    it('should add new blog post', () => {
      const newPost: BlogPost = {
        id: '2',
        petId: 'pet1',
        authorId: 'user1',
        title: 'New Post',
        content: 'New content',
        tags: ['new'],
        categories: ['General'],
        likes: [],
        createdAt: '2024-01-02',
        updatedAt: '2024-01-02',
      }
      addBlogPost(newPost)
      const posts = getBlogPosts()
      expect(posts).toHaveLength(2)
      expect(posts[0].id).toBe('2') // Should be unshifted
    })

    it('should update blog post', () => {
      updateBlogPost({ ...mockPost, title: 'Updated Title' })
      const post = getBlogPostById('1')
      expect(post?.title).toBe('Updated Title')
    })
  })

  describe('Comment operations', () => {
    const mockComment: Comment = {
      id: '1',
      postId: 'post1',
      userId: 'user1',
      content: 'Test comment',
      createdAt: '2024-01-01',
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_comments', JSON.stringify([mockComment]))
      const mockPost: BlogPost = {
        id: 'post1',
        petId: 'pet1',
        authorId: 'user1',
        title: 'Test Post',
        content: 'Post content',
        tags: [],
        categories: ['General'],
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      localStorage.setItem('pet_social_blog_posts', JSON.stringify([mockPost]))
    })

    it('should get all comments', () => {
      const comments = getComments()
      expect(comments).toHaveLength(1)
      expect(comments[0].content).toBe('Test comment')
      expect(comments[0].format).toBe('markdown')
      expect(comments[0].status).toBe('published')
      expect(comments[0].flags).toEqual([])
    })

    it('should get comments by post id', () => {
      const comments = getCommentsByPostId('post1')
      expect(comments).toHaveLength(1)
      expect(comments[0].postId).toBe('post1')
    })

    it('should return empty array for post with no comments', () => {
      const comments = getCommentsByPostId('nonexistent')
      expect(comments).toHaveLength(0)
    })

    it('should add new comment', () => {
      const newComment: Comment = {
        id: '2',
        postId: 'post1',
        userId: 'user1',
        content: 'New comment',
        createdAt: '2024-01-02',
      }
      addComment(newComment)
      const comments = getComments()
      expect(comments).toHaveLength(2)
      const added = comments.find((comment) => comment.id === '2')
      expect(added?.format).toBe('markdown')
      expect(added?.status).toBe('published')
    })

    it('should flag comment and auto-pend after reaching threshold', () => {
      flagComment('1', 'user2', 'spam')
      flagComment('1', 'user3', 'abuse')
      let comment = getComments().find((c) => c.id === '1')
      expect(comment?.flags).toHaveLength(2)
      expect(comment?.status).toBe('published')

      flagComment('1', 'user4', 'off-topic')
      comment = getComments().find((c) => c.id === '1')
      expect(comment?.flags).toHaveLength(3)
      expect(comment?.status).toBe('pending')
    })

    it('should clear individual comment flags', () => {
      flagComment('1', 'user2', 'spam')
      flagComment('1', 'user3', 'abuse')
      clearCommentFlag('1', 'user2')
      const comment = getComments().find((c) => c.id === '1')
      expect(comment?.flags?.some((flag) => flag.userId === 'user2')).toBe(false)
      expect(comment?.flags).toHaveLength(1)
    })

    it('should allow moderators to update comment status and notes', () => {
      flagComment('1', 'user2', 'spam')
      const hidden = moderateComment('1', 'hidden', 'moderator-1', 'Inappropriate language')
      expect(hidden?.status).toBe('hidden')
      expect(hidden?.moderation?.note).toBe('Inappropriate language')
      expect(hidden?.moderation?.updatedBy).toBe('moderator-1')
      expect(hidden?.flags).toHaveLength(1)

      const restored = moderateComment('1', 'published', 'moderator-1', undefined, { clearFlags: true })
      expect(restored?.status).toBe('published')
      expect(restored?.flags).toEqual([])
    })
  })

  describe('Wiki article operations', () => {
    const mockArticle: WikiArticle = {
      id: '1',
      title: 'Test Article',
      slug: 'test-article',
      category: 'care',
      content: 'Test content',
      authorId: 'user1',
      views: 0,
      likes: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_wiki_articles', JSON.stringify([mockArticle]))
    })

    it('should get all wiki articles', () => {
      const articles = getWikiArticles()
      expect(articles).toHaveLength(1)
      expect(articles[0].title).toBe('Test Article')
    })

    it('should get wiki article by slug', () => {
      const article = getWikiArticleBySlug('test-article')
      expect(article).toBeDefined()
      expect(article?.slug).toBe('test-article')
    })

    it('should return undefined for non-existent slug', () => {
      const article = getWikiArticleBySlug('nonexistent')
      expect(article).toBeUndefined()
    })

    it('should get wiki articles by category', () => {
      const articles = getWikiArticlesByCategory('care')
      expect(articles).toHaveLength(1)
      expect(articles[0].category).toBe('care')
    })

    it('should update wiki article', () => {
      updateWikiArticle({ ...mockArticle, title: 'Updated Title' })
      const article = getWikiArticleBySlug('test-article')
      expect(article?.title).toBe('Updated Title')
    })
  })

  describe('Group topic operations', () => {
    beforeEach(() => {
      initializeStorage()
    })

    it('should expose tags and status for default topics', () => {
      const topics = getGroupTopicsByGroupId('group-1')
      const topic = topics.find((item) => item.id === 'topic-1')
      expect(topic).toBeDefined()
      expect(topic?.status).toBe('active')
      expect(topic?.tags).toEqual(expect.arrayContaining(['outdoors', 'swimming']))
      expect(topic?.lastActivityAt).toBeDefined()
    })

    it('should normalize tags and default status when adding a topic', () => {
      const timestamp = new Date('2024-07-01T10:00:00.000Z').toISOString()
      const newTopic: GroupTopic = {
        id: 'topic-test',
        groupId: 'group-1',
        authorId: '1',
        title: 'Summer training plans',
        content: 'Share routines for hot weather.',
        tags: [' Training ', 'training', 'Heat Safety', ''],
        viewCount: 0,
        commentCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      addGroupTopic(newTopic)
      const saved = getGroupTopicById('topic-test')
      expect(saved).toBeDefined()
      expect(saved?.status).toBe('active')
      expect(saved?.tags).toEqual(['Training', 'Heat Safety'])
      expect(saved?.lastActivityAt).toBe(timestamp)
    })
  })

  describe('Activity operations', () => {
    const mockActivity: Activity = {
      id: '1',
      userId: 'user1',
      type: 'like',
      targetId: 'post1',
      targetType: 'post',
      createdAt: '2024-01-01',
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_activities', JSON.stringify([mockActivity]))
    })

    it('should get all activities', () => {
      const activities = getActivities()
      expect(activities).toHaveLength(1)
      expect(activities[0].type).toBe('like')
    })

    it('should add new activity', () => {
      const newActivity: Activity = {
        id: '2',
        userId: 'user1',
        type: 'follow',
        targetId: 'user2',
        targetType: 'user',
        createdAt: '2024-01-02',
      }
      addActivity(newActivity)
    const activities = getActivities()
    expect(activities).toHaveLength(2)
    expect(activities[0].id).toBe('2') // Should be unshifted
  })
  })

  describe('Blocking interactions', () => {
    it('removes likes, reactions, and comments when a user is blocked', () => {
      const userA: User = {
        id: 'a',
        email: 'a@example.com',
        username: 'userA',
        fullName: 'User A',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }
      const userB: User = {
        id: 'b',
        email: 'b@example.com',
        username: 'userB',
        fullName: 'User B',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }

      localStorage.setItem('pet_social_users', JSON.stringify([userA, userB]))
      localStorage.setItem('pet_social_pets', JSON.stringify([]))
      localStorage.setItem('pet_social_wiki_articles', JSON.stringify([]))

      const post = {
        id: 'post-1',
        petId: 'pet-1',
        authorId: 'b',
        title: 'Post Title',
        content: 'Content',
        tags: [],
        likes: ['a'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: {
          like: ['a'],
          love: [],
          laugh: [],
          wow: [],
          sad: [],
          angry: [],
        },
      }
      localStorage.setItem('pet_social_blog_posts', JSON.stringify([post]))

      const comment = {
        id: 'comment-1',
        postId: 'post-1',
        userId: 'a',
        content: 'Nice pet!',
        createdAt: new Date().toISOString(),
        reactions: {
          like: ['b'],
          love: [],
          laugh: [],
          wow: [],
          sad: [],
          angry: [],
        },
      }
      localStorage.setItem('pet_social_comments', JSON.stringify([comment]))

      blockUser('b', 'a')

      const postsAfter = getBlogPosts()
      expect(postsAfter[0].likes).not.toContain('a')
      expect(postsAfter[0].reactions?.like).not.toContain('a')

      const commentsAfter = getComments()
      expect(commentsAfter).toHaveLength(0)
    })

    it('prevents blocked users from adding comments to a post', () => {
      const userA: User = {
        id: 'a',
        email: 'a@example.com',
        username: 'userA',
        fullName: 'User A',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }
      const userB: User = {
        id: 'b',
        email: 'b@example.com',
        username: 'userB',
        fullName: 'User B',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }

      localStorage.setItem('pet_social_users', JSON.stringify([userA, userB]))
      localStorage.setItem(
        'pet_social_blog_posts',
        JSON.stringify([
          {
            id: 'post-1',
            petId: 'pet-1',
            authorId: 'b',
            title: 'Post Title',
            content: 'Content',
            tags: [],
            likes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reactions: {
              like: [],
              love: [],
              laugh: [],
              wow: [],
              sad: [],
              angry: [],
            },
          },
        ]),
      )
      localStorage.setItem('pet_social_comments', JSON.stringify([]))
      localStorage.setItem('pet_social_pets', JSON.stringify([]))
      localStorage.setItem('pet_social_wiki_articles', JSON.stringify([]))

      blockUser('b', 'a')

      addComment({
        id: 'comment-1',
        postId: 'post-1',
        userId: 'a',
        content: 'Blocked comment',
        createdAt: new Date().toISOString(),
        reactions: {
          like: [],
          love: [],
          laugh: [],
          wow: [],
          sad: [],
          angry: [],
        },
      })

      expect(getCommentsByPostId('post-1')).toHaveLength(0)
    })
  })

  describe('Server-side rendering', () => {
    it('should return empty arrays when window is undefined', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      expect(getUsers()).toHaveLength(0)
      expect(getPets()).toHaveLength(0)
      expect(getBlogPosts()).toHaveLength(0)
      expect(getComments()).toHaveLength(0)
      expect(getWikiArticles()).toHaveLength(0)
      expect(getActivities()).toHaveLength(0)
      expect(getCurrentUser()).toBeNull()

      global.window = originalWindow
    })
  })
})
