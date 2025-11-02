"use client"

import { type StorageUsage } from "@/lib/types/ops"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, AlertTriangle, HardDrive } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StorageUsageCardProps {
  storage: StorageUsage[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function StorageUsageCard({ storage }: StorageUsageCardProps) {
  const totalUsed = storage.reduce((sum, s) => sum + s.used, 0)
  const totalCapacity = storage.reduce((sum, s) => sum + s.total, 0)
  const overallPercentage = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0
  const hasAlerts = storage.some((s) => s.alerts.length > 0 || s.percentage > 80)

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 75) return "text-yellow-600"
    return "text-green-600"
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-600"
    if (percentage >= 75) return "bg-yellow-600"
    return "bg-green-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Usage
        </CardTitle>
        <CardDescription>
          Monitor storage capacity and usage across services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Storage</span>
              <span className={`text-lg font-bold ${getUsageColor(overallPercentage)}`}>
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={overallPercentage} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-muted-foreground">
                {formatBytes(totalUsed)} of {formatBytes(totalCapacity)} used
              </span>
              <span className="text-muted-foreground">
                {formatBytes(totalCapacity - totalUsed)} available
              </span>
            </div>
          </div>

          {hasAlerts && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Some storage services are approaching capacity limits
              </span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Service Details</h4>
            {storage.map((service) => (
              <div key={service.service} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{service.service}</span>
                  </div>
                  <span className={`text-sm font-semibold ${getUsageColor(service.percentage)}`}>
                    {service.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={service.percentage}
                  className="h-2"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(service.used)}</span>
                  <span>{formatBytes(service.total)}</span>
                </div>
                {service.alerts.length > 0 && (
                  <div className="space-y-1">
                    {service.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800"
                      >
                        <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                        <span className="text-xs text-red-800 dark:text-red-200">{alert}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

