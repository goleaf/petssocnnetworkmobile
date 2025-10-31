import {
  initializeStorage,
  getCurrentUser,
  setCurrentUser,
  getUsers,
  getUserByUsername,
  getUserById,
  updateUser,
  toggleFollow,
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
  getWikiArticles,
  getWikiArticleBySlug,
  getWikiArticlesByCategory,
  updateWikiArticle,
  getActivities,
  addActivity,
} from '../storage'
import type { User, Pet, BlogPost, Comment, WikiArticle, Activity } from '../types'

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

  describe('Blog post operations', () => {
    const mockPost: BlogPost = {
      id: '1',
      petId: 'pet1',
      authorId: 'user1',
      title: 'Test Post',
      content: 'Test content',
      tags: ['test'],
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
    })

    it('should get all comments', () => {
      const comments = getComments()
      expect(comments).toHaveLength(1)
      expect(comments[0].content).toBe('Test comment')
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

