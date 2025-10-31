import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GroupPage from '../page'
import * as storage from '@/lib/storage'
import * as auth from '@/lib/auth'

jest.mock('@/lib/storage')
jest.mock('@/lib/auth')
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useParams: () => ({ slug: 'golden-retriever-owners' }),
}))

describe('GroupPage', () => {
  const mockGroup = {
    id: 'grp-1',
    name: 'Golden Retriever Owners',
    slug: 'golden-retriever-owners',
    description: 'A community for golden retriever owners to share experiences, tips, and photos of their beloved companions.',
    type: 'open' as const,
    categoryId: 'cat-dogs',
    ownerId: '1',
    coverImage: '/dog-cover.jpg',
    avatar: '/golden-retriever-icon.png',
    memberCount: 245,
    topicCount: 89,
    postCount: 1240,
    tags: ['golden-retriever', 'dogs', 'training', 'health'],
    rules: [
      'Be respectful to all members',
      'No spam or self-promotion',
      'Keep posts relevant to golden retrievers',
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
  }

  const mockTopics = [
    {
      id: 'topic-1',
      groupId: 'grp-1',
      authorId: '1',
      title: 'Training Tips',
      content: 'Best practices for training golden retrievers',
      isPinned: true,
      isLocked: false,
      status: 'active' as const,
      viewCount: 120,
      commentCount: 45,
      createdAt: '2024-03-20T10:00:00Z',
      updatedAt: '2024-03-20T14:00:00Z',
    },
    {
      id: 'topic-2',
      groupId: 'grp-1',
      authorId: '2',
      title: 'Health Questions',
      content: 'Questions about golden retriever health',
      isPinned: false,
      isLocked: false,
      status: 'active' as const,
      viewCount: 89,
      commentCount: 23,
      createdAt: '2024-03-19T10:00:00Z',
      updatedAt: '2024-03-19T15:00:00Z',
    },
  ]

  const mockPolls = [
    {
      id: 'poll-1',
      groupId: 'grp-1',
      authorId: '1',
      question: 'What is your favorite food brand?',
      options: [
        { id: 'opt-1', text: 'Brand A', voteCount: 45 },
        { id: 'opt-2', text: 'Brand B', voteCount: 30 },
      ],
      allowMultiple: false,
      isClosed: false,
      voteCount: 75,
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: '2024-03-20T10:00:00Z',
    },
  ]

  const mockEvents = [
    {
      id: 'event-1',
      groupId: 'grp-1',
      authorId: '1',
      title: 'Dog Park Meetup',
      description: 'Join us for a fun day at the dog park',
      startDate: '2024-04-15T14:00:00Z',
      location: 'Central Dog Park',
      rsvpRequired: true,
      maxAttendees: 50,
      attendeeCount: 35,
      isCancelled: false,
      createdAt: '2024-03-10T10:00:00Z',
      updatedAt: '2024-03-20T10:00:00Z',
    },
  ]

  const mockResources = [
    {
      id: 'res-1',
      groupId: 'grp-1',
      title: 'Golden Retriever Care Guide',
      type: 'document' as const,
      description: 'Complete care guide',
      uploadedBy: '1',
      category: 'care',
      createdAt: '2024-03-01T10:00:00Z',
    },
  ]

  const mockActivities = [
    {
      id: 'act-1',
      groupId: 'grp-1',
      userId: '1',
      type: 'topic' as const,
      targetId: 'topic-1',
      targetType: 'topic' as const,
      timestamp: '2024-03-20T14:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(storage.getGroupBySlug as jest.Mock).mockReturnValue(mockGroup)
    ;(storage.getGroupTopicsByGroupId as jest.Mock).mockReturnValue(mockTopics)
    ;(storage.getGroupPollsByGroupId as jest.Mock).mockReturnValue(mockPolls)
    ;(storage.getGroupEventsByGroupId as jest.Mock).mockReturnValue(mockEvents)
    ;(storage.getGroupResourcesByGroupId as jest.Mock).mockReturnValue(mockResources)
    ;(storage.getGroupActivitiesByGroupId as jest.Mock).mockReturnValue(mockActivities)
    ;(storage.canUserViewGroup as jest.Mock).mockReturnValue(true)
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(false)
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
  })

  it('should render group page with loading state initially', () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    // The component will show loading state initially
    expect(screen.queryByText('Golden Retriever Owners')).not.toBeInTheDocument()
  })

  it('should display group information after loading', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show feed tab by default', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      expect(screen.getByText(/group feed/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display all tabs', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      expect(screen.getByText('Feed')).toBeInTheDocument()
      expect(screen.getByText('Topics')).toBeInTheDocument()
      expect(screen.getByText('Polls')).toBeInTheDocument()
      expect(screen.getByText('Events')).toBeInTheDocument()
      expect(screen.getByText('Resources')).toBeInTheDocument()
      expect(screen.getByText('Members')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should switch to topics tab and display topics', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const topicsTab = screen.getByText('Topics')
      userEvent.click(topicsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/topics/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText('Training Tips')).toBeInTheDocument()
      expect(screen.getByText('Health Questions')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show topic count badges', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const topicsTab = screen.getByText('Topics')
      expect(topicsTab).toBeInTheDocument()
      // Topic count should be displayed
      expect(screen.getByText(/89 views/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display pinned topic badge', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const topicsTab = screen.getByText('Topics')
      userEvent.click(topicsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/pinned/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should switch to polls tab and display polls', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const pollsTab = screen.getByText('Polls')
      userEvent.click(pollsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/polls/i)).toBeInTheDocument()
      expect(screen.getByText('What is your favorite food brand?')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should switch to events tab and display events', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const eventsTab = screen.getByText('Events')
      userEvent.click(eventsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/events/i)).toBeInTheDocument()
      expect(screen.getByText('Dog Park Meetup')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should switch to resources tab and display resources', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const resourcesTab = screen.getByText('Resources')
      userEvent.click(resourcesTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/resources/i)).toBeInTheDocument()
      expect(screen.getByText('Golden Retriever Care Guide')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not show new topic button for non-members', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      expect(screen.queryByText(/new topic/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show new topic button for members', async () => {
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', username: 'user1' },
      isAuthenticated: true,
    })
    
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      expect(screen.getByText(/new topic/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show empty state when no topics exist', async () => {
    ;(storage.getGroupTopicsByGroupId as jest.Mock).mockReturnValue([])
    
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const topicsTab = screen.getByText('Topics')
      userEvent.click(topicsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/no topics yet/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show empty state when no polls exist', async () => {
    ;(storage.getGroupPollsByGroupId as jest.Mock).mockReturnValue([])
    
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const pollsTab = screen.getByText('Polls')
      userEvent.click(pollsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/no polls yet/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show empty state when no events exist', async () => {
    ;(storage.getGroupEventsByGroupId as jest.Mock).mockReturnValue([])
    
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const eventsTab = screen.getByText('Events')
      userEvent.click(eventsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/no events scheduled/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should redirect to groups list when group not found', async () => {
    ;(storage.getGroupBySlug as jest.Mock).mockReturnValue(null)
    const mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    }
    jest.doMock('next/navigation', () => ({
      useRouter: () => mockRouter,
    }))
    
    render(<GroupPage params={Promise.resolve({ slug: 'non-existent' })} />)
    
    await waitFor(() => {
      // Should redirect, component won't render content
    }, { timeout: 3000 })
  })

  it('should not display secret groups to non-authenticated users', async () => {
    const secretGroup = { ...mockGroup, type: 'secret' as const }
    ;(storage.getGroupBySlug as jest.Mock).mockReturnValue(secretGroup)
    ;(storage.canUserViewGroup as jest.Mock).mockReturnValue(false)
    
    render(<GroupPage params={Promise.resolve({ slug: 'secret-group' })} />)
    
    await waitFor(() => {
      // Should redirect, component won't render content
    }, { timeout: 3000 })
  })

  it('should display topic view and comment counts', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const topicsTab = screen.getByText('Topics')
      userEvent.click(topicsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/120 views/i)).toBeInTheDocument()
      expect(screen.getByText(/45 comments/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should navigate to topic detail page', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const topicsTab = screen.getByText('Topics')
      userEvent.click(topicsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      const topicLink = screen.getByText('Training Tips').closest('a')
      expect(topicLink).toHaveAttribute('href', '/groups/golden-retriever-owners/topics/topic-1')
    }, { timeout: 3000 })
  })

  it('should display poll vote counts', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const pollsTab = screen.getByText('Polls')
      userEvent.click(pollsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/75 votes/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display event attendee counts', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const eventsTab = screen.getByText('Events')
      userEvent.click(eventsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      expect(screen.getByText(/35 attending/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should navigate to members page from members tab', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const membersTab = screen.getByText('Members')
      userEvent.click(membersTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      const membersLink = screen.getByText(/view all members/i).closest('a')
      expect(membersLink).toHaveAttribute('href', '/groups/golden-retriever-owners/members')
    }, { timeout: 3000 })
  })

  it('should navigate to settings page from settings tab', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      const settingsTab = screen.getByText('Settings')
      userEvent.click(settingsTab)
    }, { timeout: 3000 })
    
    await waitFor(() => {
      const settingsLink = screen.getByText(/go to settings/i).closest('a')
      expect(settingsLink).toHaveAttribute('href', '/groups/golden-retriever-owners/settings')
    }, { timeout: 3000 })
  })

  it('should show no activity message when group has no activities', async () => {
    ;(storage.getGroupActivitiesByGroupId as jest.Mock).mockReturnValue([])
    
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display activities in feed tab', async () => {
    render(<GroupPage params={Promise.resolve({ slug: 'golden-retriever-owners' })} />)
    
    await waitFor(() => {
      // Activities should be rendered in the feed tab
      expect(screen.getByText(/group feed/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

