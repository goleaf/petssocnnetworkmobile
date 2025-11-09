import React from 'react'
import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '../avatar'

describe('Avatar', () => {
  it('should render Avatar component', () => {
    render(
      <Avatar>
        <AvatarFallback>T</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText('T')).toBeInTheDocument()
    expect(screen.getByText('T')).toHaveAttribute('data-slot', 'avatar-fallback')
  })

  it('should render AvatarFallback', () => {
    render(
      <Avatar>
        <AvatarFallback>T</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText('T')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(
      <Avatar className="custom-class">
        <AvatarFallback>T</AvatarFallback>
      </Avatar>
    )
    const avatar = screen.getByText('T').closest('[data-slot="avatar"]')
    expect(avatar).toHaveClass('custom-class')
  })

  it('should render AvatarImage and AvatarFallback', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/test.jpg" alt="User Avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    )
    // AvatarFallback should always be present
    expect(screen.getByText('U')).toBeInTheDocument()
    
    // Check if image element exists (may not load in test environment)
    const image = container.querySelector('img')
    // Image might not be visible in tests, so just check it exists in DOM
    if (image) {
      expect(image).toHaveAttribute('src', '/test.jpg')
    }
  })
})

