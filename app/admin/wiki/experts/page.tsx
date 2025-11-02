"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Clock, Calendar, Ban, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ExpertProfile {
  userId: string
  credential: string
  licenseNo?: string | null
  region?: string | null
  status: "pending" | "verified" | "expired" | "revoked"
  verifiedAt?: string | null
  expiresAt?: string | null
}

export default function AdminWikiExpertsPage() {
  const [experts, setExperts] = useState<ExpertProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "expired">("pending")
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [extendMonths, setExtendMonths] = useState("12")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadExperts()
  }, [activeTab])

  const loadExperts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/wiki/experts?status=${activeTab}`)
      if (!response.ok) {
        throw new Error("Failed to load experts")
      }
      const data = await response.json()
      setExperts(data.experts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load experts")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!selectedExpert) return

    try {
      const response = await fetch("/api/admin/wiki/experts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedExpert.userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to verify expert")
      }

      setSuccess("Expert verified successfully")
      setVerifyDialogOpen(false)
      setSelectedExpert(null)
      await loadExperts()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify expert")
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleRevoke = async () => {
    if (!selectedExpert) return

    try {
      const response = await fetch("/api/admin/wiki/experts/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedExpert.userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to revoke expert")
      }

      setSuccess("Expert revoked successfully")
      setRevokeDialogOpen(false)
      setSelectedExpert(null)
      await loadExperts()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke expert")
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleExtend = async () => {
    if (!selectedExpert || !extendMonths) return

    const months = parseInt(extendMonths, 10)
    if (isNaN(months) || months < 1) {
      setError("Please enter a valid number of months")
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      const response = await fetch("/api/admin/wiki/experts/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedExpert.userId, months }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to extend expert")
      }

      setSuccess(`Expert extended by ${months} months`)
      setExtendDialogOpen(false)
      setSelectedExpert(null)
      setExtendMonths("12")
      await loadExperts()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend expert")
      setTimeout(() => setError(null), 5000)
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wiki Experts Management</h1>
        <p className="text-muted-foreground">Manage expert verification and access</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "verified" | "expired")}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({experts.filter((e) => e.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({experts.filter((e) => e.status === "verified").length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({experts.filter((e) => e.status === "expired").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "pending"
                  ? "Pending Experts"
                  : activeTab === "verified"
                  ? "Verified Experts"
                  : "Expired Experts"}
              </CardTitle>
              <CardDescription>
                {loading
                  ? "Loading..."
                  : experts.length === 0
                  ? "No experts found"
                  : `${experts.length} expert${experts.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading...</div>
              ) : experts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No experts found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Credential</th>
                        <th className="py-3 px-4">License No</th>
                        <th className="py-3 px-4">Region</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Verified At</th>
                        <th className="py-3 px-4">Expires At</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {experts.map((expert) => (
                        <tr key={expert.userId} className="border-b last:border-none hover:bg-accent/50">
                          <td className="py-3 px-4 font-mono text-xs">{expert.userId.slice(0, 8)}...</td>
                          <td className="py-3 px-4">{expert.credential}</td>
                          <td className="py-3 px-4">{expert.licenseNo || "N/A"}</td>
                          <td className="py-3 px-4">{expert.region || "N/A"}</td>
                          <td className="py-3 px-4">{getStatusBadge(expert.status)}</td>
                          <td className="py-3 px-4">{formatDate(expert.verifiedAt)}</td>
                          <td className="py-3 px-4">{formatDate(expert.expiresAt)}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {expert.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedExpert(expert)
                                    setVerifyDialogOpen(true)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                              )}
                              {(expert.status === "verified" || expert.status === "expired") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedExpert(expert)
                                      setRevokeDialogOpen(true)
                                    }}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />
                                    Revoke
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedExpert(expert)
                                      setExtendDialogOpen(true)
                                    }}
                                  >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Extend
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Expert</DialogTitle>
            <DialogDescription>
              Verify this expert. Verification will expire in 1 year from now.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              User ID: <span className="font-mono">{selectedExpert?.userId}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Credential: <span className="font-medium">{selectedExpert?.credential}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Expert</DialogTitle>
            <DialogDescription>
              Revoke this expert's verification. They will no longer be able to approve wiki revisions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              User ID: <span className="font-mono">{selectedExpert?.userId}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Credential: <span className="font-medium">{selectedExpert?.credential}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke}>
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Expert Verification</DialogTitle>
            <DialogDescription>
              Extend this expert's verification expiration date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                User ID: <span className="font-mono">{selectedExpert?.userId}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Current expires: {formatDate(selectedExpert?.expiresAt)}
              </p>
            </div>
            <div>
              <Label htmlFor="months">Months to extend</Label>
              <Input
                id="months"
                type="number"
                min="1"
                value={extendMonths}
                onChange={(e) => setExtendMonths(e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtend}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

