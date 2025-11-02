import { getAllDashboardMetrics } from "@/lib/dashboard"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import {
  Flag,
  Shield,
  FileEdit,
  Heart,
  Search,
  Clock,
} from "lucide-react"

export default async function AdminDashboardPage() {
  const metrics = await getAllDashboardMetrics()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of moderation metrics and system health
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="New Reports (24h)"
          count={metrics.newReports24h.count}
          trend={metrics.newReports24h.trend}
          href="/admin/dashboard/reports"
          icon={Flag}
        />
        <DashboardCard
          title="Open Moderation Cases"
          count={metrics.openModerationCases.count}
          trend={metrics.openModerationCases.trend}
          href="/admin/dashboard/moderation-cases"
          icon={Shield}
        />
        <DashboardCard
          title="Flagged Wiki Edits"
          count={metrics.flaggedWikiEdits.count}
          trend={metrics.flaggedWikiEdits.trend}
          href="/admin/dashboard/flagged-edits"
          icon={FileEdit}
        />
        <DashboardCard
          title="Stale Health Pages"
          count={metrics.staleHealthPages.count}
          trend={metrics.staleHealthPages.trend}
          href="/admin/dashboard/stale-health"
          icon={Heart}
        />
        <DashboardCard
          title="Zero-Result Searches"
          count={metrics.zeroResultSearches.count}
          trend={metrics.zeroResultSearches.trend}
          href="/admin/dashboard/zero-results"
          icon={Search}
        />
        <DashboardCard
          title="Queue Backlog"
          count={metrics.queueBacklog.count}
          trend={metrics.queueBacklog.trend}
          href="/admin/dashboard/queue-backlog"
          icon={Clock}
        />
      </div>
    </div>
  )
}
