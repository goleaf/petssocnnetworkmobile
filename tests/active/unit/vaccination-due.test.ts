import { getVaccinationNextDue } from '@/lib/health/utils'

describe('Vaccination next due date', () => {
  it('adds 1 year interval', () => {
    expect(getVaccinationNextDue('2022-02-28', '1y')).toBe('2023-02-28')
  })
  it('adds 3 year interval', () => {
    expect(getVaccinationNextDue('2022-10-20', '3y')).toBe('2025-10-20')
  })
  it('adjusts Feb 29 to Feb 28 on non-leap years', () => {
    expect(getVaccinationNextDue('2020-02-29', '1y')).toBe('2021-02-28')
  })
})

