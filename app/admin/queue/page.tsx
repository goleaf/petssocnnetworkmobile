"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { QueueJob, JobType, JobStatus } from "@/lib/types/queue"

interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  byType: Record<
    string,
    {
      total: number
      pending: number
      processing: number
      completed: number
      failed: number
    }
  >
}

export default function QueueManagementPage() {
  const [jobs, setJobs] = useState<QueueJob[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedJob, setSelectedJob] = useState<QueueJob | null>(null)

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== "all") {
        params.set("type", selectedType)
      }
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus)
      }
      params.set("limit", "100")

      const response = await fetch(`/api/queue?${params.toString()}`)
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Failed to fetch jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/queue/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchStats()
    const interval = setInterval(() => {
      fetchJobs()
      fetchStats()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [selectedType, selectedStatus])

  const handleRetry = async (jobId: string) => {
    try {
      const response = await fetch(`/api/queue/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "retry" }),
      })

      if (response.ok) {
        fetchJobs()
        fetchStats()
      }
    } catch (error) {
      console.error("Failed to retry job:", error)
    }
  }

  const handleEnqueue = async (
    type: JobType,
    payload: Record<string, unknown>
  ) => {
    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          payload,
          processNow: true,
        }),
      })

      if (response.ok) {
        fetchJobs()
        fetchStats()
      }
    } catch (error) {
      console.error("Failed to enqueue job:", error)
    }
  }

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage background jobs
          </p>
        </div>
        <Button onClick={() => {
          fetchJobs()
          fetchStats()
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl">{stats.pending}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
              <CardTitle className="text-2xl">{stats.processing}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-2xl">{stats.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-2xl">{stats.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Enqueue common jobs</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Link Check
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enqueue Link Check Job</DialogTitle>
                <DialogDescription>
                  Check a URL for validity
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const url = formData.get("url") as string
                  if (url) {
                    handleEnqueue("linkCheck", { url })
                    e.currentTarget.reset()
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="url" className="text-sm font-medium">
                    URL
                  </label>
                  <input
                    id="url"
                    name="url"
                    type="url"
                    required
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="https://example.com"
                  />
                </div>
                <Button type="submit">Enqueue</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() =>
              handleEnqueue("rebuildSearchIndex", { type: "all" })
            }
          >
            <Play className="h-4 w-4 mr-2" />
            Rebuild Search Index
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="linkCheck">Link Check</SelectItem>
            <SelectItem value="notifyUser">Notify User</SelectItem>
            <SelectItem value="rebuildSearchIndex">Rebuild Index</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs</CardTitle>
          <CardDescription>
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No jobs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-[200px]">
                        <Progress value={job.progress} className="flex-1" />
                        <span className="text-sm text-muted-foreground">
                          {job.progress}%
                        </span>
                      </div>
                      {job.progressMessage && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {job.progressMessage}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          View
                        </Button>
                        {job.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRetry(job.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>Job ID: {selectedJob.id}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <div className="mt-1">
                  <Badge>{selectedJob.type}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Progress</label>
                <div className="mt-1">
                  <Progress value={selectedJob.progress} />
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedJob.progressMessage || "No message"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Payload</label>
                <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>
              {selectedJob.result && (
                <div>
                  <label className="text-sm font-medium">Result</label>
                  <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto">
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                </div>
              )}
              {selectedJob.error && (
                <div>
                  <label className="text-sm font-medium text-destructive">
                    Error
                  </label>
                  <div className="mt-1 p-2 bg-destructive/10 rounded-md text-sm text-destructive">
                    {selectedJob.error}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Created</label>
                  <div>{new Date(selectedJob.createdAt).toLocaleString()}</div>
                </div>
                {selectedJob.startedAt && (
                  <div>
                    <label className="text-muted-foreground">Started</label>
                    <div>
                      {new Date(selectedJob.startedAt).toLocaleString()}
                    </div>
                  </div>
                )}
                {selectedJob.completedAt && (
                  <div>
                    <label className="text-muted-foreground">Completed</label>
                    <div>
                      {new Date(selectedJob.completedAt).toLocaleString()}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-muted-foreground">Attempts</label>
                  <div>
                    {selectedJob.attempts} / {selectedJob.maxAttempts}
                  </div>
                </div>
              </div>
              {selectedJob.status === "failed" && (
                <Button onClick={() => handleRetry(selectedJob.id)}>
                  Retry Job
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

