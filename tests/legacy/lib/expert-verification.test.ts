import {
  addExpertProfile,
  updateExpertProfile,
  getExpertProfileByUserId,
  getVerifiedExpertProfiles,
  isExpertVerified,
  canPublishStableHealthRevision,
  markRevisionAsStable,
  addWikiRevision,
  getWikiArticleById,
  addWikiArticle,
  getWikiRevisionsByArticleId,
  updateUser,
  getUsers,
} from '../storage'
import type { ExpertProfile, WikiRevision, WikiArticle } from '../types'

describe('Expert Verification', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('ExpertProfile operations', () => {
    const mockVerifiedExpert: ExpertProfile = {
      id: 'profile1',
      userId: 'expert1',
      credential: 'DVM',
      licenseNo: 'VET-12345',
      region: 'California',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockPendingExpert: ExpertProfile = {
      id: 'profile2',
      userId: 'expert2',
      credential: 'Veterinary Technician',
      region: 'New York',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockExpiredExpert: ExpertProfile = {
      id: 'profile3',
      userId: 'expert3',
      credential: 'DVM',
      status: 'expired',
      verifiedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockRevokedExpert: ExpertProfile = {
      id: 'profile4',
      userId: 'expert4',
      credential: 'DVM',
      status: 'revoked',
      verifiedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    it('should add expert profile', () => {
      addExpertProfile(mockVerifiedExpert)
      const profiles = localStorage.getItem('pet_social_expert_profiles')
      expect(profiles).toBeTruthy()
      
      const parsed = JSON.parse(profiles!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].userId).toBe('expert1')
      expect(parsed[0].status).toBe('verified')
    })

    it('should get expert profile by user ID', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockVerifiedExpert]))
      
      const profile = getExpertProfileByUserId('expert1')
      expect(profile).toBeTruthy()
      expect(profile?.userId).toBe('expert1')
    })

    it('should return undefined for non-existent expert', () => {
      const profile = getExpertProfileByUserId('nonexistent')
      expect(profile).toBeUndefined()
    })

    it('should get verified expert profiles', () => {
      localStorage.setItem(
        'pet_social_expert_profiles',
        JSON.stringify([mockVerifiedExpert, mockPendingExpert])
      )
      
      const verified = getVerifiedExpertProfiles()
      expect(verified.length).toBeGreaterThan(0)
      expect(verified.some(p => p.userId === 'expert1')).toBe(true)
    })

    it('should check if expert is verified - valid verified expert', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockVerifiedExpert]))
      
      expect(isExpertVerified('expert1')).toBe(true)
    })

    it('should check if expert is verified - pending expert returns false', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockPendingExpert]))
      
      expect(isExpertVerified('expert2')).toBe(false)
    })

    it('should check if expert is verified - expired expert returns false', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockExpiredExpert]))
      
      expect(isExpertVerified('expert3')).toBe(false)
    })

    it('should check if expert is verified - revoked expert returns false', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockRevokedExpert]))
      
      expect(isExpertVerified('expert4')).toBe(false)
    })

    it('should check if expert is verified - expert with future expiry date returns true', () => {
      const futureExpiryExpert: ExpertProfile = {
        id: 'profile5',
        userId: 'expert5',
        credential: 'DVM',
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([futureExpiryExpert]))
      
      expect(isExpertVerified('expert5')).toBe(true)
    })

    it('should check if expert is verified - expert with past expiry date returns false', () => {
      const pastExpiryExpert: ExpertProfile = {
        id: 'profile6',
        userId: 'expert6',
        credential: 'DVM',
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([pastExpiryExpert]))
      
      expect(isExpertVerified('expert6')).toBe(false)
    })

    it('should update expert profile', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockVerifiedExpert]))
      
      updateExpertProfile('expert1', { region: 'Texas' })
      
      const profile = getExpertProfileByUserId('expert1')
      expect(profile?.region).toBe('Texas')
      expect(profile?.credential).toBe('DVM') // Should preserve other fields
    })
  })

  describe('Wiki revision verification', () => {
    const mockVerifiedExpert: ExpertProfile = {
      id: 'profile1',
      userId: 'verified-expert',
      credential: 'DVM',
      status: 'verified',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockExpiredExpert: ExpertProfile = {
      id: 'profile2',
      userId: 'expired-expert',
      credential: 'DVM',
      status: 'expired',
      verifiedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    beforeEach(() => {
      localStorage.setItem(
        'pet_social_expert_profiles',
        JSON.stringify([mockVerifiedExpert, mockExpiredExpert])
      )
      // Add users for canPublishStableHealthRevision check
      const users = getUsers()
      if (!users.find(u => u.id === 'verified-expert')) {
        users.push({
          id: 'verified-expert',
          email: 'verified@test.com',
          username: 'verified-expert',
          fullName: 'Verified Expert',
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
        })
        localStorage.setItem('pet_social_users', JSON.stringify(users))
      }
      if (!users.find(u => u.id === 'expired-expert')) {
        users.push({
          id: 'expired-expert',
          email: 'expired@test.com',
          username: 'expired-expert',
          fullName: 'Expired Expert',
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
        })
        localStorage.setItem('pet_social_users', JSON.stringify(users))
      }
    })

    it('should allow verified expert to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('verified-expert')).toBe(true)
    })

    it('should NOT allow expired expert to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('expired-expert')).toBe(false)
    })

    it('should not allow unverified user to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('regular-user')).toBe(false)
    })

    it('should not allow non-existent user to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('nonexistent')).toBe(false)
    })

    it('should successfully mark revision as stable for verified expert', () => {
      // Create a health article
      const article: WikiArticle = {
        id: 'health-article-1',
        title: 'Test Health Article',
        slug: 'test-health-article',
        category: 'health',
        content: '# Health Content',
        authorId: 'author1',
        views: 0,
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiArticle(article)

      // Create a draft revision
      const revision: WikiRevision = {
        id: 'rev1',
        articleId: 'health-article-1',
        content: '# Health Article\nContent here',
        status: 'draft',
        authorId: 'verified-expert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiRevision(revision)

      // Mark as stable
      const result = markRevisionAsStable('health-article-1', 'rev1', 'verified-expert')
      
      expect(result.success).toBe(true)
      
      const updatedArticle = getWikiArticleById('health-article-1')
      expect(updatedArticle?.stableRevisionId).toBe('rev1')
    })

    it('should NOT allow expired expert to mark revision as stable', () => {
      // Create a health article
      const article: WikiArticle = {
        id: 'health-article-2',
        title: 'Test Health Article 2',
        slug: 'test-health-article-2',
        category: 'health',
        content: '# Health Content',
        authorId: 'author1',
        views: 0,
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiArticle(article)

      // Create a draft revision
      const revision: WikiRevision = {
        id: 'rev2',
        articleId: 'health-article-2',
        content: '# Health Article\nContent here',
        status: 'draft',
        authorId: 'expired-expert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiRevision(revision)

      // Try to mark as stable - should fail
      const result = markRevisionAsStable('health-article-2', 'rev2', 'expired-expert')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('verified experts')
    })

    it('should allow draft revisions without verification', () => {
      const draftRevision: WikiRevision = {
        id: 'rev3',
        articleId: 'article2',
        content: '# Draft Article\nContent here',
        status: 'draft',
        authorId: 'regular-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addWikiRevision(draftRevision)
      
      const revisions = getWikiRevisionsByArticleId('article2')
      expect(revisions).toHaveLength(1)
      expect(revisions[0].status).toBe('draft')
    })
  })

  describe('Integration: Health content verification flow', () => {
    it('should enforce verification for stable health revisions only', () => {
      // Setup: Create verified expert
      const expert: ExpertProfile = {
        id: 'profile1',
        userId: 'vet-expert',
        credential: 'Veterinary Surgeon',
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addExpertProfile(expert)
      
      // Add user for canPublishStableHealthRevision check
      const users = getUsers()
      if (!users.find(u => u.id === 'vet-expert')) {
        users.push({
          id: 'vet-expert',
          email: 'vet@test.com',
          username: 'vet-expert',
          fullName: 'Vet Expert',
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
        })
        localStorage.setItem('pet_social_users', JSON.stringify(users))
      }

      // Verify expert can publish stable content
      expect(canPublishStableHealthRevision('vet-expert')).toBe(true)

      // Verify regular user cannot
      expect(canPublishStableHealthRevision('regular-user')).toBe(false)

      // Create health article
      const article: WikiArticle = {
        id: 'health-article-1',
        title: 'Test Health Article',
        slug: 'test-health-article',
        category: 'health',
        content: '# Health Content',
        authorId: 'author1',
        views: 0,
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiArticle(article)

      // Expert publishes stable revision
      const stableRevision: WikiRevision = {
        id: 'stable-rev1',
        articleId: 'health-article-1',
        content: 'Professional health advice',
        status: 'draft',
        authorId: 'vet-expert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiRevision(stableRevision)

      const result = markRevisionAsStable('health-article-1', 'stable-rev1', 'vet-expert')
      expect(result.success).toBe(true)

      const revisions = getWikiRevisionsByArticleId('health-article-1')
      expect(revisions).toHaveLength(1)
      expect(revisions[0].status).toBe('stable')
    })

    it('should prevent expired expert from approving stable revisions', () => {
      // Setup: Create expired expert
      const expiredExpert: ExpertProfile = {
        id: 'profile2',
        userId: 'expired-vet',
        credential: 'DVM',
        status: 'expired',
        verifiedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addExpertProfile(expiredExpert)
      
      // Add user for canPublishStableHealthRevision check
      const users = getUsers()
      if (!users.find(u => u.id === 'expired-vet')) {
        users.push({
          id: 'expired-vet',
          email: 'expired-vet@test.com',
          username: 'expired-vet',
          fullName: 'Expired Vet',
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
        })
        localStorage.setItem('pet_social_users', JSON.stringify(users))
      }

      // Create health article
      const article: WikiArticle = {
        id: 'health-article-3',
        title: 'Test Health Article 3',
        slug: 'test-health-article-3',
        category: 'health',
        content: '# Health Content',
        authorId: 'author1',
        views: 0,
        likes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiArticle(article)

      // Create draft revision
      const revision: WikiRevision = {
        id: 'rev-expired',
        articleId: 'health-article-3',
        content: 'Health content',
        status: 'draft',
        authorId: 'expired-vet',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiRevision(revision)

      // Try to mark as stable - should fail
      const result = markRevisionAsStable('health-article-3', 'rev-expired', 'expired-vet')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('verified experts')
      
      // Verify revision is still draft
      const revisions = getWikiRevisionsByArticleId('health-article-3')
      expect(revisions[0].status).toBe('draft')
    })
  })
})
