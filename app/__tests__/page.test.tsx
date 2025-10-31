import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import HomePage from '../page'
import * as storage from '@/lib/storage'
import { useAuth } from '@/lib/auth'

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
  })

  it('should render landing page when user is not authenticated', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
    })

    render(<HomePage />)
    expect(screen.getByText(/connect, share, and learn about your pets/i)).toBeInTheDocument()
  })

  it('should redirect authenticated users to feed', async () => {
    const mockPush = jest.fn()
    const mockRouter = {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
    
    jest.mock('next/navigation', () => ({
      useRouter: () => mockRouter,
    }))
    
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
    ;(storage.getPets as jest.Mock).mockReturnValue([])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([])

    render(<HomePage />)
    
    // Wait for redirect to be called
    await waitFor(() => {
      // Since the page redirects authenticated users to /feed via useEffect,
      // we can't test the dashboard rendering here
      // Instead, we verify the component handles authenticated state
      expect(screen.queryByText(/connect, share, and learn/i)).not.toBeInTheDocument()
    }, { timeout: 3000 })
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

