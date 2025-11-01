"use client"

import { useState } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink } from "lucide-react"
import type { Citation, Source } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CitationRendererProps {
  citations: Citation[]
  sources?: Source[]
  className?: string
}

interface InlineCitationProps {
  citation: Citation
  sources?: Source[]
  index: number
}

export function InlineCitation({ citation, sources, index }: InlineCitationProps) {
  const source = citation.sourceId ? sources?.find((s) => s.id === citation.sourceId) : undefined
  const isBroken = source?.brokenAt || false
  const isCitationNeeded = citation.isCitationNeeded || citation.id === "citation-needed"

  const citationContent = (
    <sup
      className={cn(
        "inline-flex items-center text-xs font-medium cursor-help ml-0.5",
        "text-primary hover:text-primary/80 transition-colors",
        isBroken && "text-destructive",
        isCitationNeeded && "text-orange-600 dark:text-orange-400"
      )}
    >
      {isCitationNeeded ? (
        <span className="font-semibold" title="Citation needed">
          [citation needed]
        </span>
      ) : (
        <span>[{index}]</span>
      )}
    </sup>
  )

  if (isCitationNeeded) {
    return (
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>{citationContent}</HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <h4 className="font-semibold text-sm">Citation Needed</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              This claim requires a citation from a reliable source.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const displayText = citation.text || source?.title || citation.url || "Citation"
  const citationUrl = citation.url || source?.url

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{citationContent}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          {isBroken && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Link may be broken</span>
            </div>
          )}
          <div>
            <h4 className="font-semibold text-sm mb-1">{displayText}</h4>
            {source?.publisher && (
              <p className="text-xs text-muted-foreground">{source.publisher}</p>
            )}
            {citation.locator && (
              <p className="text-xs text-muted-foreground mt-1">See: {citation.locator}</p>
            )}
          </div>
          {citationUrl && (
            <a
              href={citationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              View source
            </a>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export function CitationRenderer({ citations, sources, className }: CitationRendererProps) {
  if (!citations || citations.length === 0) return null

  // Parse citations from text using pattern like [1], [citation needed], etc.
  // This is a simple implementation - you might want to use a more sophisticated parser
  const renderWithCitations = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let lastIndex = 0
    let citationIndex = 0

    // Match patterns like [1], [citation needed], [2], etc.
    const citationPattern = /\[(citation needed|\d+)\]/gi

    let match
    while ((match = citationPattern.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      const citationId = match[1].toLowerCase()
      const citation = citations.find(
        (c) => c.id === citationId || (citationId === "citation needed" && c.isCitationNeeded)
      )

      if (citation) {
        citationIndex++
        const numericIndex = citation.isCitationNeeded ? 0 : citationIndex
        parts.push(
          <InlineCitation
            key={`citation-${citation.id}-${match.index}`}
            citation={citation}
            sources={sources}
            index={numericIndex}
          />
        )
      } else {
        // If citation not found, just show the text
        parts.push(match[0])
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return <span className={className}>{renderWithCitations("")}</span>
}

// Hook for parsing citations from markdown content
export function useCitations(content: string): { citations: Citation[]; sources: Source[] } {
  const citations: Citation[] = []
  const sources: Source[] = []

  // Extract citations from content
  // Pattern: [^1] or [^citation-needed] in markdown
  const citationPattern = /\[\^(\d+|citation-needed)\]/g
  const matches = Array.from(content.matchAll(citationPattern))

  matches.forEach((match, index) => {
    const citationId = match[1]
    citations.push({
      id: citationId,
      isCitationNeeded: citationId === "citation-needed",
    })
  })

  // Extract source references from content
  // Pattern: [^1]: https://example.com "Title"
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
  })

  return { citations, sources }
}

