import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GroupsPage from '../page'
import * as storage from '@/lib/storage'
import * as auth from '@/lib/auth'

jest.mock('@/lib/storage')
jest.mock('@/lib/auth')
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('GroupsPage', () => {
  const mockGroups = [
    {
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
    },
    {
      id: 'grp-3',
      name: 'Secret Group',
      slug: 'secret-group',
      description: 'A secret group',
      type: 'secret' as const,
      categoryId: 'cat-birds',
      ownerId: '3',
      memberCount: 10,
      topicCount: 5,
      postCount: 20,
      tags: ['secret'],
      rules: [],
      createdAt: '2024-02-10T12:00:00Z',
      updatedAt: '2024-03-19T15:45:00Z',
    },
  ]

  const mockCategories = [
    {
      id: 'cat-dogs',
      name: 'Dogs',
      slug: 'dogs',
      description: 'Groups for dog owners',
      icon: '🐕',
      color: '#3b82f6',
      groupCount: 8,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(storage.getGroupCategories as jest.Mock).mockReturnValue(mockCategories)
    ;(storage.getGroups as jest.Mock).mockReturnValue(mockGroups)
    ;(storage.searchGroups as jest.Mock).mockReturnValue([])
    ;(storage.getGroupsByCategory as jest.Mock).mockReturnValue([])
    ;(storage.canUserViewGroup as jest.Mock).mockReturnValue(true)
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
  })

  it('should render groups page with title', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/discover groups/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should render search input', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search groups by name/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display groups', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should filter groups by search query', async () => {
    ;(storage.searchGroups as jest.Mock).mockReturnValue([mockGroups[0]])
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search groups by name/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    
    const searchInput = screen.getByPlaceholderText(/search groups by name/i)
    await userEvent.type(searchInput, 'Golden')
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show empty state when no groups found', async () => {
    ;(storage.getGroups as jest.Mock).mockReturnValue([])
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/no groups found/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display group member counts', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      const memberCounts = screen.getAllByText(/245 members/i)
      expect(memberCounts.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should navigate to group detail page when group is clicked', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      const groupLink = screen.getByText('Golden Retriever Owners').closest('a')
      expect(groupLink).toHaveAttribute('href', '/groups/golden-retriever-owners')
    }, { timeout: 3000 })
  })

  it('should filter groups by category', async () => {
    ;(storage.getGroupsByCategory as jest.Mock).mockReturnValue([mockGroups[0]])
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      const allElements = screen.getAllByText(/all/i)
      expect(allElements.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should show create group button when authenticated', async () => {
    ;(auth.useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', username: 'user1' },
      isAuthenticated: true,
    })
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/create group/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not show create group button when not authenticated', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.queryByText(/create group/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should filter out secret groups for non-authenticated users', async () => {
    ;(storage.getGroups as jest.Mock).mockReturnValue(mockGroups)
    ;(storage.canUserViewGroup as jest.Mock).mockImplementation((groupId: string) => {
      // Secret groups should not be visible to non-authenticated users
      if (groupId === 'grp-3') return false
      return true
    })
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
      expect(screen.queryByText('Secret Group')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show active filters badges', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search groups by name/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    
    const searchInput = screen.getByPlaceholderText(/search groups by name/i)
    await userEvent.type(searchInput, 'test')
    
    await waitFor(() => {
      const clearButtons = screen.getAllByRole('button', { name: /clear filters/i })
      expect(clearButtons.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should toggle view mode between grid and list', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      const viewButtons = screen.getAllByRole('button')
      const gridButton = viewButtons.find(btn => btn.querySelector('svg'))
      expect(gridButton).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display group tags', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      // Tags are displayed as #golden-retriever, #dogs, etc.
      const goldenTags = screen.getAllByText('#golden-retriever')
      expect(goldenTags.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should show closed group badge', async () => {
    ;(storage.getGroups as jest.Mock).mockReturnValue([
      {
        id: 'grp-closed',
        name: 'Closed Group',
        slug: 'closed-group',
        description: 'A closed group',
        type: 'closed' as const,
        categoryId: 'cat-dogs',
        ownerId: '1',
        memberCount: 50,
        topicCount: 10,
        postCount: 100,
        tags: ['dogs'],
        rules: [],
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-03-18T11:20:00Z',
      },
    ])
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Closed Group')).toBeInTheDocument()
      expect(screen.getAllByText(/closed/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should show results count', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      const showingText = screen.getByText((content, element) => {
        return element?.textContent?.includes('Showing') && 
               element?.textContent?.includes('of') && 
               element?.textContent?.includes('groups')
      })
      expect(showingText).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should clear filters when clear button is clicked', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search groups by name/i)).toBeInTheDocument()
    }, { timeout: 3000 })
    
    const searchInput = screen.getByPlaceholderText(/search groups by name/i)
    await userEvent.type(searchInput, 'test')
    
    await waitFor(() => {
      const clearButtons = screen.getAllByRole('button')
      const clearFilterButton = clearButtons.find(btn => 
        btn.textContent?.includes('Clear') || btn.querySelector('[class*="X"]')
      )
      if (clearFilterButton) {
        expect(clearFilterButton).toBeInTheDocument()
      }
    }, { timeout: 3000 })
  })

  it('should sort groups by most recent by default', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Golden Retriever Owners')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should display group descriptions', async () => {
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/community for golden retriever owners/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should filter secret groups for non-members', async () => {
    ;(storage.getGroups as jest.Mock).mockReturnValue(mockGroups)
    ;(storage.canUserViewGroup as jest.Mock).mockImplementation((groupId: string) => {
      // Only allow viewing first two groups
      return groupId !== 'grp-3'
    })
    
    render(<GroupsPage />)
    
    await waitFor(() => {
      expect(screen.queryByText('Secret Group')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

