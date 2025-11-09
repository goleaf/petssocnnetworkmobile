import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileHeader from '@/components/profile/ProfileHeader'

const makeUser = () => ({
  id: 'u1',
  email: 'u1@example.com',
  username: 'testuser',
  fullName: 'Test User',
  joinedAt: '2023-06-15T00:00:00.000Z',
  followers: ['a', 'b', 'c'],
  following: ['x', 'y', 'z', 'w', 'q', 'r', 's'],
  avatar: '/avatar.png',
  coverPhoto: '/cover.jpg',
  location: 'Paris, France',
  badge: 'verified' as const,
})

describe('ProfileHeader', () => {
  it('renders name, @username, verified badge, location and join date', () => {
    const user = makeUser()
    render(<ProfileHeader user={user} isOwnProfile postsCount={12} />)

    // Name and @username
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText(`@${user.username}`)).toBeInTheDocument()

    // Verified badge
    expect(screen.getByLabelText(/Verified/i)).toBeInTheDocument()

    // Location
    expect(screen.getByText('Paris, France')).toBeInTheDocument()

    // Joined date label (matches component locale formatting)
    const d = new Date(user.joinedAt)
    const joined = `Member since ${d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
    expect(screen.getByText(joined)).toBeInTheDocument()
  })

  it('shows hover change overlays for own profile', async () => {
    const user = makeUser()
    render(<ProfileHeader user={user} isOwnProfile postsCount={0} />)

    // Overlay buttons are in the DOM when isOwnProfile=true
    expect(screen.getByRole('button', { name: /Change Photo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Change Cover/i })).toBeInTheDocument()
  })

  it('renders clickable counts linking to posts, followers, following', () => {
    const user = makeUser()
    const postsCount = 12
    render(<ProfileHeader user={user} isOwnProfile postsCount={postsCount} />)

    const postsLink = screen.getByRole('link', { name: /Posts/i })
    expect(postsLink).toHaveAttribute('href', `/user/${user.username}/posts`)

    const followersLink = screen.getByRole('link', { name: /Followers/i })
    expect(followersLink).toHaveAttribute('href', `/user/${user.username}/followers`)

    const followingLink = screen.getByRole('link', { name: /Following/i })
    expect(followingLink).toHaveAttribute('href', `/user/${user.username}/following`)
  })
})

