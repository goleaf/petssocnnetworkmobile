"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Download,
  Trash2,
  EyeOff,
  Filter,
  RefreshCw,
  FileText,
  User,
} from "lucide-react"
import type { PrivacyRequest, PrivacyRequestType, PrivacyRequestStatus, PrivacyRequestMetrics } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format, differenceInMinutes, isAfter } from "date-fns"

export default function PrivacyManagementPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"requests" | "metrics">("requests")
  
  const [requests, setRequests] = useState<PrivacyRequest[]>([])
  const [metrics, setMetrics] = useState<PrivacyRequestMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    status?: PrivacyRequestStatus
    type?: PrivacyRequestType
    priority?: string
  }>({})
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"assign" | "complete" | "reject" | null>(null)
  const [actionNotes, setActionNotes] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch requests from API
  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append("status", filters.status)
      if (filters.type) params.append("type", filters.type)
      if (filters.priority) params.append("priority", filters.priority)
      if (searchQuery) params.append("search", searchQuery)

      const response = await fetch(`/api/admin/privacy?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch requests")
      }
      const data = await response.json()
      setRequests(data.requests || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests")
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch metrics from API
  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/privacy/metrics")
      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }
      const data = await response.json()
      setMetrics(data.metrics)
    } catch (err) {
      console.error("Error fetching metrics:", err)
    }
  }

  // Initial load
  useEffect(() => {
    fetchRequests()
    fetchMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when filters change
  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type, filters.priority])

  // Refetch when search query changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests()
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Calculate SLA status and remaining time
  const calculateSlaStatus = (request: PrivacyRequest) => {
    const now = new Date()
    const deadline = new Date(request.slaDeadline)
    const minutesRemaining = differenceInMinutes(deadline, now)
    
    if (request.status === "completed" || request.status === "rejected") {
      return { status: "completed", minutesRemaining: 0, isWarning: false }
    }
    
    if (isAfter(now, deadline)) {
      return { status: "overdue", minutesRemaining: minutesRemaining, isWarning: true }
    }
    
    if (minutesRemaining <= request.slaWarningThreshold) {
      return { status: "warning", minutesRemaining: minutesRemaining, isWarning: true }
    }
    
    return { status: "normal", minutesRemaining: minutesRemaining, isWarning: false }
  }

  const formatTimeRemaining = (minutes: number) => {
    if (minutes < 0) return `${Math.abs(minutes)}m overdue`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "destructive"
      case "normal":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: PrivacyRequestStatus) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "pending":
        return "outline"
      case "rejected":
        return "destructive"
      case "cancelled":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: PrivacyRequestType) => {
    switch (type) {
      case "data_export":
        return <Download className="h-4 w-4" />
      case "data_deletion":
        return <Trash2 className="h-4 w-4" />
      case "content_takedown":
        return <EyeOff className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: PrivacyRequestType) => {
    switch (type) {
      case "data_export":
        return "Data Export"
      case "data_deletion":
        return "Data Deletion"
      case "content_takedown":
        return "Content Takedown"
      default:
        return type
    }
  }

  // Filtering is now handled server-side via API, but we keep client-side filtering for searchQuery
  const filteredRequests = requests.filter((req) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!req.id.toLowerCase().includes(query) && 
          !req.userId.toLowerCase().includes(query) &&
          !getTypeLabel(req.type).toLowerCase().includes(query)) {
        return false
      }
    }
    return true
  })

  const handleRequestAction = (request: PrivacyRequest, action: "assign" | "complete" | "reject") => {
    setSelectedRequest(request)
    setActionType(action)
    setActionNotes("")
    setActionDialogOpen(true)
  }

  const submitAction = async () => {
    if (!selectedRequest || !actionType) return
    
    try {
      const body: any = {
        action: actionType,
      }
      
      if (actionType === "reject") {
        body.rejectionReason = actionNotes
      } else if (actionNotes) {
        body.notes = actionNotes
      }

      const response = await fetch(`/api/admin/privacy/${selectedRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to update request")
      }

      // Refresh requests
      await fetchRequests()
      await fetchMetrics()
      
      setActionDialogOpen(false)
      setSelectedRequest(null)
      setActionType(null)
      setActionNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request")
      console.error("Error updating request:", err)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Privacy Management</h1>
          <p className="text-muted-foreground">Manage data export, deletion, and content takedown requests</p>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                SLA compliance: {metrics.slaComplianceRate}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                Overdue: {metrics.overdueRequests}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.inProgressRequests}</div>
              <p className="text-xs text-muted-foreground">
                Avg time: {metrics.averageCompletionTime}h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completedRequests}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "requests" | "metrics")}>
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by ID, user ID, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value as PrivacyRequestStatus })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => setFilters({ ...filters, type: value === "all" ? undefined : value as PrivacyRequestType })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="data_export">Data Export</SelectItem>
                    <SelectItem value="data_deletion">Data Deletion</SelectItem>
                    <SelectItem value="content_takedown">Content Takedown</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.priority || "all"}
                  onValueChange={(value) => setFilters({ ...filters, priority: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading requests...</p>
              </CardContent>
            </Card>
          )}

          {/* Requests List */}
          {!loading && (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
              const slaStatus = calculateSlaStatus(request)
              
              return (
                <Card
                  key={request.id}
                  className={`transition-all hover:shadow-md ${
                    slaStatus.status === "overdue" || slaStatus.status === "warning"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                      : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          {getTypeIcon(request.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status === "in_progress" ? "In Progress" : request.status}
                            </Badge>
                            <Badge variant={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                            <span className="text-sm font-medium">{getTypeLabel(request.type)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              User: {request.userId}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Requested: {format(new Date(request.requestedAt), "MMM d, HH:mm")}
                            </span>
                          </div>
                          {request.metadata && (
                            <div className="text-sm text-muted-foreground">
                              {request.metadata.reason && <span>Reason: {request.metadata.reason}</span>}
                              {request.metadata.contentType && <span>Content: {request.metadata.contentType}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {slaStatus.status === "overdue" && (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          {slaStatus.status === "warning" && (
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                          )}
                          <Badge
                            variant={
                              slaStatus.status === "overdue"
                                ? "destructive"
                                : slaStatus.status === "warning"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {formatTimeRemaining(slaStatus.minutesRemaining)}
                          </Badge>
                        </div>
                        {request.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestAction(request, "assign")}
                          >
                            Assign to Me
                          </Button>
                        )}
                        {request.status === "in_progress" && request.assignedTo === user?.id && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestAction(request, "complete")}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestAction(request, "reject")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            </div>
          )}

          {!loading && filteredRequests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No requests found matching your filters</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Requests by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.requestsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{getTypeLabel(type as PrivacyRequestType)}</span>
                        <Badge>{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Requests by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.requestsByPriority).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{priority}</span>
                        <Badge variant={getPriorityColor(priority)}>{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading metrics...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "assign" && "Assign Request"}
              {actionType === "complete" && "Complete Request"}
              {actionType === "reject" && "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "assign" && "Assign this request to yourself and start processing it."}
              {actionType === "complete" && "Mark this request as completed."}
              {actionType === "reject" && "Reject this request. Provide a reason."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  <Badge>{getTypeLabel(selectedRequest.type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">User ID:</span>
                  <span className="text-sm">{selectedRequest.userId}</span>
                </div>
                {selectedRequest.metadata?.reason && (
                  <div>
                    <span className="text-sm font-medium">Reason: </span>
                    <span className="text-sm">{selectedRequest.metadata.reason}</span>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {actionType === "reject" ? "Rejection Reason:" : "Notes:"}
              </label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionType === "reject"
                    ? "Please provide a reason for rejection..."
                    : "Add any notes about this action..."
                }
                rows={4}
                required={actionType === "reject"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              disabled={actionType === "reject" && !actionNotes.trim()}
            >
              {actionType === "assign" && "Assign"}
              {actionType === "complete" && "Complete"}
              {actionType === "reject" && "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

