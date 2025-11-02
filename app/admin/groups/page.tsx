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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Shield,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Edit,
  Ban,
  UserPlus,
  FileText,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import {
  getGroups,
  getGroupById,
  updateGroup,
  getGroupMembersByGroupId,
  updateGroupMember,
  addGroupMember,
  getGroupBansByGroupId,
  getUserById,
  getGroupRuleTemplates,
  approveGroup,
  rejectGroup,
  getPendingGroupApprovals,
} from "@/lib/storage"
import type { Group, GroupMember, GroupRuleTemplate, GroupType } from "@/lib/types"

export default function AdminGroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | GroupType>("all")
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [modDialogOpen, setModDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [ruleTemplateDialogOpen, setRuleTemplateDialogOpen] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState(getPendingGroupApprovals())

  useEffect(() => {
    loadGroups()
    setPendingApprovals(getPendingGroupApprovals())
  }, [])

  const loadGroups = () => {
    let allGroups = getGroups()

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      allGroups = allGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query) ||
          g.slug.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      allGroups = allGroups.filter((g) => g.approvalStatus === statusFilter)
    }

    if (typeFilter !== "all") {
      allGroups = allGroups.filter((g) => g.type === typeFilter)
    }

    setGroups(allGroups)
  }

  useEffect(() => {
    loadGroups()
  }, [searchQuery, statusFilter, typeFilter])

  const handleApprove = (groupId: string) => {
    if (!user?.id) return
    approveGroup(groupId, user.id)
    loadGroups()
    setPendingApprovals(getPendingGroupApprovals())
  }

  const handleReject = (groupId: string) => {
    if (!user?.id || !selectedGroup) return
    const reason = prompt("Enter rejection reason:")
    if (reason) {
      rejectGroup(groupId, user.id, reason)
      loadGroups()
      setPendingApprovals(getPendingGroupApprovals())
      setSelectedGroup(null)
    }
  }

  const handleUpdateGroup = (groupId: string, updates: Partial<Group>) => {
    updateGroup(groupId, updates)
    loadGroups()
    if (selectedGroup?.id === groupId) {
      const updated = getGroupById(groupId)
      if (updated) setSelectedGroup(updated)
    }
    setEditDialogOpen(false)
  }

  const handleAssignMod = (groupId: string, userId: string) => {
    const existingMember = getGroupMembersByGroupId(groupId).find((m) => m.userId === userId)
    if (existingMember) {
      updateGroupMember(existingMember.id, { role: "moderator" })
    } else {
      addGroupMember({
        id: `member_${Date.now()}`,
        groupId,
        userId,
        role: "moderator",
        joinedAt: new Date().toISOString(),
        status: "active",
      })
    }
    loadGroups()
    setModDialogOpen(false)
  }

  const handleApplyRuleTemplate = (groupId: string, templateId: string) => {
    const template = getGroupRuleTemplates().find((t) => t.id === templateId)
    if (template) {
      updateGroup(groupId, { rules: template.rules })
      setRuleTemplateDialogOpen(false)
      loadGroups()
    }
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
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Groups Management
        </h1>
        <p className="text-muted-foreground">Manage groups, approvals, moderators, rules, and banlists</p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="secret">Secret</SelectItem>
          </SelectContent>
        </Select>
        <Link href="/admin/groups/approvals">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Approvals ({pendingApprovals.length})
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Groups ({groups.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({groups.filter((g) => g.approvalStatus === "pending").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No groups found</p>
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => {
              const owner = getUserById(group.ownerId)
              const members = getGroupMembersByGroupId(group.id)
              const mods = members.filter((m) => m.role === "moderator" || m.role === "admin")
              const bans = getGroupBansByGroupId(group.id).filter((b) => b.isActive)

              return (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{group.name}</CardTitle>
                          <Badge variant={group.type === "open" ? "default" : group.type === "closed" ? "secondary" : "outline"}>
                            {group.type}
                          </Badge>
                          {group.approvalStatus === "pending" && (
                            <Badge variant="outline" className="text-yellow-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {group.approvalStatus === "approved" && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {group.approvalStatus === "rejected" && (
                            <Badge variant="outline" className="text-red-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                          {group.visibility?.discoverable === false && (
                            <Badge variant="outline">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Link href={`/admin/groups/${group.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Manage
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Owner:</span>
                        <div className="font-medium">@{owner?.username || group.ownerId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Members:</span>
                        <div className="font-medium">{group.memberCount}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Moderators:</span>
                        <div className="font-medium">{mods.length}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Banned:</span>
                        <div className="font-medium">{bans.length}</div>
                      </div>
                    </div>
                    {group.approvalStatus === "pending" && (
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(group.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(group.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {groups.filter((g) => g.approvalStatus === "pending").length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            groups
              .filter((g) => g.approvalStatus === "pending")
              .map((group) => {
                const owner = getUserById(group.ownerId)
                return (
                  <Card key={group.id}>
                    <CardHeader>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Owner:</span> @{owner?.username || group.ownerId}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Type:</span> {group.type}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Created:</span>{" "}
                          {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(group.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(group.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedGroup(group)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group settings and visibility</DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <EditGroupForm
              group={selectedGroup}
              onSave={(updates) => handleUpdateGroup(selectedGroup.id, updates)}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EditGroupForm({
  group,
  onSave,
  onCancel,
}: {
  group: Group
  onSave: (updates: Partial<Group>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const [type, setType] = useState<GroupType>(group.type)
  const [isDiscoverable, setIsDiscoverable] = useState(group.visibility?.discoverable !== false)
  const [contentVisibility, setContentVisibility] = useState<"everyone" | "members">(
    group.visibility?.content || "everyone",
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      description,
      type,
      visibility: {
        discoverable: isDiscoverable,
        content: contentVisibility,
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Group Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Group Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as GroupType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="secret">Secret</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="discoverable">Visibility</Label>
        <div className="space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="discoverable"
              checked={isDiscoverable}
              onChange={(e) => setIsDiscoverable(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="discoverable" className="cursor-pointer">
              Discoverable (Public)
            </Label>
          </div>
          <div>
            <Label htmlFor="content-visibility">Content Visibility</Label>
            <Select value={contentVisibility} onValueChange={(v) => setContentVisibility(v as any)}>
              <SelectTrigger id="content-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="members">Members Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  )
}

