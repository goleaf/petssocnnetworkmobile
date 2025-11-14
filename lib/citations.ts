import type { Citation, Source } from "@/lib/types"

/**
 * Parse citations from markdown content
 * Supports:
 * - [^1] for numbered citations
 * - [^citation-needed] for citation needed tags
 * - [^1]: https://example.com "Title" for source definitions at the end
 */
export function parseCitationsFromMarkdown(content: string): {
  citations: Citation[]
  sources: Source[]
  cleanedContent: string
} {
  const citations: Citation[] = []
  const sources: Source[] = []
  
  // Handle null, undefined, or non-string content
  if (!content || typeof content !== "string") {
    return { citations, sources, cleanedContent: "" }
  }
  
  let cleanedContent = content

  // Extract inline citations: [^1], [^citation-needed]
  const citationPattern = /\[\^(\d+|citation-needed)\]/g
  const citationMatches = Array.from(content.matchAll(citationPattern))

  const uniqueCitationIds = new Set<string>()
  citationMatches.forEach((match) => {
    const citationId = match[1]
    uniqueCitationIds.add(citationId)
  })

  // Create citation objects
  uniqueCitationIds.forEach((id) => {
    citations.push({
      id,
      isCitationNeeded: id === "citation-needed",
    })
  })

  // Extract source definitions at the end: [^1]: https://example.com "Title"
  const sourcePattern = /\[\^(\d+)\]:\s*(.+?)(?:\s+"(.+?)")?$/gm
  const sourceMatches = Array.from(content.matchAll(sourcePattern))

  sourceMatches.forEach((match) => {
    const sourceId = match[1]
    const url = match[2].trim()
    const title = match[3]?.trim() || ""

    sources.push({
      id: sourceId,
      url,
      title,
    })

    // Link citation to source
    const citation = citations.find((c) => c.id === sourceId)
    if (citation) {
      citation.sourceId = sourceId
    }

    // Remove source definition from content
    cleanedContent = cleanedContent.replace(match[0], "")
  })

  return { citations, sources, cleanedContent }
}

/**
 * Render markdown content with inline citations as superscripts
 * Replaces [^1] with rendered citation components
 */
export function renderCitationsInText(
  text: string,
  citations: Citation[]
): { parts: (string | { type: "citation"; citation: Citation; index: number })[] } {
  const parts: (string | { type: "citation"; citation: Citation; index: number })[] = []
  let lastIndex = 0
  let citationIndex = 0

  // Match patterns like [^1], [^citation-needed]
  const citationPattern = /\[\^(\d+|citation-needed)\]/g

  let match
  while ((match = citationPattern.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const citationId = match[1]
    const citation = citations.find(
      (c) => c.id === citationId || (citationId === "citation-needed" && c.isCitationNeeded)
    )

    if (citation) {
      if (!citation.isCitationNeeded) {
        citationIndex++
      }
      parts.push({
        type: "citation",
        citation,
        index: citation.isCitationNeeded ? 0 : citationIndex,
      })
    } else {
      // If citation not found, keep the original text
      parts.push(match[0])
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return { parts: parts.length > 0 ? parts : [text] }
}

/**
 * Validate URLs in sources using the API endpoint
 */
export async function validateSources(sources: Source[]): Promise<Source[]> {
  const urlsToValidate = sources
    .filter((s) => s.url && (!s.lastChecked || shouldRevalidate(s.lastChecked)))
    .map((s) => s.url!)

  if (urlsToValidate.length === 0) {
    return sources
  }

  try {
    const response = await fetch("/api/links/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: urlsToValidate }),
    })

    if (!response.ok) {
      console.error("Failed to validate URLs:", response.statusText)
      return sources
    }

    const contentType = response.headers?.get?.("content-type")
    if (typeof contentType === 'string' && !contentType.includes("application/json")) {
      console.error("Invalid response format for URL validation")
      return sources
    }

    const { results } = await response.json()

    // Update sources with validation results
    return sources.map((source) => {
      if (!source.url) return source

      const validationResult = results.find((r: any) => r.url === source.url)
      if (!validationResult) return source

      return {
        ...source,
        isValid: validationResult.isValid,
        lastChecked: validationResult.checkedAt,
        brokenAt: validationResult.isValid
          ? undefined
          : validationResult.checkedAt || source.brokenAt,
      }
    })
  } catch (error) {
    console.error("Error validating URLs:", error)
    return sources
  }
}

function shouldRevalidate(lastChecked: string): boolean {
  const lastCheckedDate = new Date(lastChecked)
  const now = new Date()
  const daysSinceCheck = (now.getTime() - lastCheckedDate.getTime()) / (1000 * 60 * 60 * 24)
  // Revalidate if checked more than 7 days ago
  return daysSinceCheck > 7
}
