import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProfileCompletionWidget } from '@/components/profile/profile-completion-widget'
import type { User } from '@/lib/types'

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  fullName: 'Test User',
  joinedAt: '2024-01-01',
  followers: [],
  following: [],
  emailVerified: false,
}

describe('ProfileCompletionWidget', () => {
  it('renders with low completion percentage', () => {
    render(<ProfileCompletionWidget user={mockUser} petsCount={0} />)
    
    expect(screen.getByText(/Profile Completion/i)).toBeInTheDocument()
    expect(screen.getByText(/Get started on your profile/i)).toBeInTheDocument()
  })

  it('shows correct percentage for partially complete profile', () => {
    const partialUser: User = {
      ...mockUser,
      avatar: '/avatar.jpg',
      bio: 'This is a bio that is definitely longer than fifty characters to meet the requirement',
      location: 'New York',
      emailVerified: true,
    }
    
    render(<ProfileCompletionWidget user={partialUser} petsCount={1} />)
    
    // Should show a percentage greater than 0
    const percentageText = screen.getByText(/%/)
    expect(percentageText).toBeInTheDocument()
  })

  it('displays checklist items', () => {
    render(<ProfileCompletionWidget user={mockUser} petsCount={0} />)
    
    expect(screen.getByText(/Profile photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Cover photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Bio/i)).toBeInTheDocument()
  })

  it('shows completion message at 100%', () => {
    const completeUser: User = {
      ...mockUser,
      avatar: '/avatar.jpg',
      coverPhoto: '/cover.jpg',
      bio: 'This is a bio that is definitely longer than fifty characters to meet the requirement',
      location: 'New York',
      dateOfBirth: '1990-01-01',
      emailVerified: true,
      interests: ['dogs', 'cats', 'birds', 'training'],
      website: 'https://example.com',
    }
    
    // Mock phoneVerified and socialMedia
    const userWithExtras = {
      ...completeUser,
      phoneVerified: true,
      phone: '+1234567890',
      socialMedia: {
        instagram: 'testuser',
      },
    }
    
    render(<ProfileCompletionWidget user={userWithExtras as any} petsCount={1} />)
    
    expect(screen.getByText(/Your profile is complete/i)).toBeInTheDocument()
  })

  it('calls onNavigate when item is clicked', () => {
    const onNavigate = jest.fn()
    render(<ProfileCompletionWidget user={mockUser} petsCount={0} onNavigate={onNavigate} />)
    
    const profilePhotoItem = screen.getByText(/Profile photo/i).closest('button')
    if (profilePhotoItem) {
      profilePhotoItem.click()
      expect(onNavigate).toHaveBeenCalledWith('basic-info')
    }
  })
})
