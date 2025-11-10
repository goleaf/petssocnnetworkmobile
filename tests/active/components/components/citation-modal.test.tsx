import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CitationModal } from "@/components/citation-modal"
import * as sourcesModule from "@/lib/sources"

// Mock the sources module
jest.mock("@/lib/sources", () => ({
  getSources: jest.fn(),
  createOrUpdateSource: jest.fn(),
  getSourceByUrl: jest.fn(),
}))

describe("CitationModal", () => {
  const mockOnInsert = jest.fn()
  const mockOnOpenChange = jest.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onInsert: mockOnInsert,
    content: "",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(sourcesModule.getSources as jest.Mock).mockReturnValue([])
    ;(sourcesModule.getSourceByUrl as jest.Mock).mockReturnValue(undefined)
  })

  it("should render when open", () => {
    render(<CitationModal {...defaultProps} />)
    expect(screen.getByText("Add Citation")).toBeInTheDocument()
    expect(screen.getByText("Source Library")).toBeInTheDocument()
    expect(screen.getByText("New Source")).toBeInTheDocument()
  })

  it("should not render when closed", () => {
    render(<CitationModal {...defaultProps} open={false} />)
    expect(screen.queryByText("Add Citation")).not.toBeInTheDocument()
  })

  it("should display sources from library", () => {
    const mockSources = [
      {
        id: "1",
        title: "Test Article",
        url: "https://example.com/article",
        publisher: "Test Publisher",
      },
      {
        id: "2",
        title: "Another Article",
        url: "https://example.com/another",
      },
    ]

    ;(sourcesModule.getSources as jest.Mock).mockReturnValue(mockSources)

    render(<CitationModal {...defaultProps} />)
    expect(screen.getByText("Test Article")).toBeInTheDocument()
    expect(screen.getByText("Another Article")).toBeInTheDocument()
  })

  it("should allow searching sources", async () => {
    const user = userEvent.setup()
    const mockSources = [
      {
        id: "1",
        title: "Test Article",
        url: "https://example.com/article",
      },
      {
        id: "2",
        title: "Different Article",
        url: "https://example.com/different",
      },
    ]

    ;(sourcesModule.getSources as jest.Mock).mockReturnValue(mockSources)

    render(<CitationModal {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText("Search sources...")
    await user.type(searchInput, "Test")

    expect(screen.getByText("Test Article")).toBeInTheDocument()
    expect(screen.queryByText("Different Article")).not.toBeInTheDocument()
  })

  it("should allow creating new source", async () => {
    const user = userEvent.setup()
    const mockSource = {
      id: "new-1",
      title: "New Article",
      url: "https://example.com/new",
    }

    ;(sourcesModule.getSourceByUrl as jest.Mock).mockReturnValue(undefined)
    ;(sourcesModule.createOrUpdateSource as jest.Mock).mockReturnValue(mockSource)
    ;(sourcesModule.getSources as jest.Mock).mockReturnValueOnce([]).mockReturnValueOnce([mockSource])

    render(<CitationModal {...defaultProps} />)

    // Switch to New Source tab
    await user.click(screen.getByText("New Source"))

    // Fill in the form
    const urlInput = screen.getByPlaceholderText("https://example.com/article")
    await user.type(urlInput, "https://example.com/new")

    const titleInput = screen.getByPlaceholderText("Article Title (optional, defaults to URL)")
    await user.type(titleInput, "New Article")

    // Click add button
    const addButton = screen.getByText("Add to Library")
    await user.click(addButton)

    expect(sourcesModule.createOrUpdateSource).toHaveBeenCalledWith({
      url: "https://example.com/new",
      title: "New Article",
      publisher: undefined,
      date: undefined,
    })
  })

  it("should insert citation needed tag", async () => {
    const user = userEvent.setup()
    render(<CitationModal {...defaultProps} />)

    // Check citation needed checkbox
    const checkbox = screen.getByLabelText(/Insert "citation needed" tag instead/)
    await user.click(checkbox)

    // Click insert button
    const insertButton = screen.getByText("Insert Citation")
    await user.click(insertButton)

    expect(mockOnInsert).toHaveBeenCalledWith("[^citation-needed]")
  })

  it("should insert citation with source", async () => {
    const user = userEvent.setup()
    const mockSources = [
      {
        id: "1",
        title: "Test Article",
        url: "https://example.com/article",
      },
    ]

    ;(sourcesModule.getSources as jest.Mock).mockReturnValue(mockSources)

    render(<CitationModal {...defaultProps} content="Some text [^1] here" />)

    // Select a source
    const sourceButton = screen.getByText("Test Article")
    await user.click(sourceButton)

    // Click insert button
    const insertButton = screen.getByText("Insert Citation")
    await user.click(insertButton)

    await waitFor(() => {
      expect(mockOnInsert).toHaveBeenCalled()
      const callArgs = mockOnInsert.mock.calls[0][0]
      expect(callArgs).toMatch(/\[\^2\]/)
      expect(callArgs).toContain("https://example.com/article")
    })
  })

  it("should close modal on cancel", async () => {
    const user = userEvent.setup()
    render(<CitationModal {...defaultProps} />)

    const cancelButton = screen.getByText("Cancel")
    await user.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})

