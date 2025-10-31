import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import * as storage from '@/lib/storage'
import * as drafts from '@/lib/drafts'
import { useAuth } from '@/lib/auth'

const mockPush = jest.fn()

jest.mock('@/lib/storage')
jest.mock('@/lib/drafts')
jest.mock('@/lib/auth')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}))
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})
jest.mock('@/components/markdown-editor', () => ({
  MarkdownEditor: () => <div data-testid="markdown-editor">Markdown Editor</div>,
}))
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

// Import after mocks are set up
import CreateBlogPage from '../page'

describe('CreateBlogPage', () => {
  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    username: 'testuser',
    fullName: 'Test User',
    joinedAt: '2024-01-01',
    followers: [],
    following: [],
  }

  const mockPets = [
    { id: 'pet1', name: 'Pet 1', avatar: '/pet1.jpg', ownerId: 'user1' },
    { id: 'pet2', name: 'Pet 2', avatar: '/pet2.jpg', ownerId: 'user1' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue(mockPets)
    ;(drafts.getDraftsByUserId as jest.Mock).mockReturnValue([])
    ;(drafts.saveDraft as jest.Mock).mockImplementation(() => {})
    ;(drafts.deleteDraft as jest.Mock).mockImplementation(() => {})
    ;(storage.addBlogPost as jest.Mock).mockImplementation(() => {})
  })

  it('should show message when user has no pets', async () => {
    ;(storage.getPetsByOwnerId as jest.Mock).mockReturnValue([])

    render(<CreateBlogPage />)

    await waitFor(() => {
      expect(screen.getByText(/you need to add a pet before creating a blog post/i)).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
