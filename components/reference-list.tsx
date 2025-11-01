"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ExternalLink, AlertTriangle } from "lucide-react"
import type { Citation, Source } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ReferenceListProps {
  citations: Citation[]
  sources?: Source[]
  className?: string
}

interface ReferenceItemProps {
  citation: Citation
  source?: Source
  index: number
}

function ReferenceItem({ citation, source, index }: ReferenceItemProps) {
  const isBroken = source?.brokenAt || false
  const isCitationNeeded = citation.isCitationNeeded || citation.id === "citation-needed"
  const displayText = citation.text || source?.title || citation.url || "Citation"
  const citationUrl = citation.url || source?.url

  return (
    <li className="py-2 border-b last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
          {isCitationNeeded ? "?" : index}
        </span>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start gap-2">
            <p className="text-sm flex-1">
              {isCitationNeeded ? (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Citation needed
                </span>
              ) : (
                <span>{displayText}</span>
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
            >
              <ExternalLink className="h-3 w-3" />
              {citationUrl}
            </a>
          )}
          {source?.date && (
            <p className="text-xs text-muted-foreground">Date: {source.date}</p>
          )}
        </div>
      </div>
    </li>
  )
}

export function ReferenceList({ citations, sources, className }: ReferenceListProps) {
  if (!citations || citations.length === 0) return null

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
    const source = citation.sourceId ? sources?.find((s) => s.id === citation.sourceId) : null
    return source?.brokenAt || false
  }).length

  return (
    <Card className={cn("mt-8", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">References</CardTitle>
          {brokenCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {brokenCount} broken link{brokenCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-0 list-none">
          {sortedCitations.map((citation, idx) => {
            const numericIndex = citation.isCitationNeeded ? 0 : idx + 1
            const source = citation.sourceId
              ? sources?.find((s) => s.id === citation.sourceId)
              : undefined
            return (
              <ReferenceItem
                key={`ref-${citation.id}-${idx}`}
                citation={citation}
                source={source}
                index={numericIndex}
              />
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

