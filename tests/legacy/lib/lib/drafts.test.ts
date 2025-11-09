import {
  getDrafts,
  getDraftById,
  getDraftsByUserId,
  saveDraft,
  deleteDraft,
  autoSaveDraft,
} from '../drafts'
import type { Draft } from '../types'

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

describe('drafts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mockDraft: Draft = {
    id: '1',
    userId: 'user1',
    type: 'blog',
    title: 'My Draft',
    content: 'Draft content',
    lastSaved: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  }

  describe('getDrafts', () => {
    it('should return empty array when no drafts', () => {
      expect(getDrafts()).toHaveLength(0)
    })

    it('should return drafts from localStorage', () => {
      localStorage.setItem('pet_social_drafts', JSON.stringify([mockDraft]))
      const drafts = getDrafts()
      expect(drafts).toHaveLength(1)
      expect(drafts[0].id).toBe('1')
    })

    it('should return empty array on server-side', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      expect(getDrafts()).toHaveLength(0)
      global.window = originalWindow
    })
  })

  describe('getDraftById', () => {
    it('should return draft by id', () => {
      localStorage.setItem('pet_social_drafts', JSON.stringify([mockDraft]))
      const draft = getDraftById('1')
      expect(draft).toBeDefined()
      expect(draft?.id).toBe('1')
    })

    it('should return undefined for non-existent draft', () => {
      expect(getDraftById('nonexistent')).toBeUndefined()
    })
  })

  describe('getDraftsByUserId', () => {
    it('should return drafts for specific user', () => {
      const draft2: Draft = {
        ...mockDraft,
        id: '2',
        userId: 'user2',
      }
      localStorage.setItem('pet_social_drafts', JSON.stringify([mockDraft, draft2]))
      
      const userDrafts = getDraftsByUserId('user1')
      expect(userDrafts).toHaveLength(1)
      expect(userDrafts[0].userId).toBe('user1')
    })

    it('should filter by type when provided', () => {
      const wikiDraft: Draft = {
        ...mockDraft,
        id: '2',
        type: 'wiki',
      }
      localStorage.setItem('pet_social_drafts', JSON.stringify([mockDraft, wikiDraft]))
      
      const blogDrafts = getDraftsByUserId('user1', 'blog')
      expect(blogDrafts).toHaveLength(1)
      expect(blogDrafts[0].type).toBe('blog')
      
      const wikiDrafts = getDraftsByUserId('user1', 'wiki')
      expect(wikiDrafts).toHaveLength(1)
      expect(wikiDrafts[0].type).toBe('wiki')
    })
  })

  describe('saveDraft', () => {
    it('should save new draft', () => {
      saveDraft(mockDraft)
      const drafts = getDrafts()
      expect(drafts).toHaveLength(1)
      expect(drafts[0].id).toBe('1')
    })

    it('should update existing draft', () => {
      localStorage.setItem('pet_social_drafts', JSON.stringify([mockDraft]))
      
      const updatedDraft = { ...mockDraft, title: 'Updated Title' }
      saveDraft(updatedDraft)
      
      const drafts = getDrafts()
      expect(drafts).toHaveLength(1)
      expect(drafts[0].title).toBe('Updated Title')
    })
  })

  describe('deleteDraft', () => {
    it('should delete draft', () => {
      localStorage.setItem('pet_social_drafts', JSON.stringify([mockDraft]))
      deleteDraft('1')
      
      const drafts = getDrafts()
      expect(drafts).toHaveLength(0)
    })

    it('should not throw when draft not found', () => {
      expect(() => deleteDraft('nonexistent')).not.toThrow()
    })
  })

  describe('autoSaveDraft', () => {
    it('should update lastSaved timestamp', () => {
      const originalLastSaved = mockDraft.lastSaved
      const savedDraft = autoSaveDraft(mockDraft)
      
      expect(savedDraft.lastSaved).not.toBe(originalLastSaved)
      expect(new Date(savedDraft.lastSaved).getTime()).toBeGreaterThan(new Date(originalLastSaved).getTime())
    })

    it('should save draft to localStorage', () => {
      autoSaveDraft(mockDraft)
      const drafts = getDrafts()
      expect(drafts).toHaveLength(1)
    })
  })
})

