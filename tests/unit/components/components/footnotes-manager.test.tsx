import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FootnotesManager } from "@/components/footnotes-manager"
import * as sourcesModule from "@/lib/sources"

// Mock the sources module
jest.mock("@/lib/sources", () => ({
  getSources: jest.fn(),
}))

describe("FootnotesManager", () => {
  const mockOnRemoveCitation = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(sourcesModule.getSources as jest.Mock).mockReturnValue([])
  })

  it("should not render when there are no citations", () => {
    const { container } = render(
      <FootnotesManager content="No citations here" onRemoveCitation={mockOnRemoveCitation} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("should display citations from content", () => {
    const content = `Some text [^1] with citation.

[^1]: https://example.com "Example Article"`

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    expect(screen.getByText("Footnotes (1)")).toBeInTheDocument()
    expect(screen.getByText("Example Article")).toBeInTheDocument()
  })

  it("should display citation needed tag", () => {
    const content = "Some text [^citation-needed] here."

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    expect(screen.getByText("Footnotes (1)")).toBeInTheDocument()
    expect(screen.getByText("Citation needed")).toBeInTheDocument()
  })

  it("should display multiple citations", () => {
    const content = `Text [^1] and more [^2] citations.

[^1]: https://example.com/1 "First Article"
[^2]: https://example.com/2 "Second Article"`

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    expect(screen.getByText("Footnotes (2)")).toBeInTheDocument()
    expect(screen.getByText("First Article")).toBeInTheDocument()
    expect(screen.getByText("Second Article")).toBeInTheDocument()
  })

  it("should show broken link badge for broken sources", () => {
    const mockSources = [
      {
        id: "1",
        title: "Broken Article",
        url: "https://example.com/broken",
        brokenAt: "2024-01-01T00:00:00Z",
      },
    ]

    ;(sourcesModule.getSources as jest.Mock).mockReturnValue(mockSources)

    const content = `Text [^1] with broken link.

[^1]: https://example.com/broken "Broken Article"`

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    expect(screen.getByText("Broken")).toBeInTheDocument()
    expect(screen.getByText("1 broken link")).toBeInTheDocument()
  })

  it("should call onRemoveCitation when remove button is clicked", async () => {
    const user = userEvent.setup()
    const content = `Text [^1] here.

[^1]: https://example.com "Article"`

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    const removeButtons = screen.getAllByTitle("Remove citation")
    await user.click(removeButtons[0])

    expect(mockOnRemoveCitation).toHaveBeenCalledWith("1")
  })

  it("should display source information from library", () => {
    const mockSources = [
      {
        id: "1",
        title: "Library Article",
        url: "https://example.com/library",
        publisher: "Test Publisher",
        date: "2024-01-01",
      },
    ]

    ;(sourcesModule.getSources as jest.Mock).mockReturnValue(mockSources)

    const content = `Text [^1] here.

[^1]: https://example.com/library "Library Article"`

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    expect(screen.getByText("Test Publisher")).toBeInTheDocument()
    expect(screen.getByText("Date: 2024-01-01")).toBeInTheDocument()
  })

  it("should sort citations numerically", () => {
    const content = `Text [^3] then [^1] then [^2].

[^1]: https://example.com/1 "First"
[^2]: https://example.com/2 "Second"
[^3]: https://example.com/3 "Third"`

    render(<FootnotesManager content={content} onRemoveCitation={mockOnRemoveCitation} />)

    const citations = screen.getAllByText(/First|Second|Third/)
    expect(citations[0]).toHaveTextContent("First")
    expect(citations[1]).toHaveTextContent("Second")
    expect(citations[2]).toHaveTextContent("Third")
  })
})

