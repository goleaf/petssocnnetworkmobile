"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { trackSearchQuery } from "@/lib/utils/search-analytics"

interface SearchAnalyticsViewProps {
  query?: string
  resultCount: number
  searchTime?: number
  filters?: Record<string, any>
  className?: string
}

interface AnalyticsData {
  query: string
  resultCount: number
  timestamp: number
  filters?: Record<string, any>
}

export function SearchAnalyticsView({
  query,
  resultCount,
  searchTime,
  filters,
  className,
}: SearchAnalyticsViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<AnalyticsData[]>([])
  const [trendingQueries, setTrendingQueries] = useState<string[]>([])

  useEffect(() => {
    // Load recent search analytics from localStorage
    const stored = localStorage.getItem("search_analytics_history")
    if (stored) {
      try {
        const data: AnalyticsData[] = JSON.parse(stored)
        setRecentSearches(data.slice(0, 10))
      } catch (error) {
        console.error("Failed to parse search analytics:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (query && query.trim()) {
      // Track the search
      trackSearchQuery({
        query,
        filters,
        resultCount,
        contentType: undefined,
        isAuthenticated: true,
      })

      // Update recent searches
      const newSearch: AnalyticsData = {
        query,
        resultCount,
        timestamp: Date.now(),
        filters,
      }

      setRecentSearches((prev) => {
        const updated = [newSearch, ...prev.filter((s) => s.query !== query)].slice(0, 10)
        localStorage.setItem("search_analytics_history", JSON.stringify(updated))
        return updated
      })

      // Calculate trending queries (simple implementation)
      const allSearches: AnalyticsData[] = JSON.parse(
        localStorage.getItem("search_analytics_history") || "[]"
      )
      const queryCounts = new Map<string, number>()
      allSearches.forEach((s) => {
        queryCounts.set(s.query, (queryCounts.get(s.query) || 0) + 1)
      })
      const trending = Array.from(queryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([q]) => q)
      setTrendingQueries(trending)
    }
  }, [query, resultCount, filters])

  const getResultTrend = (currentCount: number, previousCount?: number) => {
    if (previousCount === undefined) return null
    if (currentCount > previousCount) return "up"
    if (currentCount < previousCount) return "down"
    return "stable"
  }

  const previousSearch = recentSearches.find((s) => s.query === query && s.timestamp < Date.now())
  const trend = getResultTrend(resultCount, previousSearch?.resultCount)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2 w-full justify-between", className)}>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Search Analytics</span>
            {searchTime !== undefined && (
              <span className="text-xs text-muted-foreground">({searchTime}ms)</span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-base">Search Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Search Stats */}
            {query && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Results Found</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{resultCount}</span>
                    {trend && (
                      <div className="flex items-center gap-1">
                        {trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                        {trend === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
                        {trend === "stable" && <Minus className="h-3 w-3 text-gray-500" />}
                        {previousSearch && (
                          <span className="text-xs text-muted-foreground">
                            ({resultCount - previousSearch.resultCount > 0 ? "+" : ""}
                            {resultCount - previousSearch.resultCount})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {searchTime !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Search Time</span>
                    <span className="text-sm text-muted-foreground">{searchTime}ms</span>
                  </div>
                )}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Searches</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <span className="truncate flex-1">{search.query || "No query"}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {search.resultCount} results
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Queries */}
            {trendingQueries.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending Searches
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trendingQueries.map((q, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        // This would be handled by parent component
                        window.location.href = `/search?q=${encodeURIComponent(q)}`
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {!query && recentSearches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Analytics will appear after you perform searches
              </p>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}

