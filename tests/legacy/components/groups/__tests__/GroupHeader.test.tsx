import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupHeader } from '../GroupHeader'
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
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}))

describe('GroupHeader', () => {
  const mockGroup = {
    id: 'grp-1',
    name: 'Golden Retriever Owners',
    slug: 'golden-retriever-owners',
    description: 'A community for golden retriever owners',
    type: 'open' as const,
    categoryId: 'cat-dogs',
    ownerId: '1',
    coverImage: '/dog-cover.jpg',
    avatar: '/golden-retriever-icon.png',
    memberCount: 245,
    topicCount: 89,
    postCount: 1240,
    tags: ['golden-retriever', 'dogs'],
    rules: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
    visibility: {
      discoverable: true,
      content: 'everyone',
    },
  }

  const mockCategory = {
    id: 'cat-dogs',
    name: 'Dogs',
    slug: 'dogs',
    description: 'Groups for dog owners',
    icon: '🐕',
    color: '#3b82f6',
    groupCount: 8,
    createdAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(storage.getGroupCategoryById as jest.Mock).mockReturnValue(mockCategory)
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(false)
    ;(storage.getUserRoleInGroup as jest.Mock).mockReturnValue(null)
    ;(storage.canUserManageSettings as jest.Mock).mockReturnValue(false)
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
  })

  it('should render group name', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
  })

  it('should render group description', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('A community for golden retriever owners')).toBeInTheDocument()
  })

  it('should display member count', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('245')).toBeInTheDocument()
    expect(screen.getByText(/members/i)).toBeInTheDocument()
  })

  it('should display topic count', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('89')).toBeInTheDocument()
    expect(screen.getByText(/topics/i)).toBeInTheDocument()
  })

  it('should display post count', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('1240')).toBeInTheDocument()
    expect(screen.getByText(/posts/i)).toBeInTheDocument()
  })

  it('should display group tags', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('#golden-retriever')).toBeInTheDocument()
    expect(screen.getByText('#dogs')).toBeInTheDocument()
  })

  it('should display category icon and name', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText('Dogs')).toBeInTheDocument()
  })

  it('should show join button for non-authenticated users', () => {
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText(/join group/i)).toBeInTheDocument()
  })

  it('should show join button for non-member authenticated users', () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '2', username: 'user2' },
      isAuthenticated: true,
    })
    
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText(/join group/i)).toBeInTheDocument()
  })

  it('should show leave button for members', () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '2', username: 'user2' },
      isAuthenticated: true,
    })
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText(/leave group/i)).toBeInTheDocument()
  })

  it('should disable leave button for owners', () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', username: 'owner' },
      isAuthenticated: true,
    })
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    ;(storage.getUserRoleInGroup as jest.Mock).mockReturnValue('owner')
    
    render(<GroupHeader group={mockGroup} />)
    const leaveButton = screen.getByText(/leave group/i).closest('button')
    expect(leaveButton).toBeDisabled()
  })

  it('should show settings button for users with management permissions', () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '2', username: 'admin' },
      isAuthenticated: true,
    })
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    ;(storage.canUserManageSettings as jest.Mock).mockReturnValue(true)
    
    render(<GroupHeader group={mockGroup} />)
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
  })

  it('should display closed group badge', () => {
    const closedGroup = {
      ...mockGroup,
      type: 'closed' as const,
      visibility: { discoverable: true, content: 'members' },
    }
    render(<GroupHeader group={closedGroup} />)
    expect(screen.getByText(/closed group/i)).toBeInTheDocument()
  })

  it('should display secret group badge', () => {
    const secretGroup = {
      ...mockGroup,
      type: 'secret' as const,
      visibility: { discoverable: false, content: 'members' },
    }
    render(<GroupHeader group={secretGroup} />)
    expect(screen.getByText(/secret group/i)).toBeInTheDocument()
  })

  it('should show members-only notice when content is restricted', () => {
    const restrictedGroup = {
      ...mockGroup,
      visibility: { discoverable: true, content: 'members' },
    }
    render(<GroupHeader group={restrictedGroup} />)
    expect(screen.getByText(/join to unlock posts/i)).toBeInTheDocument()
  })

  it('should call onJoin when join button is clicked', async () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '2', username: 'user2' },
      isAuthenticated: true,
    })
    const onJoin = jest.fn()
    
    render(<GroupHeader group={mockGroup} onJoin={onJoin} />)
    
    const joinButton = screen.getByText(/join group/i)
    await userEvent.click(joinButton)
    
    await waitFor(() => {
      expect(onJoin).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should call onLeave when leave button is clicked', async () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '2', username: 'user2' },
      isAuthenticated: true,
    })
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    const onLeave = jest.fn()
    
    render(<GroupHeader group={mockGroup} onLeave={onLeave} />)
    
    const leaveButton = screen.getByText(/leave group/i)
    await userEvent.click(leaveButton)
    
    await waitFor(() => {
      expect(onLeave).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('should navigate to settings page when settings button is clicked', async () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '2', username: 'admin' },
      isAuthenticated: true,
    })
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    ;(storage.canUserManageSettings as jest.Mock).mockReturnValue(true)
    
    render(<GroupHeader group={mockGroup} />)
    
    const settingsLink = screen.getByText(/settings/i).closest('a')
    expect(settingsLink).toHaveAttribute('href', '/groups/golden-retriever-owners/settings')
  })

  it('should render without cover image', () => {
    const groupWithoutCover = { ...mockGroup, coverImage: undefined }
    render(<GroupHeader group={groupWithoutCover} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
  })

  it('should render without tags', () => {
    const groupWithoutTags = { ...mockGroup, tags: undefined }
    render(<GroupHeader group={groupWithoutTags} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
    expect(screen.queryByText('#golden-retriever')).not.toBeInTheDocument()
  })

  it('should not display stats when counts are zero', () => {
    const groupWithZeroCounts = { ...mockGroup, topicCount: 0, postCount: 0 }
    render(<GroupHeader group={groupWithZeroCounts} />)
    expect(screen.queryByText(/topics/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/posts/i)).not.toBeInTheDocument()
  })

  it('should show open group badge', () => {
    const openGroup = { ...mockGroup, type: 'open' as const }
    render(<GroupHeader group={openGroup} />)
    expect(screen.queryByText(/open group/i)).not.toBeInTheDocument()
    // Open groups don't display a badge
  })
})
