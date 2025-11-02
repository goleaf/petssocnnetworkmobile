"use client"

import { type WorkerHealth } from "@/lib/types/ops"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react"

interface WorkerHealthCardProps {
  workers: WorkerHealth[]
}

export function WorkerHealthCard({ workers }: WorkerHealthCardProps) {
  const getStatusIcon = (status: WorkerHealth["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case "unhealthy":
      case "offline":
        return <XCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: WorkerHealth["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
      case "degraded":
        return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
      case "unhealthy":
      case "offline":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
    }
  }

  const healthyCount = workers.filter((w) => w.status === "healthy").length
  const totalWorkers = workers.length
  const healthPercentage = totalWorkers > 0 ? (healthyCount / totalWorkers) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Worker Health
        </CardTitle>
        <CardDescription>
          Monitor worker status and performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
              <div className="text-sm text-muted-foreground">Healthy Workers</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{healthPercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Health Rate</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Worker Status</h4>
            <div className="space-y-2">
              {workers.map((worker) => (
                <div
                  key={worker.workerId}
                  className={`p-3 rounded-lg border ${getStatusColor(worker.status)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(worker.status)}
                      <span className="font-medium">{worker.workerId}</span>
                    </div>
                    <span className="text-xs font-semibold uppercase">{worker.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Jobs:</span>{" "}
                      <span className="font-semibold">{worker.jobsProcessed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Errors:</span>{" "}
                      <span className={`font-semibold ${worker.errors > 0 ? "text-red-600" : ""}`}>
                        {worker.errors}
                      </span>
                    </div>
                    {worker.cpuUsage !== undefined && (
                      <div>
                        <span className="text-muted-foreground">CPU:</span>{" "}
                        <span className="font-semibold">{worker.cpuUsage.toFixed(1)}%</span>
                      </div>
                    )}
                    {worker.memoryUsage !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Memory:</span>{" "}
                        <span className="font-semibold">
                          {(worker.memoryUsage / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last heartbeat: {new Date(worker.lastHeartbeat).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

