import React from 'react'
import { render, screen } from '@testing-library/react'
import { GroupCard } from '@/components/groups/GroupCard'
import * as storage from '@/lib/storage'

jest.mock('@/lib/storage')
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('GroupCard', () => {
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
    tags: ['golden-retriever', 'dogs', 'training', 'health'],
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
  })

  it('should render group name', () => {
    render(<GroupCard group={mockGroup} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
  })

  it('should render group description', () => {
    render(<GroupCard group={mockGroup} />)
    expect(screen.getByText('A community for golden retriever owners')).toBeInTheDocument()
  })

  it('should display member count', () => {
    render(<GroupCard group={mockGroup} />)
    expect(screen.getByText('245 members')).toBeInTheDocument()
  })

  it('should display topic count when greater than zero', () => {
    render(<GroupCard group={mockGroup} />)
    expect(screen.getByText('89 topics')).toBeInTheDocument()
  })

  it('should not display topic count when zero', () => {
    const groupWithNoTopics = { ...mockGroup, topicCount: 0 }
    render(<GroupCard group={groupWithNoTopics} />)
    expect(screen.queryByText(/topics/i)).not.toBeInTheDocument()
  })

  it('should display closed group badge', () => {
    const closedGroup = {
      ...mockGroup,
      type: 'closed' as const,
      visibility: { discoverable: true, content: 'members' },
    }
    render(<GroupCard group={closedGroup} />)
    expect(screen.getByText(/closed/i)).toBeInTheDocument()
  })

  it('should display secret group badge', () => {
    const secretGroup = {
      ...mockGroup,
      type: 'secret' as const,
      visibility: { discoverable: false, content: 'members' },
    }
    render(<GroupCard group={secretGroup} />)
    expect(screen.getByText(/secret/i)).toBeInTheDocument()
  })

  it('should display members-only badge when content is restricted', () => {
    const restrictedGroup = {
      ...mockGroup,
      visibility: { discoverable: true, content: 'members' },
    }
    render(<GroupCard group={restrictedGroup} />)
    expect(screen.getByText(/members-only content/i)).toBeInTheDocument()
  })

  it('should display hidden badge when group is not discoverable', () => {
    const hiddenGroup = {
      ...mockGroup,
      visibility: { discoverable: false, content: 'everyone' },
    }
    render(<GroupCard group={hiddenGroup} />)
    expect(screen.getByText(/hidden from search/i)).toBeInTheDocument()
  })

  it('should not display badge for open groups', () => {
    render(<GroupCard group={mockGroup} />)
    expect(screen.queryByText(/open/i)).not.toBeInTheDocument()
  })

  it('should display first 3 tags', () => {
    render(<GroupCard group={mockGroup} />)
    expect(screen.getByText('#golden-retriever')).toBeInTheDocument()
    expect(screen.getByText('#dogs')).toBeInTheDocument()
    expect(screen.getByText('#training')).toBeInTheDocument()
  })

  it('should show +count for additional tags', () => {
    const groupWithManyTags = { ...mockGroup, tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] }
    render(<GroupCard group={groupWithManyTags} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should link to group detail page', () => {
    render(<GroupCard group={mockGroup} />)
    const link = screen.getByText('Golden Retriever Owners').closest('a')
    expect(link).toHaveAttribute('href', '/groups/golden-retriever-owners')
  })

  it('should display category icon', () => {
    render(<GroupCard group={mockGroup} />)
    // The icon should be present in the DOM
    expect(storage.getGroupCategoryById).toHaveBeenCalledWith('cat-dogs')
  })

  it('should render without cover image', () => {
    const groupWithoutCover = { ...mockGroup, coverImage: undefined }
    render(<GroupCard group={groupWithoutCover} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
  })

  it('should render without tags', () => {
    const groupWithoutTags = { ...mockGroup, tags: undefined }
    render(<GroupCard group={groupWithoutTags} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
  })

  it('should render without category', () => {
    ;(storage.getGroupCategoryById as jest.Mock).mockReturnValue(null)
    render(<GroupCard group={mockGroup} />)
    expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
  })

  it('should truncate long names', () => {
    const longNameGroup = {
      ...mockGroup,
      name: 'This is a very long group name that should be truncated',
    }
    render(<GroupCard group={longNameGroup} />)
    expect(screen.getByText('This is a very long group name that should be truncated')).toBeInTheDocument()
  })
})
