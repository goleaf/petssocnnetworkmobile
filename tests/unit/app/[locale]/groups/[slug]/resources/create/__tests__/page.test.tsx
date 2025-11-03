import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateResourcePage from '../page'
import * as storage from '@/lib/storage'

const pushMock = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}))

const translationMap: Record<string, string> = {
  'GroupResources.Create.formTitle': 'Share a resource with your group',
  'GroupResources.Create.formDescription': 'Provide helpful links that everyone can access.',
  'GroupResources.Create.titleLabel': 'Resource title',
  'GroupResources.Create.titlePlaceholder': 'Enter a descriptive title',
  'GroupResources.Create.typeLabel': 'Resource type',
  'GroupResources.Create.typePlaceholder': 'Select a resource type',
  'GroupResources.Create.typeOptions.link': 'Link',
  'GroupResources.Create.typeOptions.file': 'File',
  'GroupResources.Create.typeOptions.note': 'Note',
  'GroupResources.Create.typeDescriptions.link': 'Share an external link',
  'GroupResources.Create.typeDescriptions.file': 'Reference a hosted file',
  'GroupResources.Create.typeDescriptions.note': 'Create an internal note',
  'GroupResources.Create.urlLabel': 'Resource URL',
  'GroupResources.Create.urlPlaceholder': 'https://example.com/resource',
  'GroupResources.Create.descriptionLabel': 'Description',
  'GroupResources.Create.descriptionPlaceholder': 'Add context or instructions',
  'GroupResources.Create.tagsLabel': 'Tags',
  'GroupResources.Create.tagsPlaceholder': 'Add a keyword and press Enter',
  'GroupResources.Create.tagsHelper': 'Use up to 10 short tags.',
  'GroupResources.Create.addTag': 'Add tag',
  'GroupResources.Create.removeTag': 'Remove {tag}',
  'GroupResources.Create.submit': 'Share resource',
  'GroupResources.Create.saving': 'Saving...',
  'GroupResources.Create.accessDeniedTitle': 'Access denied',
  'GroupResources.Create.accessDeniedDescription': 'You must be signed in.',
  'GroupResources.Create.permissionDeniedTitle': 'Permission required',
  'GroupResources.Create.permissionDeniedDescription': 'Only members can share resources.',
  'GroupResources.Create.backToResources': 'Back to group resources',
  'Common.cancel': 'Cancel',
}

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, string>) => {
    const lookupKey = `${namespace}.${key}`
    const template = translationMap[lookupKey] ?? lookupKey
    if (!values) return template
    return template.replace(/\{(\w+)\}/g, (_, token) => values[token] ?? `{${token}}`)
  },
}))

jest.mock('@/lib/storage')
jest.mock('@/lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('CreateResourcePage', () => {
  const mockGroup = {
    id: 'group-1',
    slug: 'golden-retriever-adventures',
    name: 'Golden Retriever Adventures',
  }

  const mockUser = {
    id: 'user-1',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReset()
    ;(storage.getGroupBySlug as jest.Mock).mockReturnValue(mockGroup)
    ;(storage.canUserViewGroup as jest.Mock).mockReturnValue(true)
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(true)
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })
  })

  const renderPage = async () => {
    await act(async () => {
      render(<CreateResourcePage params={Promise.resolve({ slug: mockGroup.slug })} />)
    })
    await waitFor(() => {
      expect(screen.getByText('Share a resource with your group')).toBeInTheDocument()
    })
  }

  it('creates a new group resource from the form input', async () => {
    await renderPage()

    const titleInput = screen.getByPlaceholderText('Enter a descriptive title')
    await userEvent.type(titleInput, 'Vaccination schedule')

    const urlInput = screen.getByPlaceholderText('https://example.com/resource')
    await userEvent.clear(urlInput)
    await userEvent.type(urlInput, 'https://example.com/vet-guide')

    const descriptionInput = screen.getByPlaceholderText('Add context or instructions')
    await userEvent.type(descriptionInput, 'Clinic recommendations and dosage reminders.')

    const tagsInput = screen.getByPlaceholderText('Add a keyword and press Enter')
    await userEvent.type(tagsInput, 'health{enter}')

    const submitButton = screen.getByRole('button', { name: 'Share resource' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(storage.addGroupResource).toHaveBeenCalledTimes(1)
    })

    expect(storage.addGroupResource).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: mockGroup.id,
        title: 'Vaccination schedule',
        url: 'https://example.com/vet-guide',
        type: 'link',
        tags: ['health'],
        createdBy: mockUser.id,
      }),
    )

    expect(pushMock).toHaveBeenCalledWith('/groups/golden-retriever-adventures?tab=resources')
  })

  it('blocks resource creation for non-members', async () => {
    ;(storage.isUserMemberOfGroup as jest.Mock).mockReturnValue(false)

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    })

    await act(async () => {
      render(<CreateResourcePage params={Promise.resolve({ slug: mockGroup.slug })} />)
    })

    await waitFor(() => {
      expect(screen.getByText('Permission required')).toBeInTheDocument()
    })

    expect(screen.getByText('Only members can share resources.')).toBeInTheDocument()
    expect(storage.addGroupResource).not.toHaveBeenCalled()
  })
})


