"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, AlertTriangle, RefreshCw, Clock } from "lucide-react"
import type { Citation, Source } from "@/lib/types"
import { cn } from "@/lib/utils"
import { checkLink } from "@/lib/utils/link-checker"
import { updateSource, getSourceById } from "@/lib/sources"
import { formatDistanceToNow } from "date-fns"

interface ReferenceListProps {
  citations: Citation[]
  sources?: Source[]
  className?: string
  articleId?: string // Optional article ID for context
}

interface ReferenceItemProps {
  citation: Citation
  source?: Source
  index: number
  onRecheck?: (sourceId: string) => Promise<void>
  isChecking?: boolean
}

function ReferenceItem({ citation, source, index, onRecheck, isChecking }: ReferenceItemProps) {
  const isBroken = source?.brokenAt || false
  const isCitationNeeded = citation.isCitationNeeded || citation.id === "citation-needed"
  const displayText = citation.text || source?.title || citation.url || "Citation"
  const citationUrl = citation.url || source?.url
  
  // Check if link failed last check
  const failedLastCheck = source?.lastChecked && source?.isValid === false && !source?.brokenAt
  
  // Format last check time
  const lastCheckedText = source?.lastChecked
    ? formatDistanceToNow(new Date(source.lastChecked), { addSuffix: true })
    : null

  const handleRecheck = useCallback(async () => {
    if (!source?.id || !onRecheck || isChecking) return
    await onRecheck(source.id)
  }, [source?.id, onRecheck, isChecking])

  return (
    <li className="py-2 border-b last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center mt-0.5">
          {isCitationNeeded ? "?" : index}
        </span>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-sm flex-1">
              {isCitationNeeded ? (
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  Citation needed
                </span>
              ) : (
                <span>{displayText}</span>
              )}
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {isBroken && (
                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Broken
                </Badge>
              )}
              {failedLastCheck && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs border-orange-500 text-orange-600 dark:text-orange-400">
                  <Clock className="h-3 w-3" />
                  Link failed last check
                </Badge>
              )}
              {source?.isValid === true && !isBroken && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs border-green-500 text-green-600 dark:text-green-400">
                  <ExternalLink className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
          {source?.publisher && (
            <p className="text-xs text-muted-foreground">{source.publisher}</p>
          )}
          {citation.locator && (
            <p className="text-xs text-muted-foreground">Location: {citation.locator}</p>
          )}
          {citationUrl && (
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={citationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                {citationUrl}
              </a>
              {source?.id && onRecheck && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRecheck}
                  disabled={isChecking}
                  className="h-6 px-2 text-xs"
                >
                  <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
                  {isChecking ? "Checking..." : "Recheck"}
                </Button>
              )}
            </div>
          )}
          {lastCheckedText && (
            <p className="text-xs text-muted-foreground">
              Last checked: {lastCheckedText}
            </p>
          )}
          {source?.date && (
            <p className="text-xs text-muted-foreground">Date: {source.date}</p>
          )}
        </div>
      </div>
    </li>
  )
}

export function ReferenceList({ citations, sources, className, articleId }: ReferenceListProps) {
  const [checkingSourceId, setCheckingSourceId] = useState<string | null>(null)

  const handleRecheck = useCallback(async (sourceId: string) => {
    setCheckingSourceId(sourceId)
    try {
      const source = getSourceById(sourceId)
      if (!source?.url) return

      const result = await checkLink(source.url)

      // Update source with result
      updateSource(sourceId, {
        isValid: result.isValid,
        lastChecked: result.checkedAt,
        brokenAt: result.isValid ? undefined : result.checkedAt,
      })

      // Force re-render by updating sources
      // This will be handled by parent component
      window.dispatchEvent(new CustomEvent("sourceUpdated", { detail: { sourceId } }))
    } catch (error) {
      console.error("Failed to recheck link:", error)
    } finally {
      setCheckingSourceId(null)
    }
  }, [])

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

  const failedLastCheckCount = sortedCitations.filter((citation) => {
    const source = citation.sourceId ? sources?.find((s) => s.id === citation.sourceId) : null
    return source?.lastChecked && source?.isValid === false && !source?.brokenAt
  }).length

  return (
    <Card className={cn("mt-8", className)}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">References</CardTitle>
          <div className="flex items-center gap-2">
            {brokenCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {brokenCount} broken link{brokenCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {failedLastCheckCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600 dark:text-orange-400">
                <Clock className="h-3 w-3" />
                {failedLastCheckCount} failed last check
              </Badge>
            )}
          </div>
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
                onRecheck={handleRecheck}
                isChecking={checkingSourceId === source?.id}
              />
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}


