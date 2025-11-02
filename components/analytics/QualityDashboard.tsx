"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getQualityDashboardData, getIssuesByType } from "@/lib/utils/quality-analytics"
import type { QualityDashboardData, QualityIssue } from "@/lib/utils/quality-analytics"
import {
  FileText,
  AlertTriangle,
  Clock,
  Link2,
  FileWarning,
  TrendingDown,
  TrendingUp,
  Info,
} from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
  trendValue?: string
}

function MetricCard({ title, value, description, icon: Icon, trend, trendValue }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && trendValue && (
          <div
            className={`flex items-center text-xs mt-1 ${
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
            {trend === "neutral" && <Info className="h-3 w-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function getSeverityColor(severity: "low" | "medium" | "high") {
  switch (severity) {
    case "high":
      return "bg-red-500 text-white"
    case "medium":
      return "bg-orange-500 text-white"
    case "low":
      return "bg-yellow-500 text-white"
  }
}

function getIssueIcon(type: "stub" | "stale_health" | "orphaned") {
  switch (type) {
    case "stub":
      return FileWarning
    case "stale_health":
      return Clock
    case "orphaned":
      return Link2
  }
}

function getIssueLabel(type: "stub" | "stale_health" | "orphaned") {
  switch (type) {
    case "stub":
      return "Stub Article"
    case "stale_health":
      return "Stale Health Page"
    case "orphaned":
      return "Orphaned Page"
  }
}

function IssueItem({ issue }: { issue: QualityIssue }) {
  const IssueIcon = getIssueIcon(issue.type)
  const label = getIssueLabel(issue.type)

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
      <IssueIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium">{issue.articleTitle}</div>
            <div className="text-sm text-muted-foreground">{issue.articleSlug}</div>
          </div>
          <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{issue.description}</p>
        {issue.lastUpdated && (
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {new Date(issue.lastUpdated).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}

export function QualityDashboard() {
  const [data, setData] = useState<QualityDashboardData | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "stubs" | "stale" | "orphaned">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    setIsLoading(true)
    const dashboardData = getQualityDashboardData()
    setData(dashboardData)
    setIsLoading(false)
  }, [])

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-muted-foreground">Loading quality data...</div>
      </div>
    )
  }

  // Get issues for active tab
  const getFilteredIssues = (): QualityIssue[] => {
    switch (activeTab) {
      case "stubs":
        return getIssuesByType("stub")
      case "stale":
        return getIssuesByType("stale_health")
      case "orphaned":
        return getIssuesByType("orphaned")
      default:
        return data.issues
    }
  }

  const filteredIssues = getFilteredIssues()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Content Quality Dashboard</h2>
        <p className="text-muted-foreground">Monitor and improve wiki content quality</p>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quality Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Articles"
            value={data.totalArticles.toLocaleString()}
            icon={FileText}
            description="Wiki articles in total"
          />
          <MetricCard
            title="Stubs"
            value={data.stubs}
            icon={FileWarning}
            description="Short or incomplete articles"
            trend={data.stubs > 0 ? "down" : "neutral"}
            trendValue={data.stubs > 0 ? "Needs attention" : "All good"}
          />
          <MetricCard
            title="Stale Health"
            value={data.staleHealthPages}
            icon={Clock}
            description="Outdated health pages"
            trend={data.staleHealthPages > 0 ? "down" : "neutral"}
            trendValue={data.staleHealthPages > 0 ? "Needs review" : "Current"}
          />
          <MetricCard
            title="Orphaned"
            value={data.orphanedPages}
            icon={Link2}
            description="Pages without inbound links"
            trend={data.orphanedPages > 0 ? "down" : "neutral"}
            trendValue={data.orphanedPages > 0 ? "Needs linking" : "Well connected"}
          />
        </div>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Content Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Overall Score: {data.healthScore.toFixed(1)}/100
                </span>
                <span className="text-xs text-muted-foreground">
                  {data.totalIssues} issue{data.totalIssues !== 1 ? "s" : ""} found
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-8">
                <div
                  className={`h-8 rounded-full flex items-center justify-center text-sm font-medium text-white transition-all ${
                    data.healthScore >= 80
                      ? "bg-green-500"
                      : data.healthScore >= 60
                        ? "bg-yellow-500"
                        : data.healthScore >= 40
                          ? "bg-orange-500"
                          : "bg-red-500"
                  }`}
                  style={{ width: `${data.healthScore}%` }}
                >
                  {data.healthScore >= 80
                    ? "Excellent"
                    : data.healthScore >= 60
                      ? "Good"
                      : data.healthScore >= 40
                        ? "Fair"
                        : "Poor"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Low</span>
                <span className="font-semibold">{data.issuesBySeverity.low}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Medium</span>
                <span className="font-semibold">{data.issuesBySeverity.medium}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">High</span>
                <span className="font-semibold">{data.issuesBySeverity.high}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quality Issues
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                All ({data.totalIssues})
              </button>
              <button
                onClick={() => setActiveTab("stubs")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === "stubs"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                Stubs ({data.stubs})
              </button>
              <button
                onClick={() => setActiveTab("stale")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === "stale"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                Stale ({data.staleHealthPages})
              </button>
              <button
                onClick={() => setActiveTab("orphaned")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === "orphaned"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                Orphaned ({data.orphanedPages})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredIssues.length > 0 ? (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <IssueItem key={issue.id} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No issues found in this category
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

