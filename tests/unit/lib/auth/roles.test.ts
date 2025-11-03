/**
 * Tests for Admin Role Utilities
 */

import { hasRole } from '@/lib/auth/session'
import type { AdminRole } from '@/lib/auth/session'

describe('hasRole', () => {
  it('denies when no user', () => {
    expect(hasRole(null, ['Admin'])).toBe(false)
    expect(hasRole(undefined, ['Admin'])).toBe(false)
  })

  it('allows when any allowed role present', () => {
    const user = { roles: ['Moderator' as AdminRole] }
    expect(hasRole(user, ['Admin', 'Moderator'])).toBe(true)
  })

  it('denies when roles missing', () => {
    const user = { roles: [] as AdminRole[] }
    expect(hasRole(user, ['Admin'])).toBe(false)
  })

  it('denies when user has no roles property', () => {
    const user = {} as any
    expect(hasRole(user, ['Admin'])).toBe(false)
  })

  it('allows when user has Admin role', () => {
    const user = { roles: ['Admin' as AdminRole] }
    expect(hasRole(user, ['Admin'])).toBe(true)
  })

  it('works with multiple roles', () => {
    const user = { roles: ['Moderator', 'Expert' as AdminRole] }
    expect(hasRole(user, ['Expert'])).toBe(true)
    expect(hasRole(user, ['ContentManager'])).toBe(false)
  })
})

