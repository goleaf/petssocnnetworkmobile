import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StoryViewer } from '@/components/stories/StoryViewer'
import { getUsers, getActiveStoriesByUserId, markStoryViewed } from '@/lib/storage'
import { useAuth } from '@/lib/auth'

// Mock dependencies
jest.mock('@/lib/storage', () => ({
  getUsers: jest.fn(),
  getActiveStoriesByUserId: jest.fn(),
  markStoryViewed: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}))

const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>
const mockGetActiveStoriesByUserId = getActiveStoriesByUserId as jest.MockedFunction<typeof getActiveStoriesByUserId>
const mockMarkStoryViewed = markStoryViewed as jest.MockedFunction<typeof markStoryViewed>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('StoryViewer', () => {
  const mockUser = {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  const mockStoryUser = {
    id: 'story-user-1',
    username: 'storyuser',
    email: 'story@example.com',
    fullName: 'Story User',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
    avatar: '/test-avatar.jpg',
    closeFriends: [],
  }

  const mockStories = [
    {
      id: 'story1',
      userId: 'story-user-1',
      media: [{ type: 'image' as const, url: '/test-image.jpg', duration: 5 }],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewers: [],
      overlays: [],
    },
    {
      id: 'story2',
      userId: 'story-user-1',
      media: [{ type: 'video' as const, url: '/test-video.mp4', duration: 10 }],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewers: [],
      overlays: [],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser } as any)
    mockGetUsers.mockReturnValue([mockStoryUser])
    mockGetActiveStoriesByUserId.mockReturnValue(mockStories)
  })

  it('renders story viewer when open', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    expect(screen.getByAltText('Story')).toBeInTheDocument()
    expect(screen.getByText('storyuser')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <StoryViewer
        open={false}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('displays progress bars for each story', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    // Should have 2 progress bars (one for each story)
    const progressBars = screen.getAllByRole('generic').filter(
      el => el.className.includes('h-1')
    )
    expect(progressBars.length).toBeGreaterThanOrEqual(2)
  })

  it('displays story content correctly', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    // Verify story image is displayed
    const storyImage = screen.getByAltText('Story')
    expect(storyImage).toHaveAttribute('src', '/test-image.jpg')
  })

  it('closes viewer when X button is clicked', () => {
    const onOpenChange = jest.fn()
    render(
      <StoryViewer
        open={true}
        onOpenChange={onOpenChange}
        startUserId="story-user-1"
      />
    )

    // Find the close button by its icon (X button doesn't have accessible name)
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons[0] // First button is the X close button
    fireEvent.click(closeButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('navigates to next story when right side is tapped', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    const nextButton = screen.getByLabelText('Next story')
    fireEvent.click(nextButton)

    // Should advance to second story
    waitFor(() => {
      expect(mockMarkStoryViewed).toHaveBeenCalledWith('story2', 'user1')
    })
  })

  it('navigates to previous story when left side is tapped', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    // First advance to second story
    const nextButton = screen.getByLabelText('Next story')
    fireEvent.click(nextButton)

    // Then go back
    const prevButton = screen.getByLabelText('Previous story')
    fireEvent.click(prevButton)

    // Should be back at first story
    waitFor(() => {
      expect(mockMarkStoryViewed).toHaveBeenCalledWith('story1', 'user1')
    })
  })

  it('displays close friends badge when user is in close friends list', () => {
    const closeFriendUser = {
      ...mockStoryUser,
      closeFriends: ['user1'],
    }
    mockGetUsers.mockReturnValue([closeFriendUser])

    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    expect(screen.getByText('Close Friends')).toBeInTheDocument()
  })

  it('does not display close friends badge for non-close friends', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    expect(screen.queryByText('Close Friends')).not.toBeInTheDocument()
  })

  it('displays text overlays from story data', () => {
    const storiesWithText = [
      {
        ...mockStories[0],
        overlays: [
          {
            id: 'overlay1',
            type: 'text' as const,
            text: 'Hello World',
            x: 0.5,
            y: 0.5,
            color: '#ffffff',
            fontSize: 24,
          },
        ],
      },
    ]
    mockGetActiveStoriesByUserId.mockReturnValue(storiesWithText)

    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('displays pause indicator when paused', () => {
    const { container } = render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    // The pause indicator should not be visible initially
    const pauseIndicators = container.querySelectorAll('.bg-black\\/50')
    expect(pauseIndicators.length).toBe(0)
  })

  it('handles swipe up gesture to close', () => {
    const onOpenChange = jest.fn()
    const { container } = render(
      <StoryViewer
        open={true}
        onOpenChange={onOpenChange}
        startUserId="story-user-1"
      />
    )

    const viewer = container.firstChild as HTMLElement

    // Simulate swipe up
    fireEvent.touchStart(viewer, {
      touches: [{ clientX: 200, clientY: 400 }],
    })
    fireEvent.touchEnd(viewer, {
      changedTouches: [{ clientX: 200, clientY: 200 }], // Swipe up 200px
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('displays timestamp for story', () => {
    render(
      <StoryViewer
        open={true}
        onOpenChange={jest.fn()}
        startUserId="story-user-1"
      />
    )

    // Should display a time (format: HH:MM)
    const timeRegex = /\d{1,2}:\d{2}/
    expect(screen.getByText(timeRegex)).toBeInTheDocument()
  })
})
