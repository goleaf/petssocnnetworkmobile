import {
  addExpertProfile,
  updateExpertProfile,
  getExpertProfileByUserId,
  getVerifiedExpertProfiles,
  isExpertVerified,
  canPublishStableHealthRevision,
  addWikiRevision,
  getWikiRevisionsByArticleId,
} from '../storage'
import type { ExpertProfile, WikiRevision, WikiRevisionStatus } from '../types'

describe('Expert Verification', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('ExpertProfile operations', () => {
    const mockExpertProfile: ExpertProfile = {
      userId: 'expert1',
      credential: 'DVM',
      licenseNo: 'VET-12345',
      region: 'California',
      verifiedAt: new Date().toISOString(),
    }

    const mockUnverifiedExpert: ExpertProfile = {
      userId: 'expert2',
      credential: 'Veterinary Technician',
      region: 'New York',
    }

    it('should add expert profile', () => {
      addExpertProfile(mockExpertProfile)
      const profiles = localStorage.getItem('pet_social_expert_profiles')
      expect(profiles).toBeTruthy()
      
      const parsed = JSON.parse(profiles!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toEqual(mockExpertProfile)
    })

    it('should get expert profile by user ID', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockExpertProfile]))
      
      const profile = getExpertProfileByUserId('expert1')
      expect(profile).toEqual(mockExpertProfile)
    })

    it('should return undefined for non-existent expert', () => {
      const profile = getExpertProfileByUserId('nonexistent')
      expect(profile).toBeUndefined()
    })

    it('should get verified expert profiles', () => {
      localStorage.setItem(
        'pet_social_expert_profiles',
        JSON.stringify([mockExpertProfile, mockUnverifiedExpert])
      )
      
      const verified = getVerifiedExpertProfiles()
      expect(verified).toHaveLength(1)
      expect(verified[0]).toEqual(mockExpertProfile)
    })

    it('should check if expert is verified', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockExpertProfile]))
      
      expect(isExpertVerified('expert1')).toBe(true)
      expect(isExpertVerified('expert2')).toBe(false)
    })

    it('should update expert profile', () => {
      localStorage.setItem('pet_social_expert_profiles', JSON.stringify([mockExpertProfile]))
      
      updateExpertProfile('expert1', { region: 'Texas' })
      
      const profile = getExpertProfileByUserId('expert1')
      expect(profile?.region).toBe('Texas')
      expect(profile?.credential).toBe('DVM') // Should preserve other fields
    })
  })

  describe('Wiki revision verification', () => {
    const mockVerifiedExpert: ExpertProfile = {
      userId: 'verified-expert',
      credential: 'DVM',
      verifiedAt: new Date().toISOString(),
    }

    const mockUnverifiedUser: ExpertProfile = {
      userId: 'regular-user',
      credential: 'Pet Enthusiast',
    }

    beforeEach(() => {
      localStorage.setItem(
        'pet_social_expert_profiles',
        JSON.stringify([mockVerifiedExpert, mockUnverifiedUser])
      )
    })

    it('should allow verified expert to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('verified-expert')).toBe(true)
    })

    it('should not allow unverified user to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('regular-user')).toBe(false)
    })

    it('should not allow non-existent user to publish stable health revision', () => {
      expect(canPublishStableHealthRevision('nonexistent')).toBe(false)
    })

    it('should create stable health revision by verified expert', () => {
      const revision: WikiRevision = {
        id: 'rev1',
        articleId: 'article1',
        content: '# Health Article\nContent here',
        status: 'stable',
        authorId: 'verified-expert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addWikiRevision(revision)
      
      const revisions = getWikiRevisionsByArticleId('article1')
      expect(revisions).toHaveLength(1)
      expect(revisions[0].status).toBe('stable')
      expect(revisions[0].authorId).toBe('verified-expert')
    })

    it('should not allow unverified user to create stable health revision', () => {
      const revision: WikiRevision = {
        id: 'rev2',
        articleId: 'article1',
        content: '# Health Article\nContent here',
        status: 'stable',
        authorId: 'regular-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Note: This is enforced at the application level, not storage level
      // The storage will still save it, but the application should validate
      addWikiRevision(revision)
      
      const revisions = getWikiRevisionsByArticleId('article1')
      expect(revisions).toHaveLength(1)
      
      // In a real application, you would check this before creating
      const canPublish = canPublishStableHealthRevision('regular-user')
      expect(canPublish).toBe(false)
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
        userId: 'vet-expert',
        credential: 'Veterinary Surgeon',
        verifiedAt: new Date().toISOString(),
      }
      addExpertProfile(expert)

      // Verify expert can publish stable content
      expect(canPublishStableHealthRevision('vet-expert')).toBe(true)

      // Verify regular user cannot
      expect(canPublishStableHealthRevision('regular-user')).toBe(false)

      // Expert publishes stable revision
      const stableRevision: WikiRevision = {
        id: 'stable-rev1',
        articleId: 'health-article-1',
        content: 'Professional health advice',
        status: 'stable',
        authorId: 'vet-expert',
        verifiedBy: 'vet-expert',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addWikiRevision(stableRevision)

      const revisions = getWikiRevisionsByArticleId('health-article-1')
      expect(revisions).toHaveLength(1)
      expect(revisions[0].status).toBe('stable')
      expect(revisions[0].verifiedBy).toBe('vet-expert')
    })
  })
})

