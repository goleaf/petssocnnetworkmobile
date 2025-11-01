"use client"

import { useEffect, useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { ReferenceList } from "@/components/reference-list"
import { InlineCitation } from "@/components/citation-renderer"
import { parseCitationsFromMarkdown, validateSources } from "@/lib/citations"
import type { Citation, Source } from "@/lib/types"

interface MarkdownWithCitationsProps {
  content: string
  className?: string
}

// Component to render markdown with inline citations
export function MarkdownWithCitations({ content, className }: MarkdownWithCitationsProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [citations, setCitations] = useState<Citation[]>([])

  const { parsedCitations, parsedSources, cleanedContent } = useMemo(() => {
    return parseCitationsFromMarkdown(content)
  }, [content])

  useEffect(() => {
    setCitations(parsedCitations)
    setSources(parsedSources)

    // Validate sources in background
    if (parsedSources.length > 0) {
      validateSources(parsedSources).then((validatedSources) => {
        setSources(validatedSources)
      })
    }
  }, [parsedCitations, parsedSources])

  // Custom renderer for ReactMarkdown that handles citations
  const components = {
    p: ({ children, ...props }: any) => {
      // Process paragraph content to render citations
      const processNode = (node: any): any => {
        if (typeof node === "string") {
          return processTextWithCitations(node)
        }
        if (Array.isArray(node)) {
          return node.map((child, idx) => (
            <span key={idx}>{processNode(child)}</span>
          ))
        }
        if (node?.props?.children) {
          return {
            ...node,
            props: {
              ...node.props,
              children: processNode(node.props.children),
            },
          }
        }
        return node
      }

      const processedChildren = processNode(children)

      return <p {...props}>{processedChildren}</p>
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
        <ReferenceList citations={citations} sources={sources} className="mt-8" />
      )}
    </div>
  )
}
