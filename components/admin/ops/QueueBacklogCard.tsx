"use client"

import { type QueueBacklog } from "@/lib/types/ops"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"

interface QueueBacklogCardProps {
  queues: QueueBacklog[]
}

export function QueueBacklogCard({ queues }: QueueBacklogCardProps) {
  const totalPending = queues.reduce((sum, q) => sum + q.pending, 0)
  const totalFailed = queues.reduce((sum, q) => sum + q.failed, 0)
  const hasBacklog = totalPending > 100
  const hasFailures = totalFailed > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Queue Backlog
        </CardTitle>
        <CardDescription>
          Monitor queue status and processing times
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{totalPending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {queues.reduce((sum, q) => sum + q.processing, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Processing</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
          </div>

          {hasBacklog && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                High backlog detected: {totalPending} jobs pending
              </span>
            </div>
          )}

          {hasFailures && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-800 dark:text-red-200">
                {totalFailed} failed jobs require attention
              </span>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Queue Details</h4>
            <div className="space-y-2">
              {queues.map((queue) => (
                <div
                  key={queue.queueName}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{queue.queueName}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg: {queue.avgProcessingTime}ms
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{queue.pending}</div>
                      <div className="text-xs text-muted-foreground">pending</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{queue.processing}</div>
                      <div className="text-xs text-muted-foreground">active</div>
                    </div>
                    {queue.failed > 0 && (
                      <div className="text-right">
                        <div className="font-semibold text-red-600">{queue.failed}</div>
                        <div className="text-xs text-muted-foreground">failed</div>
                      </div>
                    )}
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

