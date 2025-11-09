"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { getModerationStats, getPaginatedEditRequests, approveEditRequest, rejectEditRequest, getEditRequestAuditTrail } from "@/lib/moderation";

type FilterType = "blog" | "wiki" | "pet" | "user" | undefined
type StatusType = "pending" | "approved" | "rejected" | undefined

export default function ModerationDashboardPage() {
  const { user } = useAuth()

  const [filters, setFilters] = useState<{ type?: FilterType; status?: StatusType; reporterId?: string; maxAge?: number }>({})
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [requests, setRequests] = useState<any[]>([])
  const [stats, setStats] = useState<{ totalPending: number; totalApproved: number; totalRejected: number }>({ totalPending: 0, totalApproved: 0, totalRejected: 0 })
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const s = getModerationStats()
    setStats({ totalPending: s.totalPending, totalApproved: s.totalApproved, totalRejected: s.totalRejected })
  }, [])

  useEffect(() => {
    const resp: any = getPaginatedEditRequests(filters as any, { page, pageSize })
    setRequests(resp.items as any[])
    if (typeof resp.totalPages === 'number') setTotalPages(resp.totalPages)
    if (typeof resp.page === 'number') setPage(resp.page)
  }, [filters, page, pageSize])

  const handleApprove = (id: string) => {
    if (!user) return
    approveEditRequest(id, (user as any).id || "moderator1")
  }

  const handleReject = (id: string) => {
    setActiveRequestId(id)
    setRejectReason("")
    setRejectOpen(true)
  }

  const submitReject = () => {
    if (!activeRequestId || !user) return
    rejectEditRequest(activeRequestId, (user as any).id || "moderator1", rejectReason || undefined)
    setRejectOpen(false)
  }

  const openHistory = (id: string) => {
    setActiveRequestId(id)
    setHistoryOpen(true)
    getEditRequestAuditTrail(id)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Content Moderation</h1>
      <div className="text-sm text-muted-foreground">Media Moderation Queue</div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Awaiting Review</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalPending}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Accepted</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalApproved}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Declined</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalRejected}</CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="filter-type">Content Type</Label>
            <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v as FilterType }))}>
              <SelectTrigger id="filter-type" aria-label="Content Type"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">Blog Posts</SelectItem>
                <SelectItem value="wiki">Wiki</SelectItem>
                <SelectItem value="pet">Pets</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-status">Status</Label>
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v as StatusType }))}>
              <SelectTrigger id="filter-status" aria-label="Status"><SelectValue placeholder="Any status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-reporter">Reporter</Label>
            <Input id="filter-reporter" placeholder="Filter by reporter" value={filters.reporterId || ""} onChange={(e) => setFilters((f) => ({ ...f, reporterId: e.target.value || undefined }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-age">Max Age (hours)</Label>
            <Input id="filter-age" placeholder="No limit" value={filters.maxAge?.toString() || ""} onChange={(e) => setFilters((f) => ({ ...f, maxAge: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Requests</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between border rounded p-3">
              <div className="space-y-1">
                <div className="font-medium">{r.type}: {r.contentId}</div>
                <div className="text-xs text-muted-foreground">{r.changesSummary || "Changed title"}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(r.id)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => handleReject(r.id)}>
                  {rejectOpen && activeRequestId === r.id ? 'Cancel' : 'Reject'}
                </Button>
                <Dialog open={historyOpen && activeRequestId === r.id} onOpenChange={setHistoryOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" onClick={() => openHistory(r.id)}>History</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Audit Trail</DialogTitle>
                      <DialogDescription>Review history for this request</DialogDescription>
                    </DialogHeader>
                    <div className="text-sm">Viewing history</div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div>Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{rejectReason ? 'Confirm Decision' : 'Reject Edit Request'}</DialogTitle>
            <DialogDescription>Provide a reason</DialogDescription>
          </DialogHeader>
          <Input placeholder="Enter rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button onClick={submitReject}>Reject</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
