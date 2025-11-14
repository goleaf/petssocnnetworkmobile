"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink, X, Edit2 } from "lucide-react"
import { parseCitationsFromMarkdown } from "@/lib/citations"
import { getSources } from "@/lib/sources"
import type { Citation, Source } from "@/lib/types"

interface FootnotesManagerProps {
  content: string
  onRemoveCitation: (citationId: string) => void
  onEditSource?: (sourceId: string) => void
  className?: string
}

export function FootnotesManager({
  content,
  onRemoveCitation,
  onEditSource,
  className,
}: FootnotesManagerProps) {
  const sources = useMemo(() => getSources(), [])
  
  const { citations, sources: parsedSources } = useMemo(() => {
    const result = parseCitationsFromMarkdown(content || "")
    return {
      citations: result.citations || [],
      sources: Array.isArray(result.sources) ? result.sources : [],
    }
  }, [content])

  // Combine parsed sources with library sources
  const allSources = useMemo(() => {
    const sourceMap = new Map<string, Source>()
    
    // Add library sources
    sources.forEach((s) => sourceMap.set(s.id, s))
    
    // Add parsed sources (may have URLs but not IDs)
    parsedSources.forEach((s) => {
      if (s.id && !sourceMap.has(s.id)) {
        sourceMap.set(s.id, s)
      }
    })
    
    return Array.from(sourceMap.values())
  }, [sources, parsedSources])

  if (citations.length === 0) {
    return null
  }

  // Sort citations - numeric IDs first, then "citation-needed"
  const sortedCitations = [...citations].sort((a, b) => {
    if (a.isCitationNeeded && !b.isCitationNeeded) return 1
    if (!a.isCitationNeeded && b.isCitationNeeded) return -1
    if (a.isCitationNeeded && b.isCitationNeeded) return 0

    const aNum = parseInt(a.id, 10)
    const bNum = parseInt(b.id, 10)
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    return a.id.localeCompare(b.id)
  })

  const brokenCount = sortedCitations.filter((citation) => {
    const source = citation.sourceId ? allSources.find((s) => s.id === citation.sourceId) : null
    return source?.brokenAt || false
  }).length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Footnotes ({citations.length})</CardTitle>
          {brokenCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {brokenCount} broken link{brokenCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCitations.map((citation, idx) => {
            const numericIndex = citation.isCitationNeeded ? 0 : idx + 1
            const source = citation.sourceId
              ? allSources.find((s) => s.id === citation.sourceId)
              : undefined
            const isBroken = source?.brokenAt !== undefined
            const displayText = citation.text || source?.title || citation.url || "Citation"
            const citationUrl = citation.url || source?.url

            return (
              <div
                key={`footnote-${citation.id}-${idx}`}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
                  {citation.isCitationNeeded ? "?" : numericIndex}
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm flex-1">
                          {citation.isCitationNeeded ? (
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              Citation needed
                            </span>
                          ) : (
                            <span className="font-medium">{displayText}</span>
                          )}
                        </p>
                        {isBroken && (
                          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                            <AlertCircle className="h-3 w-3" />
                            Broken
                          </Badge>
                        )}
                      </div>
                      {source?.publisher && (
                        <p className="text-xs text-muted-foreground">{source.publisher}</p>
                      )}
                      {citation.locator && (
                        <p className="text-xs text-muted-foreground">Location: {citation.locator}</p>
                      )}
                      {citationUrl && (
                        <a
                          href={citationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-xs">{citationUrl}</span>
                        </a>
                      )}
                      {source?.date && (
                        <p className="text-xs text-muted-foreground">Date: {source.date}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {onEditSource && source && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSource(source.id)}
                          className="h-7 w-7 p-0"
                          title="Edit source"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCitation(citation.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Remove citation"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

