"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, Clock, Eye, MousePointerClick, Share2, TrendingUp, Users } from "lucide-react"

import type { BlogPost, PostAnalytics, PostAnalyticsPeriod } from "@/lib/types"
import { getPostAnalytics } from "@/lib/utils/post-analytics"
import { MetricCard } from "@/components/groups/MetricCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface PostAnalyticsDashboardProps {
  post: BlogPost
}

type SelectValueType = "7" | "30" | "90" | "lifetime"

interface ChartDatum {
  label: string
  views: number
  engagements: number
  impressions: number
  reach: number
}

function formatNumber(value: number): string {
  return value.toLocaleString()
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`
}

function mapSelectValueToPeriod(value: SelectValueType): PostAnalyticsPeriod {
  if (value === "lifetime") return "lifetime"
  return Number(value) as PostAnalyticsPeriod
}

export function PostAnalyticsDashboard({ post }: PostAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<SelectValueType>("30")
  const [analytics, setAnalytics] = useState<PostAnalytics | null>(null)

  useEffect(() => {
    const data = getPostAnalytics(post.id, mapSelectValueToPeriod(period))
    setAnalytics(data)
  }, [post.id, period])

  const chartFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }),
    []
  )

  const chartData: ChartDatum[] = useMemo(() => {
    if (!analytics) return []
    return analytics.dailyPerformance.map((entry) => ({
      label: chartFormatter.format(new Date(entry.date)),
      views: entry.views,
      engagements: entry.engagements,
      impressions: entry.impressions,
      reach: entry.reach,
    }))
  }, [analytics, chartFormatter])

  const summaryMetrics = useMemo(() => {
    if (!analytics) return []
    return [
      {
        title: "Views",
        value: formatNumber(analytics.totalViews),
        description: "Total views this period",
        icon: Eye,
      },
      {
        title: "Reach",
        value: formatNumber(analytics.reach),
        description: "Unique accounts reached",
        icon: Users,
      },
      {
        title: "Engagement Rate",
        value: formatPercent(analytics.engagementRate),
        description: "Engagement vs. views",
        icon: Activity,
      },
      {
        title: "Click-Through Rate",
        value: formatPercent(analytics.clickThroughRate),
        description: "Link clicks vs. impressions",
        icon: MousePointerClick,
      },
      {
        title: "Total Engagements",
        value: formatNumber(analytics.totalEngagements),
        description: "Reactions, comments & shares",
        icon: Share2,
      },
    ]
  }, [analytics])

  if (!analytics) {
    return null
  }

  const totalAudience = analytics.audienceSegments.reduce((sum, segment) => sum + segment.value, 0) || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Post Analytics
          </h2>
          <p className="text-muted-foreground">
            Engagement, reach, and performance insights for the selected period.
          </p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as SelectValueType)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="lifetime">Lifetime</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryMetrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Daily Performance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track views and engagements over the selected timeframe.
            </p>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                <XAxis dataKey="label" className="text-xs" />
                <YAxis className="text-xs" />
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                        <p className="font-medium">{label}</p>
                        {payload.map((entry) => (
                          <p
                            key={entry.dataKey}
                            className="flex items-center gap-2"
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="capitalize">{entry.dataKey as string}:</span>
                            <span>{formatNumber(entry.value as number)}</span>
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#6366f1"
                  fill="url(#colorViews)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="engagements"
                  stroke="#f97316"
                  fill="url(#colorEngagements)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Performance Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Week-over-week change in key metrics.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Views", value: analytics.trend.viewsChange },
                { label: "Engagements", value: analytics.trend.engagementsChange },
                { label: "Reach", value: analytics.trend.reachChange },
              ].map((item) => {
                const isPositive = item.value >= 0
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-lg border p-3",
                      isPositive ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" : "border-rose-200 bg-rose-50/50 text-rose-700"
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className="mt-1 text-xl font-semibold">
                      {isPositive ? "+" : ""}
                      {item.value.toFixed(1)}%
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Average view duration
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatDuration(analytics.averageViewDuration)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Average time viewers spent engaging with this post.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Engagement Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of interactions on this post.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Reactions", value: analytics.breakdown.reactions },
              { label: "Comments", value: analytics.breakdown.comments },
              { label: "Shares", value: analytics.breakdown.shares },
              { label: "Saves", value: analytics.breakdown.saves },
              { label: "Link Clicks", value: analytics.breakdown.linkClicks },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{formatNumber(item.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Reaction Mix</CardTitle>
            <p className="text-sm text-muted-foreground">
              How viewers responded to your post.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.reactionsByType.map((reaction) => {
              const total = analytics.breakdown.reactions || 1
              const percentage = total > 0 ? Math.round((reaction.value / total) * 100) : 0
              return (
                <div key={reaction.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{reaction.type}</span>
                    <span className="font-medium text-foreground">
                      {formatNumber(reaction.value)} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Audience Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Composition of viewers who saw this post.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.audienceSegments.map((segment) => {
              const percentage = Math.round((segment.value / totalAudience) * 100)
              return (
                <div key={segment.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{segment.label}</span>
                    <span className="font-medium text-foreground">
                      {formatNumber(segment.value)} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle>Traffic Sources</CardTitle>
            <p className="text-sm text-muted-foreground">
              Where viewers discovered your post.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.trafficSources.map((source) => (
              <div key={source.source} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{source.source}</span>
                  <span className="font-medium text-foreground">{source.value}%</span>
                </div>
                <Progress value={source.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
