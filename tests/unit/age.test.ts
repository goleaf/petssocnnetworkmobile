import { calculateAge } from '@/lib/utils/date'

describe('Age calculation', () => {
  test('calculates integer age from date of birth', () => {
    const ref = new Date('2025-01-01T00:00:00Z')
    expect(calculateAge('2000-01-01', ref)).toBe(25)
    expect(calculateAge('2000-12-31', ref)).toBe(24)
  })

  test('handles invalid or missing dates', () => {
    expect(calculateAge(undefined as any)).toBeUndefined()
    expect(calculateAge('invalid-date')).toBeUndefined()
  })
})

