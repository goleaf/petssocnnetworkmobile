import React from 'react'
import { render, screen } from '@testing-library/react'
import { BadgeDisplay } from '../badge-display'
import type { User } from '@/lib/types'

describe('BadgeDisplay', () => {
  const baseUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  it('should return null when user has no badge', () => {
    const { container } = render(<BadgeDisplay user={baseUser} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render verified badge (legacy)', () => {
    const user: User = { ...baseUser, badge: 'verified' }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Verified')).toBeInTheDocument()
  })

  it('should render pro badge (legacy)', () => {
    const user: User = { ...baseUser, badge: 'pro' }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Pro Member')).toBeInTheDocument()
  })

  it('should render shelter badge (legacy)', () => {
    const user: User = { ...baseUser, badge: 'shelter' }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Shelter Sponsor')).toBeInTheDocument()
  })

  it('should render vet badge', () => {
    const user: User = { ...baseUser, badges: ['vet'] }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Vet')).toBeInTheDocument()
  })

  it('should render trainer badge', () => {
    const user: User = { ...baseUser, badges: ['trainer'] }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Trainer')).toBeInTheDocument()
  })

  it('should render shelter badge', () => {
    const user: User = { ...baseUser, badges: ['shelter'] }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Shelter')).toBeInTheDocument()
  })

  it('should render top contributor badge', () => {
    const user: User = { ...baseUser, badges: ['top-contributor'] }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Top Contributor')).toBeInTheDocument()
  })

  it('should render multiple badges', () => {
    const user: User = { ...baseUser, badges: ['vet', 'trainer', 'top-contributor'] }
    render(<BadgeDisplay user={user} />)
    expect(screen.getByTitle('Vet')).toBeInTheDocument()
    expect(screen.getByTitle('Trainer')).toBeInTheDocument()
    expect(screen.getByTitle('Top Contributor')).toBeInTheDocument()
  })

  it('should apply size classes', () => {
    const user: User = { ...baseUser, badges: ['vet'] }
    const { rerender } = render(<BadgeDisplay user={user} size="sm" />)
    expect(screen.getByTitle('Vet')).toBeInTheDocument()
    
    rerender(<BadgeDisplay user={user} size="md" />)
    expect(screen.getByTitle('Vet')).toBeInTheDocument()
    
    rerender(<BadgeDisplay user={user} size="lg" />)
    expect(screen.getByTitle('Vet')).toBeInTheDocument()
  })

  it('should render badge variant', () => {
    const user: User = { ...baseUser, badges: ['vet'] }
    render(<BadgeDisplay user={user} variant="badge" />)
    expect(screen.getByText('Vet')).toBeInTheDocument()
  })
})

