/**
 * Tests for RequireRole Component
 */

import React from 'react'
import { render } from '@testing-library/react'
import RequireRole from '@/components/admin/RequireRole'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/auth/session', () => ({
  getCurrentUser: jest.fn(),
  hasRole: jest.fn(),
}))

import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth/session'

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockHasRole = hasRole as jest.MockedFunction<typeof hasRole>

describe('RequireRole Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw new Error('redirect called')
    })
  })

  it('should render children when user has required role', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Admin User',
      roles: ['Admin'],
    })
    mockHasRole.mockReturnValue(true)

    const TestComponent = await RequireRole({
      roles: ['Admin'],
      children: <div>Protected Content</div>,
    })

    const { container } = render(TestComponent as React.ReactElement)
    expect(container.textContent).toContain('Protected Content')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('should redirect when user lacks required role', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'Regular User',
      roles: [],
    })
    mockHasRole.mockReturnValue(false)

    try {
      await RequireRole({
        roles: ['Admin'],
        children: <div>Protected Content</div>,
      })
    } catch (error) {
      // Expected - redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login?next=/admin')
  })

  it('should redirect when user is null', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    mockHasRole.mockReturnValue(false)

    try {
      await RequireRole({
        roles: ['Admin'],
        children: <div>Protected Content</div>,
      })
    } catch (error) {
      // Expected - redirect throws
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login?next=/admin')
  })

  it('should check multiple roles', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'moderator-1',
      email: 'mod@test.com',
      name: 'Moderator User',
      roles: ['Moderator'],
    })
    mockHasRole.mockReturnValue(true)

    const TestComponent = await RequireRole({
      roles: ['Admin', 'Moderator'],
      children: <div>Protected Content</div>,
    })

    const { container } = render(TestComponent as React.ReactElement)
    expect(container.textContent).toContain('Protected Content')
    expect(mockHasRole).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['Moderator'] }),
      ['Admin', 'Moderator']
    )
  })
})

