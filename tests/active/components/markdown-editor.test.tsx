import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownEditor } from '@/components/markdown-editor'

// Mock react-markdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

describe('MarkdownEditor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with initial value', () => {
    render(<MarkdownEditor value="# Hello" onChange={mockOnChange} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('# Hello')
  })

  it('should call onChange when text is changed', async () => {
    const user = userEvent.setup()
    render(<MarkdownEditor value="" onChange={mockOnChange} />)
    const textarea = screen.getByRole('textbox')

    await user.type(textarea, 'Test content')
    expect(mockOnChange).toHaveBeenCalledTimes('Test content'.length)
  })

  it('should display placeholder text', () => {
    render(<MarkdownEditor value="" onChange={mockOnChange} placeholder="Enter markdown..." />)
    const textarea = screen.getByPlaceholderText('Enter markdown...')
    expect(textarea).toBeInTheDocument()
  })

  it('should switch to preview tab and show markdown content', async () => {
    render(<MarkdownEditor value="# Hello World" onChange={mockOnChange} />)
    
    const previewTab = screen.getByText(/preview/i)
    await userEvent.click(previewTab)

    await waitFor(() => {
      expect(screen.getByText('# Hello World')).toBeInTheDocument()
    })
  })

  it('should show placeholder message when preview is empty', async () => {
    render(<MarkdownEditor value="" onChange={mockOnChange} />)
    
    const previewTab = screen.getByText(/preview/i)
    await userEvent.click(previewTab)

    await waitFor(() => {
      expect(screen.getByText(/nothing to preview yet/i)).toBeInTheDocument()
    })
  })

  it('should insert bold markdown when bold button is clicked', async () => {
    render(<MarkdownEditor value="selected text" onChange={mockOnChange} />)
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(0, textarea.value.length)

    const boldButton = screen.getByTitle('Bold')
    await userEvent.click(boldButton)

    // Wait for the onChange to be called with the modified text
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  it('should insert italic markdown when italic button is clicked', async () => {
    render(<MarkdownEditor value="text" onChange={mockOnChange} />)
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(0, textarea.value.length)

    const italicButton = screen.getByTitle('Italic')
    await userEvent.click(italicButton)

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  it('should insert link markdown when link button is clicked', async () => {
    render(<MarkdownEditor value="link text" onChange={mockOnChange} />)
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    textarea.focus()
    textarea.setSelectionRange(0, textarea.value.length)

    const linkButton = screen.getByTitle('Link')
    await userEvent.click(linkButton)

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  it('should have all toolbar buttons', () => {
    render(<MarkdownEditor value="" onChange={mockOnChange} />)
    
    expect(screen.getByTitle('Bold')).toBeInTheDocument()
    expect(screen.getByTitle('Italic')).toBeInTheDocument()
    expect(screen.getByTitle('Link')).toBeInTheDocument()
    expect(screen.getByTitle('Bullet List')).toBeInTheDocument()
    expect(screen.getByTitle('Numbered List')).toBeInTheDocument()
    expect(screen.getByTitle('Image')).toBeInTheDocument()
    expect(screen.getByTitle('Code')).toBeInTheDocument()
  })

  it('should apply custom minHeight style', () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={mockOnChange} minHeight="500px" />
    )
    
    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveStyle({ minHeight: '500px' })
  })

  it('should switch between edit and preview tabs', async () => {
    render(<MarkdownEditor value="# Test" onChange={mockOnChange} />)
    
    // Initially in edit mode
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    
    // Switch to preview
    const previewTab = screen.getByText(/preview/i)
    await userEvent.click(previewTab)
    
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
    
    // Switch back to edit
    const editTab = screen.getByText(/edit/i)
    await userEvent.click(editTab)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })
})

