"use client"

import React, { useEffect, useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { ReferenceList } from "@/components/reference-list"
import { InlineCitation } from "@/components/citation-renderer"
import { parseCitationsFromMarkdown, validateSources } from "@/lib/citations"
import { getSources, createOrUpdateSource } from "@/lib/sources"
import type { Citation, Source } from "@/lib/types"

interface MarkdownWithCitationsProps {
  content: string
  className?: string
  articleId?: string // Optional article ID for context
}

// Component to render markdown with inline citations
export function MarkdownWithCitations({ content, className, articleId }: MarkdownWithCitationsProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [citations, setCitations] = useState<Citation[]>([])

  const { parsedCitations, parsedSources, cleanedContent } = useMemo(() => {
    const result = parseCitationsFromMarkdown(content || "")
    return {
      parsedCitations: result.citations || [],
      parsedSources: Array.isArray(result.sources) ? result.sources : [],
      cleanedContent: result.cleanedContent || "",
    }
  }, [content])

  // Load existing sources from storage and merge with parsed sources
  useEffect(() => {
    const existingSources = getSources()
    const mergedSources: Source[] = []

    // Create or update sources from parsed sources
    for (const parsedSource of parsedSources) {
      const existing = existingSources.find((s) => s.url === parsedSource.url)
      if (existing) {
        // Use existing source with its status (brokenAt, lastChecked, etc.)
        mergedSources.push(existing)
      } else {
        // Create new source
        const newSource = createOrUpdateSource({
          url: parsedSource.url,
          title: parsedSource.title,
          publisher: parsedSource.publisher,
          date: parsedSource.date,
        })
        mergedSources.push(newSource)
      }
    }

    setCitations(parsedCitations)
    setSources(mergedSources)

    // Validate sources in background
    if (mergedSources.length > 0) {
      validateSources(mergedSources).then((validatedSources) => {
        // Update sources in storage
        validatedSources.forEach((source) => {
          createOrUpdateSource(source)
        })
        setSources(validatedSources)
      })
    }

    // Listen for source updates
    const handleSourceUpdate = () => {
      const updatedSources = getSources()
      const updatedMerged = mergedSources.map((source) => {
        const updated = updatedSources.find((s) => s.id === source.id || s.url === source.url)
        return updated || source
      })
      setSources(updatedMerged)
    }

    window.addEventListener("sourceUpdated", handleSourceUpdate)
    return () => {
      window.removeEventListener("sourceUpdated", handleSourceUpdate)
    }
  }, [parsedCitations, parsedSources])

  // Custom renderer for ReactMarkdown that handles citations
  const components = {
    p: ({ children, ...props }: any) => {
      // Convert children to string first for processing
      const childrenString = React.Children.toArray(children)
        .map((child: any) => (typeof child === "string" ? child : child?.props?.children || ""))
        .join("")

      const processed = processTextWithCitations(childrenString)

      return <p {...props}>{processed}</p>
    },
  }

  // Process text and replace [^1] patterns with citation components
  const processTextWithCitations = (text: string): (string | JSX.Element)[] => {
    if (typeof text !== "string") return [text]

    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let citationCounter = 0

    // Match [^1] or [^citation-needed] patterns
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
          citationCounter++
        }
        const source = citation.sourceId
          ? sources.find((s) => s.id === citation.sourceId)
          : undefined

        parts.push(
          <InlineCitation
            key={`citation-${citation.id}-${match.index}`}
            citation={citation}
            sources={sources}
            index={citation.isCitationNeeded ? 0 : citationCounter}
          />
        )
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

    return parts.length > 0 ? parts : [text]
  }

  return (
    <div className={className}>
      <ReactMarkdown components={components}>{cleanedContent}</ReactMarkdown>
      {citations.length > 0 && (
        <ReferenceList
          citations={citations}
          sources={sources}
          className="mt-8"
          articleId={articleId}
        />
      )}
    </div>
  )
}
