import { render, screen } from "@testing-library/react"
import { CitationRenderer, InlineCitation } from "@/components/citation-renderer"
import type { Citation, Source } from "@/lib/types"

describe("CitationRenderer", () => {
  const mockSource: Source = {
    id: "1",
    title: "Example Source",
    url: "https://example.com",
    publisher: "Example Publisher",
    date: "2024-01-01",
  }

  const mockCitation: Citation = {
    id: "1",
    sourceId: "1",
    text: "Example citation",
  }

  const mockCitationNeeded: Citation = {
    id: "citation-needed",
    isCitationNeeded: true,
  }

  describe("InlineCitation", () => {
    it("renders numbered citation correctly", () => {
      render(<InlineCitation citation={mockCitation} sources={[mockSource]} index={1} />)
      expect(screen.getByText("[1]")).toBeInTheDocument()
    })

    it("renders citation needed tag correctly", () => {
      render(
        <InlineCitation citation={mockCitationNeeded} sources={[]} index={0} />
      )
      expect(screen.getByText(/citation needed/i)).toBeInTheDocument()
    })

    it("shows broken link indicator when source is broken", () => {
      const brokenSource: Source = {
        ...mockSource,
        brokenAt: new Date().toISOString(),
      }
      render(
        <InlineCitation citation={mockCitation} sources={[brokenSource]} index={1} />
      )
      expect(screen.getByText("[1]")).toBeInTheDocument()
    })
  })
})

