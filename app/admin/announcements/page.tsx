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
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react"
import {
  getAnnouncements,
  getActiveAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/storage"
import type {
  Announcement,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementDismissalPolicy,
} from "@/lib/types"

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal" as AnnouncementPriority,
    status: "draft" as AnnouncementStatus,
    dismissalPolicy: "permanent" as AnnouncementDismissalPolicy,
    startDate: "",
    endDate: "",
    targetAudience: "all" as "all" | "logged-in" | "logged-out",
    actionUrl: "",
    actionText: "",
    variant: "info" as "info" | "warning" | "success" | "error",
  })

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = () => {
    const allAnnouncements = getAnnouncements()
    setAnnouncements(allAnnouncements.sort((a: Announcement, b: Announcement) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    }))
  }

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        status: announcement.status,
        dismissalPolicy: announcement.dismissalPolicy,
        startDate: announcement.startDate || "",
        endDate: announcement.endDate || "",
        targetAudience: announcement.targetAudience || "all",
        actionUrl: announcement.actionUrl || "",
        actionText: announcement.actionText || "",
        variant: announcement.variant || "info",
      })
    } else {
      setEditingAnnouncement(null)
      setFormData({
        title: "",
        content: "",
        priority: "normal",
        status: "draft",
        dismissalPolicy: "permanent",
        startDate: "",
        endDate: "",
        targetAudience: "all",
        actionUrl: "",
        actionText: "",
        variant: "info",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAnnouncement(null)
  }

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim() || !user?.id) return

    const announcementData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
      status: formData.status,
      dismissalPolicy: formData.dismissalPolicy,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      targetAudience: formData.targetAudience,
      actionUrl: formData.actionUrl || undefined,
      actionText: formData.actionText || undefined,
      variant: formData.variant,
      createdBy: user.id,
    }

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, announcementData)
    } else {
      addAnnouncement(announcementData)
    }

    loadAnnouncements()
    handleCloseDialog()
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      deleteAnnouncement(id)
      loadAnnouncements()
    }
  }

  const handleToggleStatus = (announcement: Announcement) => {
    const newStatus: AnnouncementStatus =
      announcement.status === "active" ? "archived" : "active"
    updateAnnouncement(announcement.id, { status: newStatus })
    loadAnnouncements()
  }

  const getPriorityColor = (priority: AnnouncementPriority) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "normal":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status: AnnouncementStatus) => {
    switch (status) {
      case "active":
        return "default"
      case "draft":
        return "secondary"
      case "expired":
        return "outline"
      case "archived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getVariantIcon = (variant?: string) => {
    switch (variant) {
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <XCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const isCurrentlyActive = (announcement: Announcement): boolean => {
    if (announcement.status !== "active") return false
    const now = new Date().toISOString()
    if (announcement.startDate && announcement.startDate > now) return false
    if (announcement.endDate && announcement.endDate < now) return false
    return true
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to access announcements.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user.role !== "admin" && user.role !== "moderator") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You do not have permission to access announcements management.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeAnnouncements = getActiveAnnouncements(user.id)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <AlertCircle className="h-8 w-8" />
          Announcements Management
        </h1>
        <p className="text-muted-foreground">
          Create and manage timed banners with priority and dismissal policies
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-muted-foreground">All announcements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAnnouncements.length}</div>
            <p className="text-xs text-muted-foreground">Currently showing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Edit className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter((a) => a.status === "draft").length}
            </div>
            <p className="text-xs text-muted-foreground">Not published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcements.filter((a) => a.status === "archived").length}
            </div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Button */}
      <div className="mb-6">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>{announcements.length} total announcements</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No announcements found</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const isActive = isCurrentlyActive(announcement)
                return (
                  <div
                    key={announcement.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getVariantIcon(announcement.variant)}
                        <span className="font-medium">{announcement.title}</span>
                        <Badge variant={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                        <Badge variant={getStatusColor(announcement.status)}>
                          {announcement.status}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="bg-green-600">
                            Currently Active
                          </Badge>
                        )}
                        <Badge variant="outline">{announcement.dismissalPolicy}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {announcement.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Start: {new Date(announcement.startDate).toLocaleDateString()}
                          </div>
                        )}
                        {announcement.endDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            End: {new Date(announcement.endDate).toLocaleDateString()}
                          </div>
                        )}
                        {announcement.targetAudience && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {announcement.targetAudience}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(announcement)}
                      >
                        {announcement.status === "active" ? "Archive" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription>
              Configure timed banners with priority and dismissal policies
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter announcement content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as AnnouncementPriority })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as AnnouncementStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="dismissalPolicy">Dismissal Policy</Label>
              <Select
                value={formData.dismissalPolicy}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    dismissalPolicy: value as AnnouncementDismissalPolicy,
                  })
                }
              >
                <SelectTrigger id="dismissalPolicy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never (non-dismissible)</SelectItem>
                  <SelectItem value="session">Session (dismissed until browser closes)</SelectItem>
                  <SelectItem value="temporary">Temporary (dismissed for 24 hours)</SelectItem>
                  <SelectItem value="permanent">Permanent (dismissed forever)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Start Date (optional)</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) =>
                  setFormData({ ...formData, targetAudience: value as any })
                }
              >
                <SelectTrigger id="targetAudience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="logged-in">Logged In Users Only</SelectItem>
                  <SelectItem value="logged-out">Logged Out Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="variant">Variant</Label>
              <Select
                value={formData.variant}
                onValueChange={(value) =>
                  setFormData({ ...formData, variant: value as any })
                }
              >
                <SelectTrigger id="variant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="actionUrl">Action URL (optional)</Label>
              <Input
                id="actionUrl"
                placeholder="https://example.com"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="actionText">Action Button Text (optional)</Label>
              <Input
                id="actionText"
                placeholder="Learn More"
                value={formData.actionText}
                onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim()}
            >
              {editingAnnouncement ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

