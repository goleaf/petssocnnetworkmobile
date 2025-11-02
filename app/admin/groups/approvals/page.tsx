"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  Eye,
} from "lucide-react"
import Link from "next/link"
import {
  getGroups,
  getGroupById,
  getUserById,
  getPendingGroupApprovals,
  approveGroup,
  rejectGroup,
  getGroupApprovalByGroupId,
} from "@/lib/storage"
import type { Group, GroupApproval } from "@/lib/types"

export default function GroupApprovalsPage() {
  const { user } = useAuth()
  const [approvals, setApprovals] = useState<GroupApproval[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedApproval, setSelectedApproval] = useState<GroupApproval | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    loadApprovals()
  }, [])

  const loadApprovals = () => {
    const pending = getPendingGroupApprovals()
    setApprovals(pending)
    const allGroups = getGroups()
    setGroups(allGroups)
  }

  const filteredApprovals = approvals.filter((approval) => {
    if (!searchQuery) return true
    const group = groups.find((g) => g.id === approval.groupId)
    if (!group) return false
    const query = searchQuery.toLowerCase()
    return (
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query) ||
      group.slug.toLowerCase().includes(query)
    )
  })

  const handleApprove = (groupId: string) => {
    if (!user?.id) return
    approveGroup(groupId, user.id)
    loadApprovals()
  }

  const handleReject = (approval: GroupApproval) => {
    setSelectedApproval(approval)
    setRejectDialogOpen(true)
  }

  const confirmReject = () => {
    if (!selectedApproval || !user?.id || !rejectionReason.trim()) return
    rejectGroup(selectedApproval.groupId, user.id, rejectionReason)
    loadApprovals()
    setRejectDialogOpen(false)
    setRejectionReason("")
    setSelectedApproval(null)
  }

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/admin/groups">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Group Approvals
          </h1>
        </div>
        <p className="text-muted-foreground">Review and approve pending group creation requests</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mb-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Approvals ({filteredApprovals.length})
            </CardTitle>
            <CardDescription>Groups awaiting admin approval</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {filteredApprovals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No pending approvals</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => {
            const group = groups.find((g) => g.id === approval.groupId)
            if (!group) return null

            const owner = getUserById(group.ownerId)
            const requestedDate = new Date(approval.requestedAt)

            return (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{group.name}</CardTitle>
                        <Badge variant="outline" className="text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        <Badge variant={group.type === "open" ? "default" : group.type === "closed" ? "secondary" : "outline"}>
                          {group.type}
                        </Badge>
                        {group.visibility?.discoverable === false && (
                          <Badge variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{group.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Owner:</span>
                      <div className="font-medium">@{owner?.username || group.ownerId}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <div className="font-medium">{group.categoryId}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Members:</span>
                      <div className="font-medium">{group.memberCount}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested:</span>
                      <div className="font-medium">{requestedDate.toLocaleDateString()}</div>
                    </div>
                  </div>

                  {group.rules && group.rules.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Rules:</Label>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {group.rules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(group.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(approval)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Link href={`/admin/groups/${group.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Group</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason.trim()}>
              Reject Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

