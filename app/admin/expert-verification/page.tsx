"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getAllExpertProfilesAction,
  approveExpertProfileAction,
  rejectExpertProfileAction,
  revokeExpertProfileAction,
} from "@/lib/actions/expert"
import type { ExpertProfile } from "@/lib/types"
import { CheckCircle, XCircle, Clock, User, FileText, Eye, Ban } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { canUserModerate } from "@/lib/utils/comments"
import { getUserById } from "@/lib/storage"

export default function AdminExpertVerificationPage() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<ExpertProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<ExpertProfile | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [viewFilesDialogOpen, setViewFilesDialogOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "expired" | "revoked">("pending")
  const [loading, setLoading] = useState(true)

  const canModerate = canUserModerate(user)

  useEffect(() => {
    loadProfiles()
  }, [filter])

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const statusMap: Record<string, "pending" | "verified" | "expired" | "revoked" | undefined> = {
        pending: "pending",
        verified: "verified",
        expired: "expired",
        revoked: "revoked",
        all: undefined,
      }
      const allProfiles = await getAllExpertProfilesAction(statusMap[filter])
      setProfiles(allProfiles)
    } catch (error) {
      console.error("Error loading profiles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedProfile || !user?.id) return

    const result = await approveExpertProfileAction(
      selectedProfile.id,
      user.id,
      reviewNotes || undefined,
      expiresAt || undefined
    )
    if (result.success) {
      await loadProfiles()
      setApproveDialogOpen(false)
      setReviewNotes("")
      setExpiresAt("")
      setSelectedProfile(null)
    } else {
      alert(`Failed to approve: ${result.error}`)
    }
  }

  const handleReject = (profile: ExpertProfile) => {
    setSelectedProfile(profile)
    setRejectDialogOpen(true)
  }

  const confirmReject = async () => {
    if (!selectedProfile || !user?.id) return

    const result = await rejectExpertProfileAction(
      selectedProfile.id,
      user.id,
      reviewNotes || "Rejected by admin"
    )
    if (result.success) {
      await loadProfiles()
      setRejectDialogOpen(false)
      setReviewNotes("")
      setSelectedProfile(null)
    } else {
      alert(`Failed to reject: ${result.error}`)
    }
  }

  const handleRevoke = (profile: ExpertProfile) => {
    setSelectedProfile(profile)
    setRevokeDialogOpen(true)
  }

  const confirmRevoke = async () => {
    if (!selectedProfile || !user?.id) return

    const result = await revokeExpertProfileAction(
      selectedProfile.id,
      user.id,
      reviewNotes || "Revoked by admin"
    )
    if (result.success) {
      await loadProfiles()
      setRevokeDialogOpen(false)
      setReviewNotes("")
      setSelectedProfile(null)
    } else {
      alert(`Failed to revoke: ${result.error}`)
    }
  }

  const getStatusBadge = (status: ExpertProfile["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="default" className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "verified":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="default" className="bg-orange-500">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      case "revoked":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        )
    }
  }

  const getUserName = (userId: string): string => {
    const userData = getUserById(userId)
    return userData?.username || userData?.fullName || userId
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canModerate) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingCount = profiles.filter((p) => p.status === "pending").length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Expert Verification Requests</h1>
        <p className="text-muted-foreground">Review and manage expert verification profiles</p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="revoked">Revoked</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "pending"
                  ? "Pending Requests"
                  : filter === "verified"
                  ? "Verified Experts"
                  : filter === "expired"
                  ? "Expired Profiles"
                  : filter === "revoked"
                  ? "Revoked Profiles"
                  : "All Profiles"}
              </CardTitle>
              <CardDescription>
                {loading
                  ? "Loading..."
                  : profiles.length === 0
                  ? "No profiles found"
                  : `${profiles.length} profile${profiles.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : profiles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No profiles found</p>
              ) : (
                <div className="space-y-4">
                  {profiles.map((profile) => {
                    const profileUser = getUserById(profile.userId)
                    return (
                      <div
                        key={profile.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(profile.status)}
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{getUserName(profile.userId)}</span>
                            {profileUser?.email && (
                              <span className="text-sm text-muted-foreground">
                                ({profileUser.email})
                              </span>
                            )}
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">Credential:</span> {profile.credential}
                            </div>
                            {profile.licenseNo && (
                              <div>
                                <span className="font-medium">License:</span> {profile.licenseNo}
                              </div>
                            )}
                            {profile.region && (
                              <div>
                                <span className="font-medium">Region:</span> {profile.region}
                              </div>
                            )}
                            {profile.expiresAt && (
                              <div>
                                <span className="font-medium">Expires:</span>{" "}
                                {new Date(profile.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                            <div className="text-muted-foreground">
                              Submitted: {new Date(profile.createdAt).toLocaleString()}
                            </div>
                            {profile.verifiedAt && (
                              <div className="text-muted-foreground">
                                Verified: {new Date(profile.verifiedAt).toLocaleString()}
                                {profile.reviewedBy && ` by ${getUserName(profile.reviewedBy)}`}
                              </div>
                            )}
                            {profile.reviewNotes && (
                              <div className="text-muted-foreground">
                                <span className="font-medium">Notes:</span> {profile.reviewNotes}
                              </div>
                            )}
                          </div>
                          {profile.documents && profile.documents.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProfile(profile)
                                setViewFilesDialogOpen(true)
                              }}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Documents ({profile.documents.length})
                            </Button>
                          )}
                        </div>
                        {profile.status === "pending" && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProfile(profile)
                                setApproveDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(profile)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {profile.status === "verified" && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRevoke(profile)}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Expert Verification</DialogTitle>
            <DialogDescription>
              Approve this expert verification request. You can optionally set an expiry date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="mt-1 text-sm text-muted-foreground">
                When this expert's verification should expire
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expert Verification</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this verification request.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="rejectNotes">Reason *</Label>
            <Textarea
              id="rejectNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Explain why this request is being rejected..."
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Expert Verification</DialogTitle>
            <DialogDescription>
              Revoke this expert's verification. They will no longer be able to approve revisions.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="revokeNotes">Reason *</Label>
            <Textarea
              id="revokeNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Explain why this verification is being revoked..."
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRevoke}>
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Documents Dialog */}
      <Dialog open={viewFilesDialogOpen} onOpenChange={setViewFilesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Documents</DialogTitle>
            <DialogDescription>
              Review the uploaded credential documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProfile?.documents?.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-sm text-muted-foreground">({doc.type})</span>
                </div>
                <div className="mt-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Document
                  </a>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewFilesDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
