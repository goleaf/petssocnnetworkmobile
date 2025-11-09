import { calculateAge } from '@/lib/utils/date'

describe('Age calculation', () => {
  it('handles simple exact year', () => {
    const ref = new Date('2025-06-01T00:00:00Z')
    expect(calculateAge('2015-06-01', ref)).toBe(10)
  })

  it('handles pre-birthday within year', () => {
    const ref = new Date('2025-05-31T00:00:00Z')
    expect(calculateAge('2015-06-01', ref)).toBe(9)
  })

  it('handles leap day birthdays before non-leap year anniversary', () => {
    const ref = new Date('2021-02-28T00:00:00Z')
    expect(calculateAge('2020-02-29', ref)).toBe(0)
  })

  it('handles leap day birthdays after non-leap year anniversary', () => {
    const ref = new Date('2021-03-01T00:00:00Z')
    expect(calculateAge('2020-02-29', ref)).toBe(1)
  })
})

