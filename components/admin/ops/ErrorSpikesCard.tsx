"use client"

import { type ErrorSpike } from "@/lib/types/ops"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface ErrorSpikesCardProps {
  errorSpikes: ErrorSpike[]
}

export function ErrorSpikesCard({ errorSpikes }: ErrorSpikesCardProps) {
  const getSeverityColor = (severity: ErrorSpike["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
      case "high":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
      case "low":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
    }
  }

  const criticalCount = errorSpikes.filter((e) => e.severity === "critical").length
  const recentSpikes = errorSpikes.slice(-24) // Last 24 data points
  const hasRecentSpikes = errorSpikes.some(
    (e) => new Date(e.timestamp).getTime() > Date.now() - 3600000
  )

  const chartData = recentSpikes.map((spike) => ({
    time: new Date(spike.timestamp).toLocaleTimeString(),
    count: spike.count,
    severity: spike.severity,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Error Spikes
        </CardTitle>
        <CardDescription>
          Track error patterns and spikes over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
              <div className="text-sm text-muted-foreground">Critical Errors</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{errorSpikes.length}</div>
              <div className="text-sm text-muted-foreground">Total Spikes</div>
            </div>
          </div>

          {hasRecentSpikes && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">
                Recent error spikes detected in the last hour
              </span>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Recent Error Spikes</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {errorSpikes
                .slice()
                .reverse()
                .slice(0, 10)
                .map((spike, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getSeverityColor(spike.severity)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium uppercase text-xs">{spike.severity}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(spike.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{spike.count} errors</div>
                    <div className="text-xs mt-1">{spike.errorType}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {spike.message}
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

