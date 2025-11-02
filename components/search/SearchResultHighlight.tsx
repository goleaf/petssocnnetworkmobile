"use client"

import * as React from "react"
import { useMemo } from "react"

interface SearchResultHighlightProps {
  text: string
  query: string
  className?: string
  maxLength?: number
}

export function SearchResultHighlight({
  text,
  query,
  className = "",
  maxLength = 200,
}: SearchResultHighlightProps) {
  const highlightedText = useMemo(() => {
    if (!query || !text) return text

    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))

    if (queryTerms.length === 0) return text

    const regex = new RegExp(`(${queryTerms.join("|")})`, "gi")
    const parts = text.split(regex)
    const truncated = text.length > maxLength ? text.substring(0, maxLength) + "..." : text

    // If we truncated, we still need to apply highlighting
    const truncatedParts = truncated.split(regex)

    return truncatedParts.map((part, index) => {
      const isMatch = queryTerms.some((term) => part.toLowerCase().includes(term.toLowerCase()))
      if (isMatch) {
        return (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
            {part}
          </mark>
        )
      }
      return <span key={index}>{part}</span>
    })
  }, [text, query, maxLength])

  return <span className={className}>{highlightedText}</span>
}

