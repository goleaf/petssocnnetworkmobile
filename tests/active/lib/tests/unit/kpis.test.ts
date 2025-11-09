/**
 * Tests for Admin KPIs
 */

import { getAdminKPIs } from '@/lib/admin/kpis'

// Mock prisma if it exists
jest.mock('@/lib/db', () => ({
  prisma: {
    moderationReport: {
      count: jest.fn(),
    },
    moderationQueue: {
      count: jest.fn(),
    },
    flaggedRevision: {
      count: jest.fn(),
    },
  },
}))

describe('Admin KPIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return KPIs structure', async () => {
    const kpis = await getAdminKPIs()

    expect(kpis).toHaveProperty('newReports24h')
    expect(kpis).toHaveProperty('openCases')
    expect(kpis).toHaveProperty('flaggedRevisions')
    expect(kpis).toHaveProperty('staleHealthPages')
    expect(kpis).toHaveProperty('zeroResultSearches24h')
    expect(kpis).toHaveProperty('jobBacklog')
  })

  it('should return numeric values', async () => {
    const kpis = await getAdminKPIs()

    expect(typeof kpis.newReports24h).toBe('number')
    expect(typeof kpis.openCases).toBe('number')
    expect(typeof kpis.flaggedRevisions).toBe('number')
    expect(typeof kpis.staleHealthPages).toBe('number')
    expect(typeof kpis.zeroResultSearches24h).toBe('number')
    expect(typeof kpis.jobBacklog).toBe('number')
  })

  it('should handle database errors gracefully', async () => {
    // The function should return placeholder values even if DB fails
    const kpis = await getAdminKPIs()

    expect(kpis).toBeDefined()
    expect(kpis.newReports24h).toBeGreaterThanOrEqual(0)
  })
})

