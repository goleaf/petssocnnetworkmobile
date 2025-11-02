"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getSearchAnalyticsAggregation,
  getSearchAnalyticsSummary,
  clearOldAnalytics,
} from "@/lib/utils/search-analytics"
import type { SearchAnalyticsAggregation, SearchAnalyticsSummary } from "@/lib/types"
import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Search,
  AlertCircle,
  BarChart3,
  Filter,
  Calendar,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchAnalyticsDashboardProps {
  defaultPeriod?: "day" | "week" | "month"
}

export function SearchAnalyticsDashboard({ defaultPeriod = "week" }: SearchAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<"day" | "week" | "month">(defaultPeriod)
  const [aggregation, setAggregation] = useState<SearchAnalyticsAggregation | null>(null)
  const [summary, setSummary] = useState<SearchAnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    setIsLoading(true)
    const agg = getSearchAnalyticsAggregation({ period })
    const summ = getSearchAnalyticsSummary(period)
    setAggregation(agg)
    setSummary(summ)
    setIsLoading(false)
  }, [period])

  const handleClearOldData = () => {
    if (typeof window === "undefined") return
    clearOldAnalytics(30) // Keep last 30 days
    // Refresh data
    const agg = getSearchAnalyticsAggregation({ period })
    const summ = getSearchAnalyticsSummary(period)
    setAggregation(agg)
    setSummary(summ)
  }

  if (isLoading || !aggregation || !summary) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Search Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={period === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("day")}
          >
            Day
          </Button>
          <Button
            variant={period === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("week")}
          >
            Week
          </Button>
          <Button
            variant={period === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Queries in {period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overallCTR.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalClicks.toLocaleString()} clicks from {summary.totalQueries.toLocaleString()} queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Result Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overallZeroResultRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalZeroResultQueries.toLocaleString()} queries with no results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Queries</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregation.uniqueQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {aggregation.averageQueryLength
                ? `Avg ${aggregation.averageQueryLength} chars`
                : "Average query length"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zero Results Analysis */}
      {aggregation.topZeroResultQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Zero-Result Queries</CardTitle>
            <CardDescription>Queries that returned no results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aggregation.topZeroResultQueries.map((item, index) => (
                <div key={index} className="flex items-center justify-between pb-2 border-b last:border-b-0">
                  <span className="text-sm font-medium truncate flex-1 mr-4">{item.query}</span>
                  <span className="text-sm text-muted-foreground">{item.count} searches</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Type Breakdown */}
      {aggregation.topContentTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Queries by Content Type</CardTitle>
            <CardDescription>Distribution of search queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aggregation.topContentTypes.map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.type}</span>
                    <span className="text-sm text-muted-foreground">{item.queries} queries</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          aggregation.totalQueries > 0
                            ? (item.queries / aggregation.totalQueries) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Usage */}
      {aggregation.mostUsedFilters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Used Filters</CardTitle>
            <CardDescription>Filter categories used in searches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aggregation.mostUsedFilters.map((filter) => (
                <div key={filter.filterType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{filter.filterType}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{filter.count} times</span>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Average filters per query</span>
                  <span className="font-medium">{aggregation.averageFiltersPerQuery.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Breakdown */}
      {aggregation.dailyBreakdown && aggregation.dailyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
            <CardDescription>Search activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aggregation.dailyBreakdown.map((day) => (
                <div key={day.date} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {day.queries} queries
                      </span>
                      <span className="text-muted-foreground">
                        {day.ctr.toFixed(1)}% CTR
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          aggregation.totalQueries > 0 ? (day.queries / aggregation.totalQueries) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                  {day.zeroResults > 0 && (
                    <div className="flex items-center gap-2 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>{day.zeroResults} zero-result queries</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage stored analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleClearOldData}>
            Clear Data Older Than 30 Days
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will remove all analytics events older than 30 days to free up storage space.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
