import { getHealthyWeightRangeByBreed } from '@/lib/health/utils'

describe('Healthy weight range by breed', () => {
  it('returns range for Golden Retriever', () => {
    const r = getHealthyWeightRangeByBreed('Golden Retriever')
    expect(r.unit).toBe('lb')
    expect(r.min).toBeLessThanOrEqual(55)
    expect(r.max).toBeGreaterThanOrEqual(75)
  })

  it('returns range for Maine Coon', () => {
    const r = getHealthyWeightRangeByBreed('Maine Coon')
    expect(r.min).toBeLessThanOrEqual(9)
    expect(r.max).toBeGreaterThanOrEqual(18)
  })

  it('falls back for unknown breed', () => {
    const r = getHealthyWeightRangeByBreed('Unknown Breed')
    expect(r.min).toBeLessThan(r.max)
  })
})

