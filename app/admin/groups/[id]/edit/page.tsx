"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Shield,
  Users,
  FileText,
  Ban,
  UserPlus,
  Settings,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Plus,
} from "lucide-react"
import Link from "next/link"
import {
  getGroupById,
  updateGroup,
  getGroupMembersByGroupId,
  updateGroupMember,
  addGroupMember,
  removeGroupMember,
  getGroupBansByGroupId,
  getUserBan,
  banGroupMember,
  unbanGroupMember,
  getUsers,
  getUserById,
  getGroupRuleTemplates,
  addGroupRuleTemplate,
  updateGroupRuleTemplate,
  deleteGroupRuleTemplate,
} from "@/lib/storage"
import type { Group, GroupMember, GroupBan, GroupRuleTemplate, GroupType, GroupMemberRole } from "@/lib/types"

export default function EditGroupPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [bans, setBans] = useState<GroupBan[]>([])
  const [ruleTemplates, setRuleTemplates] = useState<GroupRuleTemplate[]>([])
  const [modDialogOpen, setModDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [banReason, setBanReason] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<GroupRuleTemplate | null>(null)

  useEffect(() => {
    loadGroupData()
  }, [groupId])

  const loadGroupData = () => {
    const loadedGroup = getGroupById(groupId)
    if (!loadedGroup) {
      router.push("/admin/groups")
      return
    }
    setGroup(loadedGroup)
    setMembers(getGroupMembersByGroupId(groupId))
    setBans(getGroupBansByGroupId(groupId).filter((b) => b.isActive))
    setRuleTemplates(getGroupRuleTemplates())
  }

  const handleUpdateGroup = (updates: Partial<Group>) => {
    if (!group) return
    updateGroup(group.id, updates)
    loadGroupData()
  }

  const handleAssignMod = () => {
    if (!group || !selectedUserId) return
    const existingMember = members.find((m) => m.userId === selectedUserId)
    if (existingMember) {
      updateGroupMember(existingMember.id, { role: "moderator" })
    } else {
      addGroupMember({
        id: `member_${Date.now()}`,
        groupId: group.id,
        userId: selectedUserId,
        role: "moderator",
        joinedAt: new Date().toISOString(),
        status: "active",
      })
    }
    loadGroupData()
    setModDialogOpen(false)
    setSelectedUserId("")
  }

  const handleRemoveMod = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    if (member && member.role === "moderator") {
      updateGroupMember(memberId, { role: "member" })
      loadGroupData()
    }
  }

  const handleBanUser = () => {
    if (!group || !user || !selectedUserId) return
    const ban: GroupBan = {
      id: `ban_${Date.now()}`,
      groupId: group.id,
      userId: selectedUserId,
      bannedBy: user.id,
      reason: banReason || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    }
    banGroupMember(ban)
    loadGroupData()
    setBanDialogOpen(false)
    setSelectedUserId("")
    setBanReason("")
  }

  const handleUnbanUser = (userId: string) => {
    if (!group || !user) return
    unbanGroupMember(group.id, userId, user.id)
    loadGroupData()
  }

  const handleApplyTemplate = (templateId: string) => {
    if (!group) return
    const template = ruleTemplates.find((t) => t.id === templateId)
    if (template) {
      updateGroup(group.id, { rules: template.rules })
      loadGroupData()
    }
  }

  const handleSaveTemplate = (template: GroupRuleTemplate) => {
    if (template.id && ruleTemplates.find((t) => t.id === template.id)) {
      updateGroupRuleTemplate(template.id, template)
    } else {
      addGroupRuleTemplate({
        ...template,
        id: `template_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    setRuleTemplates(getGroupRuleTemplates())
    setTemplateDialogOpen(false)
    setSelectedTemplate(null)
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

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Group not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mods = members.filter((m) => m.role === "moderator" || m.role === "admin")
  const allUsers = getUsers()
  const availableUsers = allUsers.filter(
    (u) => !members.find((m) => m.userId === u.id) || members.find((m) => m.userId === u.id && m.role !== "moderator"),
  )

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
            <Settings className="h-8 w-8" />
            Manage Group: {group.name}
          </h1>
        </div>
        <p className="text-muted-foreground">Manage moderators, rules, bans, and visibility settings</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="moderators">Moderators ({mods.length})</TabsTrigger>
          <TabsTrigger value="rules">Rule Templates</TabsTrigger>
          <TabsTrigger value="bans">Banlist ({bans.length})</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Settings</CardTitle>
              <CardDescription>Update group information and visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <GroupSettingsForm group={group} onSave={handleUpdateGroup} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderators Tab */}
        <TabsContent value="moderators" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Moderators</CardTitle>
                  <CardDescription>Assign and manage group moderators</CardDescription>
                </div>
                <Button onClick={() => setModDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Moderator
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mods.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No moderators assigned</p>
              ) : (
                <div className="space-y-2">
                  {mods.map((mod) => {
                    const modUser = getUserById(mod.userId)
                    return (
                      <div key={mod.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">@{modUser?.username || mod.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              {modUser?.fullName || "Unknown"} • {mod.role}
                            </div>
                          </div>
                        </div>
                        {mod.role === "moderator" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMod(mod.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rule Templates Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rule Templates</CardTitle>
                  <CardDescription>Manage rule templates and apply them to groups</CardDescription>
                </div>
                <Button onClick={() => {
                  setSelectedTemplate(null)
                  setTemplateDialogOpen(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                {ruleTemplates.map((template) => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyTemplate(template.id)}
                        >
                          Apply to Group
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setTemplateDialogOpen(true)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!template.isDefault && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              deleteGroupRuleTemplate(template.id)
                              setRuleTemplates(getGroupRuleTemplates())
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {template.rules.map((rule, idx) => (
                        <li key={idx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {group.rules && group.rules.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <div className="font-medium mb-2">Current Group Rules:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {group.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banlist Tab */}
        <TabsContent value="bans" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Banlist</CardTitle>
                  <CardDescription>Manage banned users for this group</CardDescription>
                </div>
                <Button onClick={() => setBanDialogOpen(true)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bans.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No banned users</p>
              ) : (
                <div className="space-y-2">
                  {bans.map((ban) => {
                    const bannedUser = getUserById(ban.userId)
                    const bannedBy = getUserById(ban.bannedBy)
                    return (
                      <div key={ban.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Ban className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <div className="font-medium">@{bannedUser?.username || ban.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              Banned by @{bannedBy?.username || ban.bannedBy} • {new Date(ban.createdAt).toLocaleDateString()}
                            </div>
                            {ban.reason && (
                              <div className="text-sm text-muted-foreground mt-1">Reason: {ban.reason}</div>
                            )}
                            {ban.expiresAt && (
                              <div className="text-sm text-muted-foreground">
                                Expires: {new Date(ban.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(ban.userId)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unban
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Moderator Dialog */}
      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Moderator</DialogTitle>
            <DialogDescription>Select a user to assign as moderator</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      @{u.username} - {u.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignMod} disabled={!selectedUserId}>
              Assign Moderator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>Ban a user from this group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ban-user-select">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="ban-user-select">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => {
                    const isBanned = bans.some((b) => b.userId === u.id && b.isActive)
                    return (
                      <SelectItem key={u.id} value={u.id} disabled={isBanned}>
                        @{u.username} - {u.fullName} {isBanned && "(Already banned)"}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ban-reason">Reason (optional)</Label>
              <Textarea
                id="ban-reason"
                placeholder="Enter ban reason..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser} disabled={!selectedUserId}>
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? "Edit Template" : "Create Rule Template"}</DialogTitle>
            <DialogDescription>Create or edit a rule template</DialogDescription>
          </DialogHeader>
          {selectedTemplate ? (
            <EditTemplateForm
              template={selectedTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setTemplateDialogOpen(false)
                setSelectedTemplate(null)
              }}
            />
          ) : (
            <CreateTemplateForm
              onSave={handleSaveTemplate}
              onCancel={() => setTemplateDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GroupSettingsForm({
  group,
  onSave,
}: {
  group: Group
  onSave: (updates: Partial<Group>) => void
}) {
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description)
  const [type, setType] = useState<GroupType>(group.type)
  const [isDiscoverable, setIsDiscoverable] = useState(group.visibility?.discoverable !== false)
  const [contentVisibility, setContentVisibility] = useState<"everyone" | "members">(
    group.visibility?.content || "everyone",
  )
  const [rules, setRules] = useState<string[]>(group.rules || [])

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
      rules,
    })
  }

  const addRule = () => {
    setRules([...rules, ""])
  }

  const updateRule = (index: number, value: string) => {
    const updated = [...rules]
    updated[index] = value
    setRules(updated)
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
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
        <Label>Visibility</Label>
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
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Group Rules</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={rule}
                onChange={(e) => updateRule(index, e.target.value)}
                placeholder={`Rule ${index + 1}`}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => removeRule(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground">No rules set</p>
          )}
        </div>
      </div>
      <Button type="submit">Save Changes</Button>
    </form>
  )
}

function CreateTemplateForm({
  onSave,
  onCancel,
}: {
  onSave: (template: GroupRuleTemplate) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [rules, setRules] = useState<string[]>([""])

  const addRule = () => {
    setRules([...rules, ""])
  }

  const updateRule = (index: number, value: string) => {
    const updated = [...rules]
    updated[index] = value
    setRules(updated)
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: "",
      name,
      description,
      rules: rules.filter((r) => r.trim()),
      category: category || undefined,
      isDefault: false,
      createdAt: "",
      updatedAt: "",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="template-description">Description</Label>
        <Textarea
          id="template-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="template-category">Category</Label>
        <Input
          id="template-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., general, breed, health"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Rules</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={rule}
                onChange={(e) => updateRule(index, e.target.value)}
                placeholder={`Rule ${index + 1}`}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => removeRule(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Template</Button>
      </DialogFooter>
    </form>
  )
}

function EditTemplateForm({
  template,
  onSave,
  onCancel,
}: {
  template: GroupRuleTemplate
  onSave: (template: GroupRuleTemplate) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || "")
  const [category, setCategory] = useState(template.category || "")
  const [rules, setRules] = useState<string[]>(template.rules.length > 0 ? template.rules : [""])

  const addRule = () => {
    setRules([...rules, ""])
  }

  const updateRule = (index: number, value: string) => {
    const updated = [...rules]
    updated[index] = value
    setRules(updated)
  }

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...template,
      name,
      description,
      rules: rules.filter((r) => r.trim()),
      category: category || undefined,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-template-name">Template Name</Label>
        <Input
          id="edit-template-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="edit-template-description">Description</Label>
        <Textarea
          id="edit-template-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="edit-template-category">Category</Label>
        <Input
          id="edit-template-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., general, breed, health"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Rules</Label>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </div>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={rule}
                onChange={(e) => updateRule(index, e.target.value)}
                placeholder={`Rule ${index + 1}`}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => removeRule(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Template</Button>
      </DialogFooter>
    </form>
  )
}

