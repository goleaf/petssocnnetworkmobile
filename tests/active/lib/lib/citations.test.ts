import {
  parseCitationsFromMarkdown,
  renderCitationsInText,
  validateSources,
} from "@/lib/citations"
import type { Citation, Source } from "@/lib/types"

describe("citations", () => {
  describe("parseCitationsFromMarkdown", () => {
    it("parses numbered citations from markdown", () => {
      const content = "This is a sentence [^1] with a citation."
      const { citations, sources } = parseCitationsFromMarkdown(content)

      expect(citations).toHaveLength(1)
      expect(citations[0].id).toBe("1")
    })

    it("parses citation needed tags", () => {
      const content = "This claim [^citation-needed] requires verification."
      const { citations } = parseCitationsFromMarkdown(content)

      expect(citations).toHaveLength(1)
      expect(citations[0].id).toBe("citation-needed")
      expect(citations[0].isCitationNeeded).toBe(true)
    })

    it("parses source definitions at the end", () => {
      const content = `Text [^1] with citation.

[^1]: https://example.com "Example Title"`
      const { citations, sources, cleanedContent } = parseCitationsFromMarkdown(content)

      expect(citations).toHaveLength(1)
      expect(sources).toHaveLength(1)
      expect(sources[0].url).toBe("https://example.com")
      expect(sources[0].title).toBe("Example Title")
      expect(cleanedContent).not.toContain("[^1]:")
    })

    it("links citations to sources", () => {
      const content = `Text [^1] with citation.

[^1]: https://example.com "Example"`
      const { citations, sources } = parseCitationsFromMarkdown(content)

      expect(citations[0].sourceId).toBe("1")
      expect(sources[0].id).toBe("1")
    })
  })

  describe("renderCitationsInText", () => {
    it("renders citations in text correctly", () => {
      const citations: Citation[] = [
        { id: "1", sourceId: "1", text: "Citation 1" },
      ]
      const text = "This is text [^1] with citation."
      const { parts } = renderCitationsInText(text, citations)

      expect(parts.length).toBeGreaterThan(1)
      const citationPart = parts.find((p) => typeof p !== "string" && p.type === "citation")
      expect(citationPart).toBeDefined()
    })
  })

  describe("validateSources", () => {
    it("validates sources using API", async () => {
      // Mock fetch for testing
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              url: "https://example.com",
              isValid: true,
              checkedAt: new Date().toISOString(),
            },
          ],
        }),
      })

      const sources: Source[] = [
        {
          id: "1",
          title: "Example",
          url: "https://example.com",
        },
      ]

      const validated = await validateSources(sources)

      expect(validated[0].isValid).toBe(true)
      expect(validated[0].lastChecked).toBeDefined()
    })
  })
})

