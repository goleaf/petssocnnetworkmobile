/**
 * Admin Wiki Revision Detail Page
 * 
 * Shows side-by-side diff, stable vs latest toggle, and actions
 */

"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DiffViewer } from "@/components/diff-viewer"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Clock, UserCheck, RotateCcw, CheckCircle2, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface FlaggedRevision {
  id: string
  articleId: string
  revisionId: string
  type: "Health" | "Regulation"
  flaggedAt: string
  status: "pending" | "approved" | "changes-requested" | "rolled-back"
  assignedTo?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
}

interface Revision {
  id: string
  content: string
  createdAt: string
  authorId: string
}

interface Article {
  id: string
  title: string
  slug: string
}

export default function RevisionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string

  const [flaggedRevision, setFlaggedRevision] = useState<FlaggedRevision | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [flaggedRevisionData, setFlaggedRevisionData] = useState<Revision | null>(null)
  const [stableRevision, setStableRevision] = useState<Revision | null>(null)
  const [latestRevision, setLatestRevision] = useState<Revision | null>(null)
  const [experts, setExperts] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"stable" | "latest">("stable")
  const [requestChangesOpen, setRequestChangesOpen] = useState(false)
  const [requestChangesComment, setRequestChangesComment] = useState("")
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load flagged revision
      const frRes = await fetch(`/api/admin/wiki/revisions/${id}`)
      if (!frRes.ok) {
        throw new Error("Failed to load flagged revision")
      }
      const frData = await frRes.json()
      setFlaggedRevision(frData.flaggedRevision)
      setFlaggedRevisionData(frData.revision)
      setArticle(frData.article)
      setStableRevision(frData.stableRevision)
      setLatestRevision(frData.latestRevision)
      setExperts(frData.experts || [])

      // Set default view mode based on what's available
      if (frData.stableRevision && frData.latestRevision) {
        setViewMode("stable")
      } else if (frData.latestRevision) {
        setViewMode("latest")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load revision")
    } finally {
      setLoading(false)
    }
  }

  const isStale = flaggedRevision
    ? new Date(flaggedRevision.flaggedAt).getTime() <
      Date.now() - 12 * 30 * 24 * 60 * 60 * 1000
    : false

  const canApprove = user && (user.role === "admin" || user.role === "moderator")
  const isExpert = user && (user.role === "admin" || user.role === "moderator" || user.badge === "vet")

  const handleRequestChanges = async () => {
    if (!requestChangesComment.trim()) {
      alert("Please provide a comment")
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/wiki/revisions/${id}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: requestChangesComment }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to request changes")
      }

      setRequestChangesOpen(false)
      setRequestChangesComment("")
      await loadData()
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to request changes")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApprove = async () => {
    if (!isExpert) {
      alert("Only Experts and Moderators can approve stable revisions")
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/wiki/revisions/${id}/approve`, {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to approve revision")
      }

      setApproveDialogOpen(false)
      await loadData()
      router.refresh()
      router.push("/admin/wiki/revisions")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve revision")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRollback = async () => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/wiki/revisions/${id}/rollback`, {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to rollback revision")
      }

      setRollbackDialogOpen(false)
      await loadData()
      router.refresh()
      router.push("/admin/wiki/revisions")
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rollback revision")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAssignToExpert = async (expertId: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch(`/api/admin/wiki/revisions/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to assign expert")
      }

      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign expert")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading revision...</div>
      </div>
    )
  }

  if (error || !flaggedRevision || !flaggedRevisionData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Revision not found"}</AlertDescription>
      </Alert>
    )
  }

  const comparisonRevision = viewMode === "stable" ? stableRevision : latestRevision
  const leftTitle = viewMode === "stable" ? "Stable Version" : "Previous Version"
  const rightTitle = "Flagged Revision"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Review Flagged Revision</h1>
            {isStale && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                Stale review
              </Badge>
            )}
            <Badge variant={flaggedRevision.type === "Health" ? "destructive" : "secondary"}>
              {flaggedRevision.type}
            </Badge>
            <Badge variant="outline">{flaggedRevision.status}</Badge>
          </div>
          {article && (
            <p className="text-muted-foreground">
              Article: <span className="font-medium">{article.title}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Flagged {formatDistanceToNow(new Date(flaggedRevision.flaggedAt), { addSuffix: true })}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/wiki/revisions")}>
          Back to List
        </Button>
      </div>

      {/* Quick Assign */}
      {flaggedRevision.status === "pending" && experts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Quick Assign to Expert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={flaggedRevision.assignedTo || ""}
              onValueChange={(value) => handleAssignToExpert(value)}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select an expert..." />
              </SelectTrigger>
              <SelectContent>
                {experts.map((expert) => (
                  <SelectItem key={expert.id} value={expert.id}>
                    {expert.name} ({expert.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      {stableRevision && latestRevision && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label>Compare with:</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "stable" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("stable")}
                >
                  Stable Version
                </Button>
                <Button
                  variant={viewMode === "latest" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("latest")}
                >
                  Latest Version
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diff Viewer */}
      {comparisonRevision && (
        <DiffViewer
          oldValue={comparisonRevision.content}
          newValue={flaggedRevisionData.content}
          leftTitle={leftTitle}
          rightTitle={rightTitle}
        />
      )}

      {/* Actions */}
      {flaggedRevision.status === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setRequestChangesOpen(true)}
              disabled={isProcessing}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
            {isExpert && (
              <Button
                variant="default"
                onClick={() => setApproveDialogOpen(true)}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Stable
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setRollbackDialogOpen(true)}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rollback
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request Changes Dialog */}
      <Dialog open={requestChangesOpen} onOpenChange={setRequestChangesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback on what needs to be changed in this revision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={requestChangesComment}
                onChange={(e) => setRequestChangesComment(e.target.value)}
                placeholder="Describe what changes are needed..."
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestChangesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestChanges} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Request Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Stable Revision</DialogTitle>
            <DialogDescription>
              This will mark the flagged revision as the new stable version. Only Experts and
              Moderators can perform this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing || !isExpert}>
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rollback Dialog */}
      <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rollback Revision</DialogTitle>
            <DialogDescription>
              This will rollback the article to the stable version and mark this revision as
              rolled-back. This action will be audited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRollback} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Rollback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
