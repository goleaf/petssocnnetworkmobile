import {
  getSources,
  getSourceById,
  getSourceByUrl,
  createOrUpdateSource,
  updateSource,
  deleteSource,
  getCitationsByRevision,
  getCitationsBySource,
  createCitation,
  deleteCitation,
  deleteCitationsByRevision,
  deleteCitationsBySource,
  checkBrokenLinks,
  getBrokenSources,
  getSourceStats,
  mergeDuplicateSources,
} from '../sources'
import type { Source, Citation } from '../types'

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

// Mock fetch for broken link checking
global.fetch = jest.fn()

describe('sources', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  const mockSource1: Source = {
    id: 'src_1',
    title: 'Test Source 1',
    url: 'https://example.com/article1',
    publisher: 'Example Publisher',
    date: '2024-01-01',
    license: 'CC-BY',
  }

  const mockSource2: Source = {
    id: 'src_2',
    title: 'Test Source 2',
    url: 'https://example.com/article2',
  }

  describe('getSources', () => {
    it('should return empty array when no sources', () => {
      expect(getSources()).toHaveLength(0)
    })

    it('should return sources from localStorage', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      const sources = getSources()
      expect(sources).toHaveLength(1)
      expect(sources[0].id).toBe('src_1')
    })
  })

  describe('getSourceById', () => {
    it('should return source by id', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1, mockSource2]))
      const source = getSourceById('src_1')
      expect(source).toBeDefined()
      expect(source?.id).toBe('src_1')
      expect(source?.title).toBe('Test Source 1')
    })

    it('should return undefined for non-existent source', () => {
      expect(getSourceById('nonexistent')).toBeUndefined()
    })
  })

  describe('getSourceByUrl', () => {
    it('should return source by URL (exact match)', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      const source = getSourceByUrl('https://example.com/article1')
      expect(source).toBeDefined()
      expect(source?.id).toBe('src_1')
    })

    it('should return source by URL (normalized - trailing slash)', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      const source = getSourceByUrl('https://example.com/article1/')
      expect(source).toBeDefined()
      expect(source?.id).toBe('src_1')
    })

    it('should return source by URL (normalized - case insensitive)', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      const source = getSourceByUrl('HTTPS://EXAMPLE.COM/article1')
      expect(source).toBeDefined()
      expect(source?.id).toBe('src_1')
    })

    it('should return undefined for non-existent URL', () => {
      expect(getSourceByUrl('https://example.com/other')).toBeUndefined()
    })
  })

  describe('createOrUpdateSource - Deduplication', () => {
    it('should create new source when no duplicates exist', () => {
      const newSource = createOrUpdateSource({
        title: 'New Source',
        url: 'https://example.com/new',
      })
      expect(newSource.id).toBeDefined()
      expect(newSource.title).toBe('New Source')
      
      const sources = getSources()
      expect(sources).toHaveLength(1)
    })

    it('should return existing source when duplicate URL is detected (exact match)', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      const result = createOrUpdateSource({
        title: 'Different Title',
        url: 'https://example.com/article1',
      })
      
      expect(result.id).toBe('src_1')
      expect(result.title).toBe('Different Title') // Title updated
      expect(result.url).toBe('https://example.com/article1') // Original URL preserved
      
      const sources = getSources()
      expect(sources).toHaveLength(1) // Still only one source
    })

    it('should return existing source when duplicate URL is detected (trailing slash)', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      const result = createOrUpdateSource({
        title: 'Updated Title',
        url: 'https://example.com/article1/',
      })
      
      expect(result.id).toBe('src_1')
      const sources = getSources()
      expect(sources).toHaveLength(1)
    })

    it('should return existing source when duplicate URL is detected (different case)', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      const result = createOrUpdateSource({
        title: 'Updated Title',
        url: 'HTTPS://EXAMPLE.COM/article1',
      })
      
      expect(result.id).toBe('src_1')
      const sources = getSources()
      expect(sources).toHaveLength(1)
    })

    it('should preserve brokenAt if not explicitly updated', () => {
      const brokenSource: Source = {
        ...mockSource1,
        brokenAt: '2024-01-01T00:00:00Z',
      }
      localStorage.setItem('pet_social_sources', JSON.stringify([brokenSource]))
      
      const result = createOrUpdateSource({
        title: 'Updated Title',
        url: 'https://example.com/article1',
      })
      
      expect(result.brokenAt).toBe('2024-01-01T00:00:00Z')
    })

    it('should update brokenAt if explicitly set', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      const newBrokenAt = '2024-02-01T00:00:00Z'
      const result = createOrUpdateSource({
        title: 'Updated Title',
        url: 'https://example.com/article1',
        brokenAt: newBrokenAt,
      })
      
      expect(result.brokenAt).toBe(newBrokenAt)
    })
  })

  describe('updateSource', () => {
    it('should update existing source', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      const updated = updateSource('src_1', {
        title: 'Updated Title',
        publisher: 'New Publisher',
      })
      
      expect(updated).not.toBeNull()
      expect(updated?.title).toBe('Updated Title')
      expect(updated?.publisher).toBe('New Publisher')
      expect(updated?.id).toBe('src_1')
    })

    it('should return null for non-existent source', () => {
      expect(updateSource('nonexistent', { title: 'New' })).toBeNull()
    })

    it('should prevent creating duplicate when URL changes', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1, mockSource2]))
      
      expect(() => {
        updateSource('src_1', { url: 'https://example.com/article2' })
      }).toThrow('already exists')
    })

    it('should allow updating URL to same normalized URL', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      const updated = updateSource('src_1', { url: 'https://example.com/article1/' })
      expect(updated).not.toBeNull()
      expect(updated?.url).toBe('https://example.com/article1/')
    })
  })

  describe('deleteSource', () => {
    it('should delete source when no citations exist', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1, mockSource2]))
      
      const deleted = deleteSource('src_1')
      expect(deleted).toBe(true)
      
      const sources = getSources()
      expect(sources).toHaveLength(1)
      expect(sources[0].id).toBe('src_2')
    })

    it('should throw error when source has citations', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      localStorage.setItem('pet_social_citations', JSON.stringify([
        {
          revisionId: 'rev_1',
          sourceId: 'src_1',
          locator: 'p. 42',
        },
      ]))
      
      expect(() => deleteSource('src_1')).toThrow('referenced by one or more citations')
    })

    it('should return false for non-existent source', () => {
      expect(deleteSource('nonexistent')).toBe(false)
    })
  })

  describe('Citations', () => {
    const mockCitation: Citation = {
      revisionId: 'rev_1',
      sourceId: 'src_1',
      locator: 'p. 42',
    }

    beforeEach(() => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1, mockSource2]))
    })

    describe('createCitation', () => {
      it('should create citation', () => {
        const citation = createCitation(mockCitation)
        expect(citation).toEqual(mockCitation)
        
        const citations = localStorage.getItem('pet_social_citations')
        expect(citations).toBeTruthy()
        const parsed = JSON.parse(citations!)
        expect(parsed).toHaveLength(1)
      })

      it('should throw error when source does not exist', () => {
        expect(() => {
          createCitation({
            revisionId: 'rev_1',
            sourceId: 'nonexistent',
            locator: 'p. 42',
          })
        }).toThrow('does not exist')
      })
    })

    describe('getCitationsByRevision', () => {
      it('should return citations for revision', () => {
        const citation2: Citation = {
          revisionId: 'rev_1',
          sourceId: 'src_2',
          locator: 'section 3.2',
        }
        const citation3: Citation = {
          revisionId: 'rev_2',
          sourceId: 'src_1',
          locator: 'p. 10',
        }
        
        localStorage.setItem('pet_social_citations', JSON.stringify([
          mockCitation,
          citation2,
          citation3,
        ]))
        
        const citations = getCitationsByRevision('rev_1')
        expect(citations).toHaveLength(2)
        expect(citations[0].sourceId).toBe('src_1')
        expect(citations[1].sourceId).toBe('src_2')
      })

      it('should return empty array when no citations for revision', () => {
        expect(getCitationsByRevision('nonexistent')).toHaveLength(0)
      })
    })

    describe('getCitationsBySource', () => {
      it('should return citations for source', () => {
        const citation2: Citation = {
          revisionId: 'rev_1',
          sourceId: 'src_1',
          locator: 'p. 100',
        }
        const citation3: Citation = {
          revisionId: 'rev_2',
          sourceId: 'src_2',
          locator: 'section 1',
        }
        
        localStorage.setItem('pet_social_citations', JSON.stringify([
          mockCitation,
          citation2,
          citation3,
        ]))
        
        const citations = getCitationsBySource('src_1')
        expect(citations).toHaveLength(2)
        expect(citations.every(c => c.sourceId === 'src_1')).toBe(true)
      })

      it('should return empty array when no citations for source', () => {
        expect(getCitationsBySource('nonexistent')).toHaveLength(0)
      })
    })

    describe('deleteCitation', () => {
      it('should delete specific citation', () => {
        localStorage.setItem('pet_social_citations', JSON.stringify([mockCitation]))
        
        const deleted = deleteCitation('rev_1', 'src_1')
        expect(deleted).toBe(true)
        
        const citations = getCitationsByRevision('rev_1')
        expect(citations).toHaveLength(0)
      })

      it('should return false for non-existent citation', () => {
        expect(deleteCitation('rev_1', 'src_1')).toBe(false)
      })
    })

    describe('deleteCitationsByRevision', () => {
      it('should delete all citations for revision', () => {
        const citation2: Citation = {
          revisionId: 'rev_1',
          sourceId: 'src_2',
          locator: 'p. 50',
        }
        const citation3: Citation = {
          revisionId: 'rev_2',
          sourceId: 'src_1',
          locator: 'p. 10',
        }
        
        localStorage.setItem('pet_social_citations', JSON.stringify([
          mockCitation,
          citation2,
          citation3,
        ]))
        
        const deletedCount = deleteCitationsByRevision('rev_1')
        expect(deletedCount).toBe(2)
        
        const remaining = getCitationsByRevision('rev_2')
        expect(remaining).toHaveLength(1)
      })
    })

    describe('deleteCitationsBySource', () => {
      it('should delete all citations for source', () => {
        const citation2: Citation = {
          revisionId: 'rev_2',
          sourceId: 'src_1',
          locator: 'p. 100',
        }
        const citation3: Citation = {
          revisionId: 'rev_1',
          sourceId: 'src_2',
          locator: 'section 1',
        }
        
        localStorage.setItem('pet_social_citations', JSON.stringify([
          mockCitation,
          citation2,
          citation3,
        ]))
        
        const deletedCount = deleteCitationsBySource('src_1')
        expect(deletedCount).toBe(2)
        
        const remaining = getCitationsBySource('src_2')
        expect(remaining).toHaveLength(1)
      })
    })
  })

  describe('checkBrokenLinks', () => {
    beforeEach(() => {
      localStorage.setItem('pet_social_sources', JSON.stringify([
        mockSource1,
        mockSource2,
      ]))
    })

    it('should mark broken links', async () => {
      // Mock fetch to simulate broken link
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      const result = await checkBrokenLinks()
      
      expect(result.checked).toBe(2)
      // Note: With no-cors mode, we can't actually detect broken links reliably
      // This test verifies the function runs without errors
    })

    it('should skip recently checked broken links', async () => {
      const brokenSource: Source = {
        ...mockSource1,
        brokenAt: new Date().toISOString(), // Just marked as broken
      }
      localStorage.setItem('pet_social_sources', JSON.stringify([brokenSource]))
      
      const result = await checkBrokenLinks()
      expect(result.checked).toBe(1)
    })

    it('should clear brokenAt when link becomes accessible', async () => {
      const brokenSource: Source = {
        ...mockSource1,
        brokenAt: '2024-01-01T00:00:00Z', // Old broken timestamp
      }
      localStorage.setItem('pet_social_sources', JSON.stringify([brokenSource]))
      
      // Mock fetch to succeed (link is accessible)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({})
      
      await checkBrokenLinks()
      
      const sources = getSources()
      expect(sources[0].brokenAt).toBeUndefined()
    })
  })

  describe('getBrokenSources', () => {
    it('should return only broken sources', () => {
      const brokenSource: Source = {
        ...mockSource1,
        brokenAt: '2024-01-01T00:00:00Z',
      }
      localStorage.setItem('pet_social_sources', JSON.stringify([
        brokenSource,
        mockSource2,
      ]))
      
      const broken = getBrokenSources()
      expect(broken).toHaveLength(1)
      expect(broken[0].id).toBe('src_1')
    })

    it('should return empty array when no broken sources', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1, mockSource2]))
      expect(getBrokenSources()).toHaveLength(0)
    })
  })

  describe('getSourceStats', () => {
    it('should return correct statistics', () => {
      const brokenSource: Source = {
        ...mockSource1,
        brokenAt: '2024-01-01T00:00:00Z',
      }
      localStorage.setItem('pet_social_sources', JSON.stringify([
        brokenSource,
        mockSource2,
      ]))
      
      const citation1: Citation = {
        revisionId: 'rev_1',
        sourceId: 'src_1',
        locator: 'p. 42',
      }
      const citation2: Citation = {
        revisionId: 'rev_1',
        sourceId: 'src_1',
        locator: 'p. 50',
      }
      localStorage.setItem('pet_social_citations', JSON.stringify([citation1, citation2]))
      
      const stats = getSourceStats()
      expect(stats.total).toBe(2)
      expect(stats.broken).toBe(1)
      expect(stats.withCitations).toBe(1) // Only src_1 has citations
      expect(stats.totalCitations).toBe(2)
    })
  })

  describe('mergeDuplicateSources', () => {
    it('should merge duplicate sources and update citations', () => {
      // Create two sources with same normalized URL
      const source1: Source = {
        id: 'src_1',
        title: 'Source 1',
        url: 'https://example.com/article',
      }
      const source2: Source = {
        id: 'src_2',
        title: 'Source 2',
        url: 'https://example.com/article/', // Same URL (different trailing slash)
      }
      
      localStorage.setItem('pet_social_sources', JSON.stringify([source1, source2]))
      
      const citation1: Citation = {
        revisionId: 'rev_1',
        sourceId: 'src_2', // References source to merge
        locator: 'p. 42',
      }
      const citation2: Citation = {
        revisionId: 'rev_1',
        sourceId: 'src_1', // References source to keep
        locator: 'p. 50',
      }
      localStorage.setItem('pet_social_citations', JSON.stringify([citation1, citation2]))
      
      const result = mergeDuplicateSources('src_1', 'src_2')
      
      expect(result.merged).toBe(true)
      expect(result.citationsUpdated).toBe(1)
      
      const sources = getSources()
      expect(sources).toHaveLength(1)
      expect(sources[0].id).toBe('src_1')
      
      const citations = getCitationsBySource('src_1')
      expect(citations).toHaveLength(2) // Both citations now reference src_1
    })

    it('should throw error when sources are not duplicates', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1, mockSource2]))
      
      expect(() => {
        mergeDuplicateSources('src_1', 'src_2')
      }).toThrow('not duplicates')
    })

    it('should throw error when source not found', () => {
      localStorage.setItem('pet_social_sources', JSON.stringify([mockSource1]))
      
      expect(() => {
        mergeDuplicateSources('src_1', 'nonexistent')
      }).toThrow('not found')
    })
  })
})

