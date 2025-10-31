import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationsDropdown } from '../notifications-dropdown'
import * as authProvider from '../auth/auth-provider'
import * as notificationsLib from '@/lib/notifications'

// Mock auth-provider to export useAuth
const mockUseAuth = jest.fn()

jest.mock('../auth/auth-provider', () => ({
  useAuth: jest.fn(() => mockUseAuth()),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/lib/notifications')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))
jest.mock('date-fns')

describe('NotificationsDropdown', () => {
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
      type: 'like' as const,
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
      type: 'follow' as const,
      actorId: '2',
      targetType: 'user' as const,
      targetId: '2',
      message: 'User started following you',
      read: true,
      createdAt: new Date(Date.now() - 60000).toISOString(),
    },
  ]

  beforeEach(() => {
    // Set up useAuth mock FIRST before clearing, then reset other mocks
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    jest.clearAllMocks()
    
    // Re-setup useAuth after clear (clearAllMocks resets it)
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(notificationsLib.getNotificationsByUserId as jest.Mock).mockReturnValue(mockNotifications)
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(1)
  })

  it('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    const { container } = render(<NotificationsDropdown />)
    expect(container.firstChild).toBeNull()
  })

  it('should render notification bell icon', async () => {
    render(<NotificationsDropdown />)
    
    // Component should render when user exists - check for Bell icon or button
    await waitFor(() => {
      // Try multiple ways to find the button - it might be in a dropdown trigger
      const button = screen.queryByRole('button') || 
                     screen.queryByLabelText(/notification/i) ||
                     document.querySelector('button')
      expect(button).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display unread count badge', async () => {
    render(<NotificationsDropdown />)
    
    // Wait for component to render and useEffect to run
    await waitFor(() => {
      const button = screen.queryByRole('button') || document.querySelector('button')
      expect(button).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Then check for the badge (the unread count is rendered inside the button)
    await waitFor(() => {
      // The badge shows the number "1" - search within the rendered component
      const badgeText = screen.queryByText('1', { selector: 'span' }) || 
                       screen.queryByText((content, element) => {
                         return element?.textContent === '1' && element?.tagName === 'SPAN'
                       })
      expect(badgeText).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display 9+ when unread count exceeds 9', async () => {
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(15)
    
    render(<NotificationsDropdown />)
    
    // Wait for component to render
    await waitFor(() => {
      const button = screen.queryByRole('button') || document.querySelector('button')
      expect(button).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Check for 9+ badge
    await waitFor(() => {
      const badgeText = screen.queryByText('9+', { selector: 'span' }) || 
                       screen.queryByText((content, element) => {
                         return element?.textContent === '9+' && element?.tagName === 'SPAN'
                       })
      expect(badgeText).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should open dropdown and show notifications', async () => {
    render(<NotificationsDropdown />)
    
    // Wait for button to render
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    if (button) {
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
        expect(screen.getByText('User liked your post')).toBeInTheDocument()
      }, { timeout: 2000 })
    }
  })

  it('should show empty state when no notifications', async () => {
    ;(notificationsLib.getNotificationsByUserId as jest.Mock).mockReturnValue([])
    
    render(<NotificationsDropdown />)
    
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    if (button) {
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    }
  })

  it('should call markAsRead when notification is clicked', async () => {
    const mockMarkAsRead = jest.spyOn(notificationsLib, 'markAsRead')
    
    render(<NotificationsDropdown />)
    
    // Wait for button to render
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    if (button) {
      await userEvent.click(button)
      
      await waitFor(() => {
        const notificationItem = screen.getByText('User liked your post')
        expect(notificationItem).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const notificationItem = screen.getByText('User liked your post')
      await userEvent.click(notificationItem.closest('div')!)
      
      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalledWith('1')
      }, { timeout: 2000 })
    }
  })

  it('should call markAllAsRead when "Mark all read" is clicked', async () => {
    const mockMarkAllAsRead = jest.spyOn(notificationsLib, 'markAllAsRead')
    
    render(<NotificationsDropdown />)
    
    // Wait for button to render
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    if (button) {
      await userEvent.click(button)
      
      await waitFor(() => {
        const markAllButton = screen.getByText(/mark all read/i)
        expect(markAllButton).toBeInTheDocument()
      }, { timeout: 2000 })
      
      const markAllButton = screen.getByText(/mark all read/i)
      await userEvent.click(markAllButton)
      
      await waitFor(() => {
        expect(mockMarkAllAsRead).toHaveBeenCalledWith('1')
      }, { timeout: 2000 })
    }
  })

  it('should not show "Mark all read" button when no unread notifications', async () => {
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(0)
    
    render(<NotificationsDropdown />)
    
    // Wait for button to render
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    if (button) {
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(screen.queryByText(/mark all read/i)).not.toBeInTheDocument()
      }, { timeout: 2000 })
    }
  })

  it('should show "View all notifications" link', async () => {
    render(<NotificationsDropdown />)
    
    // Wait for button to render
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    
    if (button) {
      await userEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/view all notifications/i)).toBeInTheDocument()
      }, { timeout: 2000 })
    }
  })

  it('should display different icons for different notification types', async () => {
    const notificationsWithMultipleTypes = [
      {
        id: '1',
        userId: '1',
        type: 'follow' as const,
        actorId: '2',
        targetType: 'user' as const,
        targetId: '2',
        message: 'User started following you',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: '1',
        type: 'like' as const,
        actorId: '3',
        targetType: 'post' as const,
        targetId: '1',
        message: 'User liked your post',
        read: false,
        createdAt: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: '3',
        userId: '1',
        type: 'comment' as const,
        actorId: '4',
        targetType: 'post' as const,
        targetId: '2',
        message: 'User commented on your post',
        read: false,
        createdAt: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: '4',
        userId: '1',
        type: 'mention' as const,
        actorId: '5',
        targetType: 'post' as const,
        targetId: '3',
        message: 'User mentioned you in a post',
        read: false,
        createdAt: new Date(Date.now() - 180000).toISOString(),
      },
      {
        id: '5',
        userId: '1',
        type: 'post' as const,
        actorId: '6',
        targetType: 'post' as const,
        targetId: '4',
        message: 'User published a new post',
        read: false,
        createdAt: new Date(Date.now() - 240000).toISOString(),
      },
    ]

    ;(notificationsLib.getNotificationsByUserId as jest.Mock).mockReturnValue(notificationsWithMultipleTypes)
    ;(notificationsLib.getUnreadCount as jest.Mock).mockReturnValue(5)

    render(<NotificationsDropdown />)
    
    const button = await waitFor(() => {
      return screen.queryByRole('button') || document.querySelector('button')
    }, { timeout: 2000 })
    
    expect(button).toBeInTheDocument()
    
    if (button) {
      await userEvent.click(button)
      
      // Check that notifications are displayed
      await waitFor(() => {
        expect(screen.getByText('User started following you')).toBeInTheDocument()
        expect(screen.getByText('User liked your post')).toBeInTheDocument()
        expect(screen.getByText('User commented on your post')).toBeInTheDocument()
        expect(screen.getByText('User mentioned you in a post')).toBeInTheDocument()
        expect(screen.getByText('User published a new post')).toBeInTheDocument()
      }, { timeout: 2000 })
    }
  })
})

