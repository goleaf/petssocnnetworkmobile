"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Users, AlertTriangle, Search, Building2 } from "lucide-react"
import { Organization, RepresentativeRole } from "@/lib/types"
import { getOrganizations, updateOrganization } from "@/lib/storage"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssigningRole, setIsAssigningRole] = useState(false)
  const [newRepresentative, setNewRepresentative] = useState({
    userId: "",
    role: "representative" as RepresentativeRole,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrgs(orgs)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredOrgs(
        orgs.filter(
          (org) =>
            org.name.toLowerCase().includes(query) ||
            org.type.toLowerCase().includes(query) ||
            org.website?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, orgs])

  const loadOrganizations = () => {
    try {
      const allOrgs = getOrganizations()
      setOrgs(allOrgs)
      setFilteredOrgs(allOrgs)
    } catch (err) {
      setError("Failed to load organizations")
    }
  }

  const handleVerifyToggle = async (org: Organization) => {
    try {
      const updates: Partial<Organization> = {
        verifiedAt: org.verifiedAt ? undefined : new Date().toISOString(),
        verifiedBy: org.verifiedAt ? undefined : "admin", // In real app, use actual admin user ID
        updatedAt: new Date().toISOString(),
      }
      updateOrganization(org.id, updates)
      setSuccess(org.verifiedAt ? "Organization unverified" : "Organization verified")
      setTimeout(() => setSuccess(null), 3000)
      loadOrganizations()
    } catch (err) {
      setError("Failed to update verification status")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleCOIToggle = async (org: Organization, required: boolean) => {
    try {
      const updates: Partial<Organization> = {
        coiDisclosure: {
          required,
          disclosed: org.coiDisclosure?.disclosed || false,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: "admin", // In real app, use actual admin user ID
        },
        updatedAt: new Date().toISOString(),
      }
      updateOrganization(org.id, updates)
      setSuccess(`COI disclosure ${required ? "enabled" : "disabled"}`)
      setTimeout(() => setSuccess(null), 3000)
      loadOrganizations()
    } catch (err) {
      setError("Failed to update COI disclosure settings")
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedOrg || !newRepresentative.userId.trim()) {
      setError("Please provide a user ID")
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsAssigningRole(true)
    try {
      const currentReps = selectedOrg.representatives || []
      const existingIndex = currentReps.findIndex((r) => r.userId === newRepresentative.userId)
      
      const updatedReps = existingIndex >= 0
        ? currentReps.map((r, idx) =>
            idx === existingIndex
              ? { ...r, role: newRepresentative.role, assignedAt: new Date().toISOString(), assignedBy: "admin" }
              : r
          )
        : [
            ...currentReps,
            {
              userId: newRepresentative.userId,
              role: newRepresentative.role,
              assignedAt: new Date().toISOString(),
              assignedBy: "admin",
            },
          ]

      updateOrganization(selectedOrg.id, {
        representatives: updatedReps,
        updatedAt: new Date().toISOString(),
      })

      setSuccess("Representative role assigned successfully")
      setTimeout(() => setSuccess(null), 3000)
      setIsDialogOpen(false)
      setNewRepresentative({ userId: "", role: "representative" })
      loadOrganizations()
    } catch (err) {
      setError("Failed to assign role")
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAssigningRole(false)
    }
  }

  const handleRemoveRepresentative = async (org: Organization, userId: string) => {
    try {
      const currentReps = org.representatives || []
      const updatedReps = currentReps.filter((r) => r.userId !== userId)
      updateOrganization(org.id, {
        representatives: updatedReps,
        updatedAt: new Date().toISOString(),
      })
      setSuccess("Representative removed")
      setTimeout(() => setSuccess(null), 3000)
      loadOrganizations()
    } catch (err) {
      setError("Failed to remove representative")
      setTimeout(() => setError(null), 3000)
    }
  }

  const openAssignRoleDialog = (org: Organization) => {
    setSelectedOrg(org)
    setIsDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage shelters, brands, and other organizations
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Representatives</TableHead>
                  <TableHead>COI Disclosure</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No organizations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{org.name}</div>
                            {org.website && (
                              <div className="text-sm text-muted-foreground">{org.website}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {org.verifiedAt ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {org.representatives?.length || 0} representative
                            {(org.representatives?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {org.coiDisclosure?.required ? (
                            <Badge variant="default" className="bg-blue-600">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Not Required</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyToggle(org)}
                          >
                            {org.verifiedAt ? "Unverify" : "Verify"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAssignRoleDialog(org)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Manage Roles
                          </Button>
                          <Switch
                            checked={org.coiDisclosure?.required || false}
                            onCheckedChange={(checked) => handleCOIToggle(org, checked)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Representatives</DialogTitle>
            <DialogDescription>
              Assign representative roles for {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Current Representatives</h3>
              {selectedOrg?.representatives && selectedOrg.representatives.length > 0 ? (
                <div className="space-y-2">
                  {selectedOrg.representatives.map((rep) => (
                    <div
                      key={rep.userId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">User ID: {rep.userId}</div>
                        <div className="text-sm text-muted-foreground">
                          Role: <Badge variant="outline">{rep.role}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Assigned: {new Date(rep.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (selectedOrg) {
                            handleRemoveRepresentative(selectedOrg, rep.userId)
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No representatives assigned</p>
              )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Add New Representative</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={newRepresentative.userId}
                    onChange={(e) =>
                      setNewRepresentative({ ...newRepresentative, userId: e.target.value })
                    }
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newRepresentative.role}
                    onValueChange={(value) =>
                      setNewRepresentative({ ...newRepresentative, role: value as RepresentativeRole })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="representative">Representative</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAssignRole} disabled={isAssigningRole}>
                  {isAssigningRole ? "Assigning..." : "Assign Role"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

