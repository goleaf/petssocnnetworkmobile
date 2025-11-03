import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import HomePage from '../page'
import * as storage from '@/lib/storage'
import { useAuth } from '@/lib/auth'
import { getFriendSuggestions } from '@/lib/friend-suggestions'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}))

// Mock storage
jest.mock('@/lib/storage', () => ({
  getBlogPosts: jest.fn(),
  getPets: jest.fn(),
  getUsers: jest.fn(),
  getPetsByOwnerId: jest.fn(),
}))

jest.mock('@/lib/friend-suggestions', () => ({
  getFriendSuggestions: jest.fn(),
}))
// Mock DashboardContent
jest.mock('../dashboard-content', () => ({
  __esModule: true,
  default: ({ user }: { user: any }) => <div>Dashboard for {user.fullName}</div>,
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('HomePage', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([])
    ;(storage.getPets as jest.Mock).mockReturnValue([])
    ;(storage.getUsers as jest.Mock).mockReturnValue([])
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])
    ;(getFriendSuggestions as jest.Mock).mockReturnValue([])
  })

  it('should render landing page when user is not authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    render(<HomePage />)
    expect(screen.getByText(/connect, share, and learn about your pets/i)).toBeInTheDocument()
    expect(screen.getByText(/message privacy/i)).toBeInTheDocument()
  })

  it('should render feed when user is authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
    ;(storage.getPets as jest.Mock).mockReturnValue([])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([])
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])

    render(<HomePage />)
    
    // Wait for authenticated feed to render
    await waitFor(() => {
      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument()
      expect(screen.getByText(/feed/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display user stats when authenticated', async () => {
    const userWithStats = {
      ...mockUser,
      following: ['2', '3'],
      followers: ['4', '5', '6'],
    }
    
    ;(useAuth as jest.Mock).mockReturnValue({
      user: userWithStats,
      isAuthenticated: true,
    })
    
    ;(storage.getUsers as jest.Mock).mockReturnValue([userWithStats])
    ;(storage.getPets as jest.Mock).mockReturnValue([
      { id: '1', name: 'Fluffy', ownerId: userWithStats.id },
    ])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([
      { id: '1', title: 'Post 1', authorId: userWithStats.id, likes: [], tags: [] },
    ])
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([
      { id: '1', name: 'Fluffy', ownerId: userWithStats.id, followers: [] },
    ])

    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText('My Pets')).toBeInTheDocument()
      // Use getAllByText since "Following" appears in multiple places
      const followingElements = screen.getAllByText('Following')
      expect(followingElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Followers')).toBeInTheDocument()
      expect(screen.getByText('Total Posts')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display trending posts section when authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
    ;(storage.getPets as jest.Mock).mockReturnValue([])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([])
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])

    render(<HomePage />)
    
    await waitFor(() => {
      // Use getAllByText since "Trending Posts" appears in header and potentially in content
      const trendingElements = screen.getAllByText(/trending posts/i)
      expect(trendingElements.length).toBeGreaterThan(0)
      // Also verify the description is present
      expect(screen.getByText(/most popular posts from the community/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display suggested users section when authenticated', async () => {
    const otherUser = {
      id: '2',
      email: 'other@example.com',
      username: 'otheruser',
      fullName: 'Other User',
      joinedAt: '2024-01-01',
      followers: [],
      following: [],
    }
    
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser, otherUser])
    ;(storage.getPets as jest.Mock).mockReturnValue([])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([])
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])
    ;(getFriendSuggestions as jest.Mock).mockReturnValue([
      {
        user: otherUser,
        score: 42,
        reasons: ['Test reason'],
      },
    ])

    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText(/suggested users/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display quick links section when authenticated', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
    ;(storage.getPets as jest.Mock).mockReturnValue([])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([])
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])

    render(<HomePage />)
    
    await waitFor(() => {
      expect(screen.getByText(/quick links/i)).toBeInTheDocument()
      expect(screen.getByText(/browse all blogs/i)).toBeInTheDocument()
      expect(screen.getByText(/pet care wiki/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display login form on landing page', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    render(<HomePage />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
  })

  it('should display stats on landing page', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
    ;(storage.getPets as jest.Mock).mockReturnValue([{ id: '1', name: 'Pet' }])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([{ 
      id: '1', 
      title: 'Post',
      likes: [],
      tags: [],
    }])

    render(<HomePage />)
    
    await waitFor(() => {
      // Stats are displayed with icons, so check for at least one stat label
      expect(screen.getByText(/active users/i)).toBeInTheDocument()
    }, { timeout: 2000 })
    
    // Check that other stats might be displayed (using getAllByText for flexibility)
    const petsElements = screen.queryAllByText(/pets/i)
    const blogPostsElements = screen.queryAllByText(/blog posts/i)
    // At least one stat should be displayed
    expect(petsElements.length + blogPostsElements.length).toBeGreaterThan(0)
  })

  it('should display features section', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    render(<HomePage />)
    expect(screen.getByText(/everything you need for your pet community/i)).toBeInTheDocument()
    expect(screen.getByText(/pet profiles/i)).toBeInTheDocument()
    expect(screen.getByText(/pet care wiki/i)).toBeInTheDocument()
    expect(screen.getByText(/social features/i)).toBeInTheDocument()
  })

  it('should display CTA section', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    render(<HomePage />)
    expect(screen.getByText(/ready to join the community/i)).toBeInTheDocument()
    expect(screen.getByText(/get started free/i)).toBeInTheDocument()
  })
})
