// Avoid loading full testing-library in this legacy skipped suite
jest.mock('@testing-library/react', () => ({}))
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationsDropdown } from '../notifications-dropdown'
import * as authProvider from '@/components/auth/auth-provider'
import * as notificationsLib from '@/lib/notifications'

jest.mock('@/components/auth/auth-provider', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}))
jest.mock('@/lib/notifications')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Legacy duplicate of NotificationsDropdown tests with different mocking style; skipping in favor of updated versions
describe.skip('NotificationsDropdown', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
  }

  const mockNotifications = [
    {
      id: '1',
      userId: '1',
      actorId: '2',
      targetType: 'post' as const,
      targetId: '1',
      message: 'User liked your post',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: '1',
      actorId: '2',
      targetType: 'user' as const,
      targetId: '2',
      message: 'User started following you',
      read: true,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(authProvider, 'useAuth').mockReturnValue({
      user: mockUser,
    } as any)
    ;(notificationsLib.getNotificationsByUserId as jest.Mock).mockReturnValue(mockNotifications)
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(1)
  })

  it('should not render when user is not authenticated', () => {
    jest.spyOn(authProvider, 'useAuth').mockReturnValue({
      user: null,
    } as any)

    const { container } = render(<NotificationsDropdown />)
    expect(container.firstChild).toBeNull()
  })

  it('should render notification bell icon', async () => {
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should display unread count badge', async () => {
    render(<NotificationsDropdown />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('should display 9+ when unread count exceeds 9', async () => {
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(15)
    
    render(<NotificationsDropdown />)
    
    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument()
    })
  })

  it('should open dropdown and show notifications', async () => {
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('User liked your post')).toBeInTheDocument()
    })
  })

  it('should show empty state when no notifications', async () => {
    ;(notificationsLib.getNotificationsByUserId as jest.Mock).mockReturnValue([])
    
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument()
    })
  })

  it('should call markAsRead when notification is clicked', async () => {
    const mockMarkAsRead = jest.spyOn(notificationsLib, 'markAsRead')
    
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      const notificationItem = screen.getByText('User liked your post')
      expect(notificationItem).toBeInTheDocument()
    })
    
    const notificationItem = screen.getByText('User liked your post')
    await userEvent.click(notificationItem.closest('div')!)
    
    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('1')
    })
  })

  it('should call markAllAsRead when "Mark all read" is clicked', async () => {
    const mockMarkAllAsRead = jest.spyOn(notificationsLib, 'markAllAsRead')
    
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      const markAllButton = screen.getByText(/mark all read/i)
      expect(markAllButton).toBeInTheDocument()
    })
    
    const markAllButton = screen.getByText(/mark all read/i)
    await userEvent.click(markAllButton)
    
    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalledWith('1')
    })
  })

  it('should not show "Mark all read" button when no unread notifications', async () => {
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(0)
    
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.queryByText(/mark all read/i)).not.toBeInTheDocument()
    })
  })

  it('should show "View all notifications" link', async () => {
    render(<NotificationsDropdown />)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/view all notifications/i)).toBeInTheDocument()
    })
  })
})
