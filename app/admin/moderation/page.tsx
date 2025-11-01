"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, CheckCircle, XCircle, Clock, FileEdit, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import {
  getEditRequests,
  getPendingEditRequests,
  getUserById,
  getBlogPostById,
  getWikiArticleBySlug,
  getPetById,
  updateEditRequest,
} from "@/lib/storage"
import {
  approveEditRequest,
  rejectEditRequest,
  getModerationStats,
  filterEditRequests,
  getPaginatedEditRequests,
  calculateEditAge,
  getEditRequestAuditTrail,
} from "@/lib/moderation"
import type { EditRequest, EditRequestFilter } from "@/lib/moderation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function ModerationPage() {
  const { user } = useAuth()
  const [editRequests, setEditRequests] = useState<EditRequest[]>([])
  const [stats, setStats] = useState(getModerationStats())
  const [filters, setFilters] = useState<EditRequestFilter>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showAuditTrail, setShowAuditTrail] = useState(false)

  const pageSize = 10

  useEffect(() => {
    loadEditRequests()
  }, [filters, currentPage])

  const loadEditRequests = () => {
    const paginated = getPaginatedEditRequests(filters, { page: currentPage, pageSize })
    setEditRequests(paginated.items)
    setStats(getModerationStats())
  }

  const handleFilterChange = (newFilters: Partial<EditRequestFilter>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }

  const handleApprove = async (requestId: string) => {
    if (!user?.id) return
    
    const result = approveEditRequest(requestId, user.id)
    if (result.success) {
      loadEditRequests()
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
  }

  const handleReject = (request: EditRequest) => {
    setSelectedRequest(request)
    setRejectDialogOpen(true)
  }

  const confirmReject = async () => {
    if (!selectedRequest || !user?.id) return

    const result = rejectEditRequest(selectedRequest.id, user.id, rejectReason)
    if (result.success) {
      loadEditRequests()
      setRejectDialogOpen(false)
      setRejectReason("")
      setSelectedRequest(null)
    } else {
      alert(`Failed to reject: ${result.error}`)
    }
  }

  const getContentTitle = (request: EditRequest): string => {
    try {
      if (request.type === "blog") {
        const post = getBlogPostById(request.contentId)
        return post?.title || request.contentId
      } else if (request.type === "wiki") {
        const article = getWikiArticleBySlug(request.contentId)
        return article?.title || request.contentId
      } else if (request.type === "pet") {
        const pet = getPetById(request.contentId)
        return pet?.name || request.contentId
      } else if (request.type === "user") {
        const user = getUserById(request.contentId)
        return user?.username || request.contentId
      }
    } catch (error) {
      console.error("Error getting content title:", error)
    }
    return request.contentId
  }

  const getAuthorName = (authorId: string): string => {
    const author = getUserById(authorId)
    return author?.username || authorId
  }

  const totalPages = Math.ceil(filterEditRequests(filters).length / pageSize)

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access moderation tools.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">Review and approve content edits</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApproved}</div>
            <p className="text-xs text-muted-foreground">Total approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRejected}</div>
            <p className="text-xs text-muted-foreground">Total rejected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <FileEdit className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgProcessingTime)}h</div>
            <p className="text-xs text-muted-foreground">Processing time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="type-filter">Content Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => handleFilterChange({ type: value === "all" ? undefined : value as any })}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="blog">Blog Posts</SelectItem>
                  <SelectItem value="wiki">Wiki Articles</SelectItem>
                  <SelectItem value="pet">Pet Profiles</SelectItem>
                  <SelectItem value="user">User Profiles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange({ status: value === "all" ? undefined : value as any })}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority-filter">Priority</Label>
              <Select
                value={filters.priority || "all"}
                onValueChange={(value) => handleFilterChange({ priority: value === "all" ? undefined : value as any })}
              >
                <SelectTrigger id="priority-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max-age">Max Age (hours)</Label>
              <Input
                id="max-age"
                type="number"
                placeholder="No limit"
                value={filters.maxAge || ""}
                onChange={(e) =>
                  handleFilterChange({ maxAge: e.target.value ? parseInt(e.target.value) : undefined })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Requests</CardTitle>
          <CardDescription>
            {stats.totalPending} pending review
            {stats.oldestPending && stats.oldestPending.status === "pending" && (
              <span className="ml-2 text-orange-600">
                Oldest: {calculateEditAge(stats.oldestPending.createdAt)}h ago
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No edit requests found</p>
          ) : (
            <>
              <div className="space-y-4">
                {editRequests.map((request) => (
                  <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={request.type === "blog" ? "default" : "secondary"}>
                          {request.type}
                        </Badge>
                        <Badge
                          variant={
                            request.priority === "high"
                              ? "destructive"
                              : request.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {request.priority || "low"}
                        </Badge>
                        <span className="font-medium">{getContentTitle(request)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Author: @{getAuthorName(request.authorId)}</div>
                        <div>Age: {calculateEditAge(request.createdAt)} hours ago</div>
                        <div className="mt-2">{request.changesSummary}</div>
                      </div>
                      {request.reviewedBy && (
                        <div className="text-sm">
                          Reviewed by @{getAuthorName(request.reviewedBy)} at{" "}
                          {new Date(request.reviewedAt || "").toLocaleString()}
                          {request.reason && (
                            <span className="ml-2 text-red-600">Reason: {request.reason}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowAuditTrail(true)
                          }}
                        >
                          History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Reject
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleApprove(request.id)}>
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Edit Request</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this edit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={showAuditTrail} onOpenChange={setShowAuditTrail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Trail</DialogTitle>
            <DialogDescription>Complete history of actions on this edit request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest &&
              getEditRequestAuditTrail(selectedRequest.id).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {log.action === "approved" && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {log.action === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
                    {log.action === "created" && <Clock className="h-5 w-5 text-blue-600" />}
                    {log.action === "priority_changed" && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">{log.action.replace("_", " ")}</div>
                    <div className="text-sm text-muted-foreground">
                      By @{getAuthorName(log.performedBy)} on {new Date(log.performedAt).toLocaleString()}
                    </div>
                    {log.reason && <div className="text-sm mt-1">Reason: {log.reason}</div>}
                    {log.metadata && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAuditTrail(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
