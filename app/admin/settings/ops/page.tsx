"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EnvBanner } from "@/components/admin/ops/EnvBanner"
import { QueueBacklogCard } from "@/components/admin/ops/QueueBacklogCard"
import { WorkerHealthCard } from "@/components/admin/ops/WorkerHealthCard"
import { ErrorSpikesCard } from "@/components/admin/ops/ErrorSpikesCard"
import { StorageUsageCard } from "@/components/admin/ops/StorageUsageCard"
import { type OperationsMetrics } from "@/lib/types/ops"
import { getOperationsMetrics } from "@/lib/actions/ops"
import { RefreshCw, Clock, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminSettingsOpsPage() {
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const data = await getOperationsMetrics()
      setMetrics(data)
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to fetch operations metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading operations metrics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Failed to load operations metrics. Please try again.
              </p>
              <div className="flex justify-center mt-4">
                <Button onClick={fetchMetrics}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <BackButton href="/admin" />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="w-8 h-8" />
                Operations Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Monitor system health, queues, workers, errors, and storage
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Updated {lastRefresh.toLocaleTimeString()}</span>
              </div>
              <Button
                onClick={fetchMetrics}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <EnvBanner environment={metrics.environment} />
        </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QueueBacklogCard queues={metrics.queues} />
            <WorkerHealthCard workers={metrics.workers} />
          </div>

          <ErrorSpikesCard errorSpikes={metrics.errorSpikes} />

          <StorageUsageCard storage={metrics.storage} />
        </div>
      </div>
    </div>
  )
}

