import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '../auth'
import * as storage from '../storage'
import type { User } from '../types'

// Mock storage module
jest.mock('../storage', () => ({
  getCurrentUser: jest.fn(),
  setCurrentUser: jest.fn(),
  getUsers: jest.fn(),
}))

describe('useAuth', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    password: 'password123',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up zustand state
    const { result } = renderHook(() => useAuth())
    act(() => {
      result.current.logout()
    })
  })

  describe('initialize', () => {
    it('should set user if current user exists', () => {
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(mockUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear auth state if no current user', () => {
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(null)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
      const { result } = renderHook(() => useAuth())

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('testuser', 'password123')
      })

      expect(loginResult!.success).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
      expect(storage.setCurrentUser).toHaveBeenCalledWith('1')
    })

    it('should fail login with invalid username', async () => {
      ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
      const { result } = renderHook(() => useAuth())

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('wronguser', 'password123')
      })

      expect(loginResult!.success).toBe(false)
      expect(loginResult!.error).toBe('Invalid username or password')
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should fail login with invalid password', async () => {
      ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
      const { result } = renderHook(() => useAuth())

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('testuser', 'wrongpassword')
      })

      expect(loginResult!.success).toBe(false)
      expect(loginResult!.error).toBe('Invalid username or password')
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should set password for user without password and login', async () => {
      const userWithoutPassword = { ...mockUser, password: undefined }
      ;(storage.getUsers as jest.Mock).mockReturnValue([userWithoutPassword])
      const { result } = renderHook(() => useAuth())

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('testuser', 'newpassword')
      })

      expect(loginResult!.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should require password for user without password', async () => {
      const userWithoutPassword = { ...mockUser, password: undefined }
      ;(storage.getUsers as jest.Mock).mockReturnValue([userWithoutPassword])
      const { result } = renderHook(() => useAuth())

      let loginResult: { success: boolean; error?: string }
      await act(async () => {
        loginResult = await result.current.login('testuser', '')
      })

      expect(loginResult!.success).toBe(false)
      expect(loginResult!.error).toBe('Password is required')
    })
  })

  describe('logout', () => {
    it('should clear user and authentication state', () => {
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(mockUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('should register new user successfully', async () => {
      ;(storage.getUsers as jest.Mock).mockReturnValue([])
      const { result } = renderHook(() => useAuth())

      const registerData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        fullName: 'New User',
        dateOfBirth: '2000-01-01',
        acceptedPolicies: true,
      }

      let registerResult: { success: boolean; error?: string }
      await act(async () => {
        registerResult = await result.current.register(registerData)
      })

      expect(registerResult!.success).toBe(true)
      expect(result.current.user).toBeDefined()
      expect(result.current.user?.username).toBe('newuser')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should fail registration with existing email', async () => {
      ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
      const { result } = renderHook(() => useAuth())

      const registerData = {
        email: 'test@example.com',
        username: 'newuser',
        password: 'password123',
        fullName: 'New User',
        dateOfBirth: '2000-01-01',
        acceptedPolicies: true,
      }

      let registerResult: { success: boolean; error?: string }
      await act(async () => {
        registerResult = await result.current.register(registerData)
      })

      expect(registerResult!.success).toBe(false)
      expect(registerResult!.error).toBe('Email already exists')
    })

    it('should fail registration with existing username', async () => {
      ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
      const { result } = renderHook(() => useAuth())

      const registerData = {
        email: 'new@example.com',
        username: 'testuser',
        password: 'password123',
        fullName: 'New User',
        dateOfBirth: '2000-01-01',
        acceptedPolicies: true,
      }

      let registerResult: { success: boolean; error?: string }
      await act(async () => {
        registerResult = await result.current.register(registerData)
      })

      expect(registerResult!.success).toBe(false)
      expect(registerResult!.error).toBe('Username already taken')
    })
  })

  describe('switchUser', () => {
    it('should switch to different user', () => {
      const user2: User = {
        id: '2',
        email: 'user2@example.com',
        username: 'user2',
        fullName: 'User 2',
        joinedAt: '2024-01-01',
        followers: [],
        following: [],
      }
      ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser, user2])
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.switchUser('2')
      })

      expect(result.current.user?.id).toBe('2')
      expect(result.current.isAuthenticated).toBe(true)
      expect(storage.setCurrentUser).toHaveBeenCalledWith('2')
    })
  })

  describe('hasRole', () => {
    it('should return true if user has role', () => {
      const adminUser = { ...mockUser, role: 'admin' as const }
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(adminUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.hasRole('admin')).toBe(true)
    })

    it('should return false if user does not have role', () => {
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(mockUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.hasRole('admin')).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, role: 'admin' as const }
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(adminUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.isAdmin()).toBe(true)
    })

    it('should return false for non-admin user', () => {
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(mockUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.isAdmin()).toBe(false)
    })
  })

  describe('isModerator', () => {
    it('should return true for moderator user', () => {
      const moderatorUser = { ...mockUser, role: 'moderator' as const }
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(moderatorUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.isModerator()).toBe(true)
    })

    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, role: 'admin' as const }
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(adminUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.isModerator()).toBe(true)
    })

    it('should return false for regular user', () => {
      ;(storage.getCurrentUser as jest.Mock).mockReturnValue(mockUser)
      const { result } = renderHook(() => useAuth())

      act(() => {
        result.current.initialize()
      })

      expect(result.current.isModerator()).toBe(false)
    })
  })
})
