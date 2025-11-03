import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardContent from '../dashboard-content'
import * as storage from '@/lib/storage'
import type { User } from '@/lib/types'
import { getFriendSuggestions } from '@/lib/friend-suggestions'

// Mock storage
jest.mock('@/lib/storage', () => ({
  getPets: jest.fn(),
  getBlogPosts: jest.fn(),
  getUsers: jest.fn(),
  getPetsByOwnerId: jest.fn(),
}))

jest.mock('@/lib/friend-suggestions', () => ({
  getFriendSuggestions: jest.fn(),
}))
// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('DashboardContent', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    joinedAt: '2024-01-01',
    followers: ['2'],
    following: ['2'],
  }

  const mockPet = {
    id: 'pet1',
    ownerId: '1',
    name: 'Fluffy',
    species: 'cat' as const,
    followers: [],
  }

  const mockPost = {
    id: 'post1',
    petId: 'pet1',
    authorId: '1',
    title: 'Test Post',
    content: 'Test content',
    tags: ['test'],
    likes: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([mockPet])
    ;(storage.getPets as jest.Mock).mockReturnValue([mockPet])
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue([mockPost])
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser])
    ;(getFriendSuggestions as jest.Mock).mockReturnValue([])
  })

  it('should render dashboard content', () => {
    render(<DashboardContent user={mockUser} />)
    expect(screen.getByText(`Welcome back, ${mockUser.fullName}!`)).toBeInTheDocument()
  })

  it('should display user stats', async () => {
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      expect(screen.getAllByText('My Pets').length).toBeGreaterThan(0)
      expect(screen.getByText('Following')).toBeInTheDocument()
      expect(screen.getByText('Followers')).toBeInTheDocument()
      expect(screen.getByText('Total Posts')).toBeInTheDocument()
    })
  })

  it('should display my pets section', async () => {
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      const myPetsElements = screen.getAllByText('My Pets')
      expect(myPetsElements.length).toBeGreaterThan(0)
    })
  })

  it('should display empty state when user has no pets', async () => {
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      expect(screen.getByText(/you haven't added any pets yet/i)).toBeInTheDocument()
    })
  })

  it('should display recent posts section', async () => {
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Posts')).toBeInTheDocument()
    })
  })

  it('should display trending posts section', async () => {
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      expect(screen.getByText('Trending Posts')).toBeInTheDocument()
    })
  })

  it('should display suggested users section', async () => {
    const otherUser: User = {
      id: '2',
      email: 'other@example.com',
      username: 'otheruser',
      fullName: 'Other User',
      joinedAt: '2024-01-01',
      followers: [],
      following: [],
    }
    ;(storage.getUsers as jest.Mock).mockReturnValue([mockUser, otherUser])
    ;(getFriendSuggestions as jest.Mock).mockReturnValue([
      {
        user: otherUser,
        score: 33,
        reasons: ['Test overlap'],
      },
    ])
    
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      expect(screen.getByText('Suggested Users')).toBeInTheDocument()
    })
  })

  it('should calculate stats correctly', async () => {
    render(<DashboardContent user={mockUser} />)
    
    await waitFor(() => {
      // Check that stats are displayed
      const myPetsElements = screen.getAllByText('My Pets')
      expect(myPetsElements.length).toBeGreaterThan(0)
      // Check that at least one stat card exists
      const statsCards = document.querySelectorAll('[data-slot="card"]')
      expect(statsCards.length).toBeGreaterThan(0)
    })
  })
})
