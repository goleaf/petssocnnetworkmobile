import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { CreatePostButton } from '@/components/posts/CreatePostButton'

// Mock the PostComposerModal component
jest.mock('@/components/posts/PostComposerModal', () => ({
  PostComposerModal: () => <div data-testid="post-composer-modal">Modal</div>
}))

describe('CreatePostButton', () => {
  it('renders without errors', () => {
    render(<CreatePostButton />)
    const button = screen.getByRole('button', { name: /create post/i })
    expect(button).toBeInTheDocument()
  })

  it('renders with custom label', () => {
    render(<CreatePostButton label="New Post" />)
    const button = screen.getByText('New Post')
    expect(button).toBeInTheDocument()
  })

  it('renders icon-only variant', () => {
    render(<CreatePostButton iconOnly />)
    const button = screen.getByRole('button', { name: /create post/i })
    expect(button).toBeInTheDocument()
    // Icon-only should not have text
    expect(button).not.toHaveTextContent('Post')
  })

  it('uses React hooks correctly without ReferenceError', () => {
    // This test verifies that the component can be rendered
    // which confirms hooks are used correctly (no ReferenceError)
    expect(() => {
      render(<CreatePostButton />)
    }).not.toThrow()
  })
})
