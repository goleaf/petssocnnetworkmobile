"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "./MetricCard"
import { getGroupMetrics, exportMetricsAsCSV } from "@/lib/utils/group-analytics"
import type { GroupMetrics } from "@/lib/types"
import {
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  FolderOpen,
  TrendingUp,
  Download,
} from "lucide-react"

interface AnalyticsDashboardProps {
  groupId: string
  groupName: string
}

export function AnalyticsDashboard({ groupId, groupName }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<GroupMetrics | null>(null)
  const [period, setPeriod] = useState<"7" | "30" | "all">("30")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    setIsLoading(true)
    const calculatedMetrics = getGroupMetrics(groupId, period === "all" ? "all" : Number(period) as 7 | 30)
    setMetrics(calculatedMetrics)
    setIsLoading(false)
  }, [groupId, period])

  const handleExport = () => {
    if (!metrics) return
    const csv = exportMetricsAsCSV(metrics, groupName)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${groupName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_analytics.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading || !metrics) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Group Analytics</h2>
          <p className="text-muted-foreground">
            Track engagement, growth, and participation metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as "7" | "30" | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" size="default">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Member Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Member Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total Members"
            value={metrics.totalMembers}
            icon={Users}
            description="All time members"
          />
          <MetricCard
            title="New This Week"
            value={metrics.newMembersThisWeek}
            icon={TrendingUp}
            description="Joined in last 7 days"
          />
          <MetricCard
            title="New This Month"
            value={metrics.newMembersThisMonth}
            icon={TrendingUp}
            description="Joined in last 30 days"
          />
          <MetricCard
            title="Active Members"
            value={metrics.activeMembers}
            icon={Users}
            description="Active in last 7 days"
          />
          <MetricCard
            title="Inactive Members"
            value={metrics.inactiveMembers}
            icon={Users}
            description="Not active in last 30 days"
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Topics"
            value={metrics.totalTopics}
            icon={MessageSquare}
            description="All discussion topics"
          />
          <MetricCard
            title="Topics This Week"
            value={metrics.topicsThisWeek}
            icon={MessageSquare}
            description="Created in last 7 days"
          />
          <MetricCard
            title="Topics This Month"
            value={metrics.topicsThisMonth}
            icon={MessageSquare}
            description="Created in last 30 days"
          />
          <MetricCard
            title="Total Comments"
            value={metrics.totalComments}
            icon={MessageSquare}
            description="All topic comments"
          />
          <MetricCard
            title="Comments This Week"
            value={metrics.commentsThisWeek}
            icon={MessageSquare}
            description="Posted in last 7 days"
          />
          <MetricCard
            title="Comments This Month"
            value={metrics.commentsThisMonth}
            icon={MessageSquare}
            description="Posted in last 30 days"
          />
        </div>
      </div>

      {/* Content Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Polls"
            value={metrics.totalPolls}
            icon={BarChart3}
            description="All polls created"
          />
          <MetricCard
            title="Polls This Week"
            value={metrics.pollsThisWeek}
            icon={BarChart3}
            description="Created in last 7 days"
          />
          <MetricCard
            title="Polls This Month"
            value={metrics.pollsThisMonth}
            icon={BarChart3}
            description="Created in last 30 days"
          />
          <MetricCard
            title="Total Events"
            value={metrics.totalEvents}
            icon={Calendar}
            description="All events created"
          />
          <MetricCard
            title="Events This Week"
            value={metrics.eventsThisWeek}
            icon={Calendar}
            description="Created in last 7 days"
          />
          <MetricCard
            title="Events This Month"
            value={metrics.eventsThisMonth}
            icon={Calendar}
            description="Created in last 30 days"
          />
          <MetricCard
            title="Total Resources"
            value={metrics.totalResources}
            icon={FolderOpen}
            description="All resources shared"
          />
          <MetricCard
            title="Resources This Week"
            value={metrics.resourcesThisWeek}
            icon={FolderOpen}
            description="Shared in last 7 days"
          />
          <MetricCard
            title="Resources This Month"
            value={metrics.resourcesThisMonth}
            icon={FolderOpen}
            description="Shared in last 30 days"
          />
        </div>
      </div>

      {/* Participation Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Participation Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Poll Participation"
            value={`${metrics.pollParticipationRate}%`}
            icon={BarChart3}
            description="Members who voted in polls"
          />
          <MetricCard
            title="Event Attendance"
            value={`${metrics.eventAttendanceRate}%`}
            icon={Calendar}
            description="Members who RSVP'd to events"
          />
          <MetricCard
            title="Avg Poll Votes"
            value={metrics.averagePollVotes}
            icon={BarChart3}
            description="Average votes per poll"
          />
          <MetricCard
            title="Avg Event RSVPs"
            value={metrics.averageEventRSVPs}
            icon={Calendar}
            description="Average RSVPs per event"
          />
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.dailyActivity.map((day, index) => (
                <div
                  key={day.date}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                >
                  <div className="w-24 text-sm font-medium">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex-1 grid grid-cols-6 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span>{day.topics} topics</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      <span>{day.comments} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-muted-foreground" />
                      <span>{day.polls} polls</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{day.events} events</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FolderOpen className="h-3 w-3 text-muted-foreground" />
                      <span>{day.resources} resources</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{day.newMembers} new</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

