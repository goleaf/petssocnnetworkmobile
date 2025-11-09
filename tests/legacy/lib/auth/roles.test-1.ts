import { rolePredicates, guards, throwingGuards, checkUserRole, checkAllRoles, checkAnyRole, hasRoleLevel, ROLE_HIERARCHY } from '../roles'
import type { User } from '@/types'

// Mock the storage module
jest.mock('../../storage', () => ({
  getUserById: jest.fn(),
}))

// Mock the auth-server module
jest.mock('../../auth-server', () => ({
  getSession: jest.fn(),
}))

const { getUserById } = require('../../storage')
const { getSession } = require('../../auth-server')

describe('Role-Based Authorization', () => {
  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@example.com',
    username: 'admin',
    fullName: 'Admin User',
    role: 'admin',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  const mockModerator: User = {
    id: 'mod-1',
    email: 'mod@example.com',
    username: 'moderator',
    fullName: 'Moderator User',
    role: 'moderator',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  const mockUser: User = {
    id: 'user-1',
    email: 'user@example.com',
    username: 'user',
    fullName: 'Regular User',
    role: 'user',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  const mockUserNoRole: User = {
    id: 'user-no-role',
    email: 'norole@example.com',
    username: 'norole',
    fullName: 'No Role User',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasRoleLevel', () => {
    it('should return true if role level is sufficient', () => {
      expect(hasRoleLevel('admin', 3)).toBe(true)
      expect(hasRoleLevel('admin', 2)).toBe(true)
      expect(hasRoleLevel('admin', 1)).toBe(true)
    })

    it('should return false if role level is insufficient', () => {
      expect(hasRoleLevel('user', 2)).toBe(false)
      expect(hasRoleLevel('user', 3)).toBe(false)
      expect(hasRoleLevel('moderator', 3)).toBe(false)
    })

    it('should return false for undefined role', () => {
      expect(hasRoleLevel(undefined, 1)).toBe(false)
    })
  })

  describe('rolePredicates.isAdmin', () => {
    it('should return true for admin user', () => {
      expect(rolePredicates.isAdmin(mockAdmin)).toBe(true)
    })

    it('should return false for moderator', () => {
      expect(rolePredicates.isAdmin(mockModerator)).toBe(false)
    })

    it('should return false for regular user', () => {
      expect(rolePredicates.isAdmin(mockUser)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(rolePredicates.isAdmin(null)).toBe(false)
    })

    it('should return false for user without role', () => {
      expect(rolePredicates.isAdmin(mockUserNoRole)).toBe(false)
    })
  })

  describe('rolePredicates.isModerator', () => {
    it('should return true for admin user', () => {
      expect(rolePredicates.isModerator(mockAdmin)).toBe(true)
    })

    it('should return true for moderator', () => {
      expect(rolePredicates.isModerator(mockModerator)).toBe(true)
    })

    it('should return false for regular user', () => {
      expect(rolePredicates.isModerator(mockUser)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(rolePredicates.isModerator(null)).toBe(false)
    })

    it('should return false for user without role', () => {
      expect(rolePredicates.isModerator(mockUserNoRole)).toBe(false)
    })
  })

  describe('rolePredicates.isExpert', () => {
    it('should return true for admin user', () => {
      expect(rolePredicates.isExpert(mockAdmin)).toBe(true)
    })

    it('should return true for moderator', () => {
      expect(rolePredicates.isExpert(mockModerator)).toBe(true)
    })

    it('should return false for regular user', () => {
      expect(rolePredicates.isExpert(mockUser)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(rolePredicates.isExpert(null)).toBe(false)
    })

    it('should return false for user without role', () => {
      expect(rolePredicates.isExpert(mockUserNoRole)).toBe(false)
    })
  })

  describe('rolePredicates.hasRole', () => {
    it('should return true for matching role', () => {
      const predicate = rolePredicates.hasRole('admin')
      expect(predicate(mockAdmin)).toBe(true)
    })

    it('should return false for non-matching role', () => {
      const predicate = rolePredicates.hasRole('admin')
      expect(predicate(mockModerator)).toBe(false)
    })

    it('should return false for null user', () => {
      const predicate = rolePredicates.hasRole('admin')
      expect(predicate(null)).toBe(false)
    })
  })

  describe('rolePredicates.hasAnyRole', () => {
    it('should return true if user has any of the specified roles', () => {
      const predicate = rolePredicates.hasAnyRole('admin', 'moderator')
      expect(predicate(mockAdmin)).toBe(true)
      expect(predicate(mockModerator)).toBe(true)
    })

    it('should return false if user has none of the specified roles', () => {
      const predicate = rolePredicates.hasAnyRole('admin', 'moderator')
      expect(predicate(mockUser)).toBe(false)
    })

    it('should return false for null user', () => {
      const predicate = rolePredicates.hasAnyRole('admin', 'moderator')
      expect(predicate(null)).toBe(false)
    })
  })

  describe('rolePredicates.isAuthenticated', () => {
    it('should return true for any user', () => {
      expect(rolePredicates.isAuthenticated(mockAdmin)).toBe(true)
      expect(rolePredicates.isAuthenticated(mockModerator)).toBe(true)
      expect(rolePredicates.isAuthenticated(mockUser)).toBe(true)
    })

    it('should return false for null user', () => {
      expect(rolePredicates.isAuthenticated(null)).toBe(false)
    })
  })

  describe('guards.requireAdmin', () => {
    it('should return authorized=true for admin user', async () => {
      getSession.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
      getUserById.mockReturnValue(mockAdmin)

      const result = await guards.requireAdmin()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockAdmin)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=false for moderator', async () => {
      getSession.mockResolvedValue({ userId: 'mod-1', role: 'moderator' })
      getUserById.mockReturnValue(mockModerator)

      const result = await guards.requireAdmin()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('Admin role required')
    })

    it('should return authorized=false when not authenticated', async () => {
      getSession.mockResolvedValue(null)

      const result = await guards.requireAdmin()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })

    it('should return authorized=false when user not found', async () => {
      getSession.mockResolvedValue({ userId: 'unknown', role: 'admin' })
      getUserById.mockReturnValue(undefined)

      const result = await guards.requireAdmin()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('User not found')
    })
  })

  describe('guards.requireModerator', () => {
    it('should return authorized=true for admin user', async () => {
      getSession.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
      getUserById.mockReturnValue(mockAdmin)

      const result = await guards.requireModerator()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockAdmin)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=true for moderator', async () => {
      getSession.mockResolvedValue({ userId: 'mod-1', role: 'moderator' })
      getUserById.mockReturnValue(mockModerator)

      const result = await guards.requireModerator()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockModerator)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=false for regular user', async () => {
      getSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
      getUserById.mockReturnValue(mockUser)

      const result = await guards.requireModerator()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('Moderator role required')
    })
  })

  describe('guards.requireExpert', () => {
    it('should return authorized=true for admin user', async () => {
      getSession.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
      getUserById.mockReturnValue(mockAdmin)

      const result = await guards.requireExpert()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockAdmin)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=true for moderator', async () => {
      getSession.mockResolvedValue({ userId: 'mod-1', role: 'moderator' })
      getUserById.mockReturnValue(mockModerator)

      const result = await guards.requireExpert()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockModerator)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=false for regular user', async () => {
      getSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
      getUserById.mockReturnValue(mockUser)

      const result = await guards.requireExpert()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('Expert role required')
    })
  })

  describe('guards.requireRole', () => {
    it('should return authorized=true for matching role', async () => {
      getSession.mockResolvedValue({ userId: 'mod-1', role: 'moderator' })
      getUserById.mockReturnValue(mockModerator)

      const result = await guards.requireRole('moderator')()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockModerator)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=false for non-matching role', async () => {
      getSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
      getUserById.mockReturnValue(mockUser)

      const result = await guards.requireRole('moderator')()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe("Role 'moderator' required")
    })
  })

  describe('guards.requireAnyRole', () => {
    it('should return authorized=true for any matching role', async () => {
      getSession.mockResolvedValue({ userId: 'mod-1', role: 'moderator' })
      getUserById.mockReturnValue(mockModerator)

      const result = await guards.requireAnyRole('admin', 'moderator')()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockModerator)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=false when no roles match', async () => {
      getSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
      getUserById.mockReturnValue(mockUser)

      const result = await guards.requireAnyRole('admin', 'moderator')()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('One of roles [admin, moderator] required')
    })
  })

  describe('guards.requireAuth', () => {
    it('should return authorized=true for authenticated user', async () => {
      getSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
      getUserById.mockReturnValue(mockUser)

      const result = await guards.requireAuth()

      expect(result.authorized).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.error).toBeUndefined()
    })

    it('should return authorized=false when not authenticated', async () => {
      getSession.mockResolvedValue(null)

      const result = await guards.requireAuth()

      expect(result.authorized).toBe(false)
      expect(result.user).toBeNull()
      expect(result.error).toBe('Not authenticated')
    })
  })

  describe('throwingGuards', () => {
    it('should throw error when not authorized', async () => {
      getSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
      getUserById.mockReturnValue(mockUser)

      await expect(throwingGuards.requireAdmin()).rejects.toThrow('Admin role required')
      await expect(throwingGuards.requireModerator()).rejects.toThrow('Moderator role required')
      await expect(throwingGuards.requireExpert()).rejects.toThrow('Expert role required')
    })

    it('should return user when authorized', async () => {
      getSession.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
      getUserById.mockReturnValue(mockAdmin)

      const user = await throwingGuards.requireAdmin()
      expect(user).toEqual(mockAdmin)
    })
  })

  describe('checkUserRole', () => {
    it('should check role using predicate', () => {
      expect(checkUserRole(mockAdmin, rolePredicates.isAdmin)).toBe(true)
      expect(checkUserRole(mockModerator, rolePredicates.isAdmin)).toBe(false)
      expect(checkUserRole(null, rolePredicates.isAdmin)).toBe(false)
    })
  })

  describe('checkAllRoles', () => {
    it('should return true when all predicates pass', () => {
      const predicates = [rolePredicates.isAuthenticated, rolePredicates.isModerator]
      expect(checkAllRoles(mockAdmin, predicates)).toBe(true)
    })

    it('should return false when any predicate fails', () => {
      const predicates = [rolePredicates.isAuthenticated, rolePredicates.isAdmin]
      expect(checkAllRoles(mockModerator, predicates)).toBe(false)
    })

    it('should return false for null user', () => {
      const predicates = [rolePredicates.isAuthenticated]
      expect(checkAllRoles(null, predicates)).toBe(false)
    })
  })

  describe('checkAnyRole', () => {
    it('should return true when any predicate passes', () => {
      const predicates = [rolePredicates.isAdmin, rolePredicates.isModerator]
      expect(checkAnyRole(mockModerator, predicates)).toBe(true)
    })

    it('should return false when all predicates fail', () => {
      const predicates = [rolePredicates.isAdmin, rolePredicates.isModerator]
      expect(checkAnyRole(mockUser, predicates)).toBe(false)
    })

    it('should return false for null user', () => {
      const predicates = [rolePredicates.isAdmin, rolePredicates.isModerator]
      expect(checkAnyRole(null, predicates)).toBe(false)
    })
  })

  describe('Role Matrix Coverage', () => {
    // Test matrix: roles vs actions
    const testCases = [
      { user: mockAdmin, role: 'admin' as const },
      { user: mockModerator, role: 'moderator' as const },
      { user: mockUser, role: 'user' as const },
      { user: mockUserNoRole, role: undefined },
      { user: null, role: null },
    ]

    testCases.forEach(({ user, role }) => {
      const roleLabel = role || 'no-role'
      
      describe(`User with role: ${roleLabel}`, () => {
        it('should correctly evaluate isAdmin', () => {
          const expected = role === 'admin'
          expect(rolePredicates.isAdmin(user)).toBe(expected)
        })

        it('should correctly evaluate isModerator', () => {
          const expected = role === 'admin' || role === 'moderator'
          expect(rolePredicates.isModerator(user)).toBe(expected)
        })

        it('should correctly evaluate isExpert', () => {
          const expected = role === 'admin' || role === 'moderator'
          expect(rolePredicates.isExpert(user)).toBe(expected)
        })

        it('should correctly evaluate isAuthenticated', () => {
          const expected = user !== null
          expect(rolePredicates.isAuthenticated(user)).toBe(expected)
        })

        if (user) {
          it('should correctly evaluate hasRole', () => {
            const hasAdmin = rolePredicates.hasRole('admin')(user)
            expect(hasAdmin).toBe(role === 'admin')
          })

          it('should correctly evaluate hasAnyRole', () => {
            const predicate = rolePredicates.hasAnyRole('admin', 'moderator')
            const hasAny = predicate(user)
            const expected = role === 'admin' || role === 'moderator'
            expect(hasAny).toBe(expected)
          })
        }
      })
    })
  })
})

