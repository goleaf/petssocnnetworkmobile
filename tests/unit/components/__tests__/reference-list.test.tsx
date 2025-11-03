import { render, screen } from "@testing-library/react"
import { ReferenceList } from "@/components/reference-list"
import type { Citation, Source } from "@/lib/types"

describe("ReferenceList", () => {
  const mockSources: Source[] = [
    {
      id: "1",
      title: "Example Source 1",
      url: "https://example.com/1",
      publisher: "Example Publisher",
      date: "2024-01-01",
    },
    {
      id: "2",
      title: "Example Source 2",
      url: "https://example.com/2",
      brokenAt: new Date().toISOString(),
    },
  ]

  const mockCitations: Citation[] = [
    {
      id: "1",
      sourceId: "1",
      text: "Citation 1",
    },
    {
      id: "2",
      sourceId: "2",
      text: "Citation 2",
    },
    {
      id: "citation-needed",
      isCitationNeeded: true,
    },
  ]

  it("renders reference list with citations", () => {
    render(<ReferenceList citations={mockCitations} sources={mockSources} />)
    expect(screen.getByText("References")).toBeInTheDocument()
    // Component shows citation.text if available, otherwise source.title
    expect(screen.getByText("Citation 1")).toBeInTheDocument()
    expect(screen.getByText("Citation 2")).toBeInTheDocument()
    expect(screen.getByText("Example Publisher")).toBeInTheDocument()
  })

  it("shows broken link badge for broken sources", () => {
    render(<ReferenceList citations={mockCitations} sources={mockSources} />)
    expect(screen.getByText("Broken")).toBeInTheDocument()
    expect(screen.getByText("1 broken link")).toBeInTheDocument()
  })

  it("displays citation needed references", () => {
    render(<ReferenceList citations={mockCitations} sources={mockSources} />)
    expect(screen.getByText("Citation needed")).toBeInTheDocument()
  })

  it("does not render when citations array is empty", () => {
    const { container } = render(<ReferenceList citations={[]} sources={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

