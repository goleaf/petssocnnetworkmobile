import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// Mock next/navigation to provide useParams and a lightweight router
jest.mock('next/navigation', () => {
  return {
    useParams: () => ({ username: 'sarahpaws' }),
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
    }),
  }
})

// Mock storage accessors used by the page
jest.mock('@/lib/storage', () => ({
  getUserByUsername: jest.fn((username: string) => ({
    id: 'u-123',
    email: 'sarah@example.com',
    username: 'sarahpaws',
    fullName: 'Sarah Paws',
    joinedAt: '2022-01-05T00:00:00.000Z',
    followers: ['a'],
    following: ['b', 'c'],
    avatar: '/avatar.png',
    coverPhoto: '/cover.png',
    location: 'Seattle, USA',
  })),
  getBlogPosts: jest.fn(() => ([
    { id: 'p1', authorId: 'u-123', content: 'Hello', createdAt: '2023-01-01T00:00:00.000Z' },
    { id: 'p2', authorId: 'u-123', content: 'World', createdAt: '2023-02-01T00:00:00.000Z' },
  ])),
}))

// Mock auth store hook to avoid hitting network
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, initialize: jest.fn() }),
}))

import ProfilePage from '@/app/profile/[username]/page'

describe('/profile/[username] page', () => {
  it('renders profile header with name and @username', async () => {
    render(<ProfilePage />)

    // Wait for effect to load user
    await waitFor(() => expect(screen.getByText('Sarah Paws')).toBeInTheDocument())
    expect(screen.getByText('@sarahpaws')).toBeInTheDocument()
  })
})
