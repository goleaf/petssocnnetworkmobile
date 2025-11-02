"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RelatedSearchesProps {
  queries: string[]
  currentQuery: string
  onSelect: (query: string) => void
  className?: string
}

export function RelatedSearches({
  queries,
  currentQuery,
  onSelect,
  className,
}: RelatedSearchesProps) {
  if (queries.length === 0) return null

  // Filter out the current query
  const filteredQueries = queries.filter((q) => q.toLowerCase() !== currentQuery.toLowerCase())

  if (filteredQueries.length === 0) return null

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Related Searches
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {filteredQueries.slice(0, 8).map((query, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSelect(query)}
              className="text-xs"
            >
              {query}
              <ArrowRight className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

