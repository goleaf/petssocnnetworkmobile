import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import TagPage from '../page'
import * as storage from '@/lib/storage'
import { act } from 'react'

jest.mock('@/lib/storage')
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('TagPage', () => {
  const mockPosts = [
    {
      id: '1',
      title: 'Test Post 1',
      content: 'Test content 1',
      petId: 'pet1',
      authorId: 'user1',
      createdAt: new Date().toISOString(),
      likes: ['user2'],
      tags: ['adventure', 'funny', 'toys'],
      hashtags: ['#test'],
      coverImage: '/test1.jpg',
    },
    {
      id: '2',
      title: 'Test Post 2',
      content: 'Test content 2',
      petId: 'pet2',
      authorId: 'user2',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      likes: ['user1', 'user3'],
      tags: ['training', 'photo'],
      hashtags: ['#training'],
      coverImage: '/test2.jpg',
    },
    {
      id: '3',
      title: 'Test Post 3',
      content: 'Test content 3',
      petId: 'pet1',
      authorId: 'user1',
      createdAt: new Date().toISOString(),
      likes: [],
      tags: ['toys', 'games'],
      hashtags: [],
      coverImage: undefined,
    },
  ]

  const mockPets = [
    { id: 'pet1', name: 'Pet 1', avatar: '/pet1.jpg' },
    { id: 'pet2', name: 'Pet 2', avatar: '/pet2.jpg' },
  ]

  const mockUsers = [
    { id: 'user1', fullName: 'User 1' },
    { id: 'user2', fullName: 'User 2' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(storage.getBlogPosts as jest.Mock).mockReturnValue(mockPosts)
    ;(storage.getPets as jest.Mock).mockReturnValue(mockPets)
    ;(storage.getUsers as jest.Mock).mockReturnValue(mockUsers)
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should show loading spinner initially', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    // Should show spinner initially (before timer completes)
    // We'll check for the Loader2 icon which is in the spinner
    const spinner = screen.getByRole('status', { hidden: true })
    expect(spinner).toBeInTheDocument()
  })

  it('should display tag name and post count after loading', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    // Fast-forward time to complete the setTimeout
    await act(async () => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      // Use getAllByText since toys appears multiple times (title and badges)
      expect(screen.getAllByText('toys').length).toBeGreaterThan(0)
      expect(screen.getByText(/2 posts with this tag/i)).toBeInTheDocument()
    })
  })

  it('should filter posts by tag', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('Test Post 3')).toBeInTheDocument()
      expect(screen.queryByText('Test Post 2')).not.toBeInTheDocument()
    })
  })

  it('should display empty state when no posts match', async () => {
    const mockParams = Promise.resolve({ tag: 'nonexistent' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      expect(screen.getByText(/no posts found with this tag/i)).toBeInTheDocument()
    })
  })

  it('should handle URL encoded tags', async () => {
    const mockParams = Promise.resolve({ tag: 'toys%20and%20games' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      expect(screen.getByText('toys and games')).toBeInTheDocument()
    })
  })

  it('should display pet information for each post', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      expect(screen.getAllByText('Pet 1').length).toBeGreaterThan(0)
      expect(screen.getAllByText(/by user 1/i).length).toBeGreaterThan(0)
    })
  })

  it('should display post likes count', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      const likesElements = screen.getAllByText('1')
      expect(likesElements.length).toBeGreaterThan(0)
    })
  })

  it('should navigate to post detail page when post is clicked', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      const postLink = screen.getByText('Test Post 1').closest('a')
      expect(postLink).toHaveAttribute('href', '/blog/1')
    })
  })

  it('should highlight matching tag in badges', async () => {
    const mockParams = Promise.resolve({ tag: 'toys' })
    
    await act(async () => {
      render(<TagPage params={mockParams} />)
    })
    
    act(() => {
      jest.advanceTimersByTime(100)
    })
    
    await waitFor(() => {
      // Check that the toy tag appears in the badges
      const toyBadges = screen.getAllByText('toys')
      expect(toyBadges.length).toBeGreaterThan(1)
    })
  })
})

