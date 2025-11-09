import {
  getRollbackHistory,
  getRollbackHistoryByContentId,
  getRollbackHistoryByContentType,
  addRollbackHistoryEntry,
  reportArticle,
  getArticleReports,
  getPendingArticleReports,
  updateArticleReport,
  addCOIFlag,
  getCOIFlags,
  getActiveCOIFlags,
  getCOIFlagsBySeverity,
  updateCOIFlag,
  getBlogPostById,
  getWikiArticleBySlug,
  addBlogPost,
  updateBlogPost,
  addWikiArticle,
  updateWikiArticle,
  rollbackToStableRevision,
} from '../storage'
import type {
  RollbackHistoryEntry,
  ArticleReport,
  COIFlag,
  BlogPost,
  WikiArticle,
  User,
} from '../types'

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

describe('Moderation Dashboard Features', () => {
  beforeEach(() => {
    localStorage.clear()
    
    // Initialize with mock data
    const mockUser: User = {
      id: 'moderator-1',
      email: 'mod@example.com',
      username: 'moderator',
      fullName: 'Moderator User',
      role: 'moderator',
      joinedAt: '2024-01-01',
      followers: [],
      following: [],
    }
    
    localStorage.setItem('pet_social_users', JSON.stringify([mockUser]))
    localStorage.setItem('pet_social_rollback_history', JSON.stringify([]))
    localStorage.setItem('pet_social_article_reports', JSON.stringify([]))
    localStorage.setItem('pet_social_coi_flags', JSON.stringify([]))
  })

  describe('Rollback History Operations', () => {
    const mockRollbackEntry: RollbackHistoryEntry = {
      id: 'rollback-1',
      contentId: 'article-1',
      contentType: 'wiki',
      rolledBackFrom: 'revision-2',
      rolledBackTo: 'revision-1',
      performedBy: 'moderator-1',
      performedAt: '2024-01-15T10:00:00Z',
      reason: 'Incorrect information',
      metadata: {
        articleTitle: 'Test Article',
      },
    }

    it('should add rollback history entry', () => {
      addRollbackHistoryEntry(mockRollbackEntry)
      
      const history = getRollbackHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(mockRollbackEntry)
    })

    it('should get rollback history by content ID', () => {
      addRollbackHistoryEntry(mockRollbackEntry)
      
      const anotherEntry: RollbackHistoryEntry = {
        ...mockRollbackEntry,
        id: 'rollback-2',
        contentId: 'article-2',
      }
      addRollbackHistoryEntry(anotherEntry)
      
      const history = getRollbackHistoryByContentId('article-1')
      expect(history).toHaveLength(1)
      expect(history[0].contentId).toBe('article-1')
    })

    it('should get rollback history by content type', () => {
      addRollbackHistoryEntry(mockRollbackEntry)
      
      const blogEntry: RollbackHistoryEntry = {
        ...mockRollbackEntry,
        id: 'rollback-2',
        contentType: 'blog',
        contentId: 'blog-1',
      }
      addRollbackHistoryEntry(blogEntry)
      
      const wikiHistory = getRollbackHistoryByContentType('wiki')
      expect(wikiHistory).toHaveLength(1)
      expect(wikiHistory[0].contentType).toBe('wiki')
      
      const blogHistory = getRollbackHistoryByContentType('blog')
      expect(blogHistory).toHaveLength(1)
      expect(blogHistory[0].contentType).toBe('blog')
    })

    it('should sort rollback history by date descending', () => {
      const entry1: RollbackHistoryEntry = {
        ...mockRollbackEntry,
        id: 'rollback-1',
        performedAt: '2024-01-15T10:00:00Z',
      }
      const entry2: RollbackHistoryEntry = {
        ...mockRollbackEntry,
        id: 'rollback-2',
        performedAt: '2024-01-16T10:00:00Z',
      }
      
      addRollbackHistoryEntry(entry1)
      addRollbackHistoryEntry(entry2)
      
      const history = getRollbackHistory()
      expect(history[0].performedAt).toBe('2024-01-16T10:00:00Z')
      expect(history[1].performedAt).toBe('2024-01-15T10:00:00Z')
    })
  })

  describe('Article Reporting Operations', () => {
    beforeEach(() => {
      const mockBlogPost: BlogPost = {
        id: 'blog-1',
        petId: 'pet-1',
        authorId: 'user-1',
        title: 'Test Blog Post',
        content: 'Test content',
        tags: [],
        categories: [],
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      
      const mockWikiArticle: WikiArticle = {
        id: 'wiki-1',
        title: 'Test Wiki Article',
        slug: 'test-wiki-article',
        category: 'care',
        content: 'Test content',
        authorId: 'user-1',
        views: 0,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      
      localStorage.setItem('pet_social_blog_posts', JSON.stringify([mockBlogPost]))
      localStorage.setItem('pet_social_wiki_articles', JSON.stringify([mockWikiArticle]))
    })

    it('should report a blog post', () => {
      const result = reportArticle({
        articleId: 'blog-1',
        contentType: 'blog',
        reporterId: 'user-2',
        reason: 'spam',
        message: 'This is spam content',
      })
      
      expect(result.success).toBe(true)
      expect(result.reportId).toBeTruthy()
      
      const post = getBlogPostById('blog-1')
      expect(post?.reports).toHaveLength(1)
      expect(post?.reports?.[0].reason).toBe('spam')
      expect(post?.reports?.[0].status).toBe('pending')
    })

    it('should report a wiki article', () => {
      const result = reportArticle({
        articleId: 'wiki-1',
        contentType: 'wiki',
        reporterId: 'user-2',
        reason: 'misinformation',
        message: 'Incorrect information',
      })
      
      expect(result.success).toBe(true)
      expect(result.reportId).toBeTruthy()
      
      const article = getWikiArticleBySlug('wiki-1')
      expect(article?.reports).toHaveLength(1)
      expect(article?.reports?.[0].reason).toBe('misinformation')
    })

    it('should get all article reports', () => {
      reportArticle({
        articleId: 'blog-1',
        contentType: 'blog',
        reporterId: 'user-2',
        reason: 'spam',
      })
      
      reportArticle({
        articleId: 'wiki-1',
        contentType: 'wiki',
        reporterId: 'user-3',
        reason: 'inappropriate',
      })
      
      const reports = getArticleReports()
      expect(reports.length).toBeGreaterThanOrEqual(2)
    })

    it('should get pending article reports', () => {
      reportArticle({
        articleId: 'blog-1',
        contentType: 'blog',
        reporterId: 'user-2',
        reason: 'spam',
      })
      
      const pendingReports = getPendingArticleReports()
      expect(pendingReports.length).toBeGreaterThanOrEqual(1)
      expect(pendingReports.every((r) => r.status === 'pending')).toBe(true)
    })

    it('should update article report status', () => {
      const reportResult = reportArticle({
        articleId: 'blog-1',
        contentType: 'blog',
        reporterId: 'user-2',
        reason: 'spam',
      })
      
      expect(reportResult.reportId).toBeTruthy()
      
      const updateResult = updateArticleReport(reportResult.reportId!, {
        status: 'resolved',
        reviewedBy: 'moderator-1',
        reviewedAt: '2024-01-15T10:00:00Z',
        resolution: 'Content removed',
      })
      
      expect(updateResult.success).toBe(true)
      
      const reports = getArticleReports()
      const updatedReport = reports.find((r) => r.id === reportResult.reportId)
      expect(updatedReport?.status).toBe('resolved')
      expect(updatedReport?.reviewedBy).toBe('moderator-1')
    })

    it('should return error when reporting non-existent article', () => {
      const result = reportArticle({
        articleId: 'non-existent',
        contentType: 'blog',
        reporterId: 'user-2',
        reason: 'spam',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('COI Flag Operations', () => {
    beforeEach(() => {
      const mockBlogPost: BlogPost = {
        id: 'blog-1',
        petId: 'pet-1',
        authorId: 'user-1',
        title: 'Test Blog Post',
        content: 'Test content',
        tags: [],
        categories: [],
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      
      const mockWikiArticle: WikiArticle = {
        id: 'wiki-1',
        title: 'Test Wiki Article',
        slug: 'test-wiki-article',
        category: 'care',
        content: 'Test content',
        authorId: 'user-1',
        views: 0,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      
      localStorage.setItem('pet_social_blog_posts', JSON.stringify([mockBlogPost]))
      localStorage.setItem('pet_social_wiki_articles', JSON.stringify([mockWikiArticle]))
    })

    it('should add COI flag to blog post', () => {
      const result = addCOIFlag({
        contentId: 'blog-1',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'Author has financial interest in mentioned brand',
        details: 'Author is employed by Brand X',
        severity: 'high',
        relatedEntities: ['brand-x'],
      })
      
      expect(result.success).toBe(true)
      expect(result.flagId).toBeTruthy()
      
      const post = getBlogPostById('blog-1')
      expect(post?.coiFlags).toHaveLength(1)
      expect(post?.coiFlags?.[0].severity).toBe('high')
      expect(post?.coiFlags?.[0].status).toBe('active')
    })

    it('should add COI flag to wiki article', () => {
      const result = addCOIFlag({
        contentId: 'wiki-1',
        contentType: 'wiki',
        flaggedBy: 'moderator-1',
        reason: 'Potential conflict of interest',
        severity: 'medium',
      })
      
      expect(result.success).toBe(true)
      
      const article = getWikiArticleBySlug('wiki-1')
      expect(article?.coiFlags).toHaveLength(1)
      expect(article?.coiFlags?.[0].severity).toBe('medium')
    })

    it('should get all COI flags', () => {
      addCOIFlag({
        contentId: 'blog-1',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'Test flag 1',
        severity: 'high',
      })
      
      addCOIFlag({
        contentId: 'wiki-1',
        contentType: 'wiki',
        flaggedBy: 'moderator-1',
        reason: 'Test flag 2',
        severity: 'medium',
      })
      
      const flags = getCOIFlags()
      expect(flags.length).toBeGreaterThanOrEqual(2)
    })

    it('should get only active COI flags', () => {
      const flag1 = addCOIFlag({
        contentId: 'blog-1',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'Active flag',
        severity: 'high',
      })
      
      if (flag1.flagId) {
        updateCOIFlag(flag1.flagId, {
          status: 'resolved',
          resolvedBy: 'moderator-1',
          resolvedAt: '2024-01-15T10:00:00Z',
        })
      }
      
      addCOIFlag({
        contentId: 'wiki-1',
        contentType: 'wiki',
        flaggedBy: 'moderator-1',
        reason: 'Still active',
        severity: 'medium',
      })
      
      const activeFlags = getActiveCOIFlags()
      expect(activeFlags.every((f) => f.status === 'active')).toBe(true)
    })

    it('should get COI flags by severity', () => {
      addCOIFlag({
        contentId: 'blog-1',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'High severity',
        severity: 'high',
      })
      
      addCOIFlag({
        contentId: 'wiki-1',
        contentType: 'wiki',
        flaggedBy: 'moderator-1',
        reason: 'Medium severity',
        severity: 'medium',
      })
      
      const highFlags = getCOIFlagsBySeverity('high')
      expect(highFlags.every((f) => f.severity === 'high')).toBe(true)
      
      const mediumFlags = getCOIFlagsBySeverity('medium')
      expect(mediumFlags.every((f) => f.severity === 'medium')).toBe(true)
    })

    it('should update COI flag', () => {
      const flagResult = addCOIFlag({
        contentId: 'blog-1',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'Test flag',
        severity: 'medium',
      })
      
      expect(flagResult.flagId).toBeTruthy()
      
      const updateResult = updateCOIFlag(flagResult.flagId!, {
        status: 'resolved',
        resolvedBy: 'moderator-1',
        resolvedAt: '2024-01-15T10:00:00Z',
        resolution: 'Conflict resolved',
      })
      
      expect(updateResult.success).toBe(true)
      
      const flags = getCOIFlags()
      const updatedFlag = flags.find((f) => f.id === flagResult.flagId)
      expect(updatedFlag?.status).toBe('resolved')
      expect(updatedFlag?.resolvedBy).toBe('moderator-1')
      
      // Verify it's also updated in the blog post
      const post = getBlogPostById('blog-1')
      const postFlag = post?.coiFlags?.find((f) => f.id === flagResult.flagId)
      expect(postFlag?.status).toBe('resolved')
    })

    it('should return error when flagging non-existent content', () => {
      const result = addCOIFlag({
        contentId: 'non-existent',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'Test',
        severity: 'low',
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should update COI flag in both global list and content', () => {
      const flagResult = addCOIFlag({
        contentId: 'blog-1',
        contentType: 'blog',
        flaggedBy: 'moderator-1',
        reason: 'Test flag',
        severity: 'high',
        relatedEntities: ['entity-1'],
      })
      
      updateCOIFlag(flagResult.flagId!, {
        severity: 'critical',
        details: 'Updated details',
      })
      
      // Check global list
      const flags = getCOIFlags()
      const globalFlag = flags.find((f) => f.id === flagResult.flagId)
      expect(globalFlag?.severity).toBe('critical')
      expect(globalFlag?.details).toBe('Updated details')
      
      // Check blog post
      const post = getBlogPostById('blog-1')
      const postFlag = post?.coiFlags?.find((f) => f.id === flagResult.flagId)
      expect(postFlag?.severity).toBe('critical')
      expect(postFlag?.details).toBe('Updated details')
    })
  })

  describe('Integration: Rollback creates history entry', () => {
    beforeEach(() => {
      const mockWikiArticle: WikiArticle = {
        id: 'wiki-1',
        title: 'Test Article',
        slug: 'test-article',
        category: 'care',
        content: 'Current content',
        authorId: 'user-1',
        views: 0,
        likes: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        currentRevisionId: 'revision-2',
        stableRevisionId: 'revision-1',
      }
      
      localStorage.setItem('pet_social_wiki_articles', JSON.stringify([mockWikiArticle]))
      localStorage.setItem('pet_social_wiki_revisions', JSON.stringify([
        {
          id: 'revision-1',
          articleId: 'wiki-1',
          content: 'Stable content',
          status: 'stable',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          id: 'revision-2',
          articleId: 'wiki-1',
          content: 'Current content',
          status: 'draft',
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ]))
    })

    it('should create rollback history entry when rolling back', () => {
      const initialHistoryCount = getRollbackHistory().length
      
      rollbackToStableRevision('wiki-1', 'moderator-1')
      
      const history = getRollbackHistory()
      expect(history.length).toBeGreaterThan(initialHistoryCount)
      
      const rollbackEntry = history.find((h) => h.contentId === 'wiki-1')
      expect(rollbackEntry).toBeTruthy()
      expect(rollbackEntry?.performedBy).toBe('moderator-1')
      expect(rollbackEntry?.rolledBackTo).toBe('revision-1')
    })
  })
})

