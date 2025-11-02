"use client"

import { useState } from "react"
import { Send, Eye, Mail, Bell, MessageSquare, Clock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { NotificationChannel, NotificationPriority, NotificationCategory } from "@/lib/types"
import { getCSRFToken } from "@/lib/csrf"

type NotificationTemplate = "email" | "push" | "in_app"
type Locale = "en" | "es" | "fr" | "de" | "pt"
type Role = "admin" | "moderator" | "all"
type Group = "vets" | "shelters" | "all"

interface NotificationComposerState {
  template: NotificationTemplate
  title: string
  message: string
  priority: NotificationPriority
  category: NotificationCategory
  locales: Locale[]
  roles: Role[]
  groups: Group[]
  rateLimitEnabled: boolean
  rateLimitValue: number
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export default function AdminNotificationsPage() {
  const [state, setState] = useState<NotificationComposerState>({
    template: "in_app",
    title: "",
    message: "",
    priority: "normal",
    category: "system",
    locales: [],
    roles: ["all"],
    groups: ["all"],
    rateLimitEnabled: false,
    rateLimitValue: 1000,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  })

  const [previewMode, setPreviewMode] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    setSending(true)
    try {
      const csrfToken = getCSRFToken()
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(state),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }

      alert("Notification sent successfully!")
      // Reset form
      setState({
        template: "in_app",
        title: "",
        message: "",
        priority: "normal",
        category: "system",
        locales: [],
        roles: ["all"],
        groups: ["all"],
        rateLimitEnabled: false,
        rateLimitValue: 1000,
        quietHoursEnabled: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
      })
    } catch (error) {
      console.error("Error sending notification:", error)
      alert("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  const toggleLocale = (locale: Locale) => {
    setState((prev) => ({
      ...prev,
      locales: prev.locales.includes(locale) ? prev.locales.filter((l) => l !== locale) : [...prev.locales, locale],
    }))
  }

  const toggleRole = (role: Role) => {
    setState((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }))
  }

  const toggleGroup = (group: Group) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.includes(group) ? prev.groups.filter((g) => g !== group) : [...prev.groups, group],
    }))
  }

  const availableLocales: Locale[] = ["en", "es", "fr", "de", "pt"]
  const availableRoles: Role[] = ["admin", "moderator", "all"]
  const availableGroups: Group[] = ["vets", "shelters", "all"]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notification Composer</h1>
        <p className="text-gray-600">Create and send notifications to targeted user segments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Template</h2>
            <Tabs value={state.template} onValueChange={(v) => setState({ ...state, template: v as NotificationTemplate })}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="push">
                  <Bell className="w-4 h-4 mr-2" />
                  Push
                </TabsTrigger>
                <TabsTrigger value="in_app">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  In-App
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-title">Subject</Label>
                    <Input id="email-title" placeholder="Enter email subject" value={state.title} onChange={(e) => setState({ ...state, title: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea id="email-message" placeholder="Enter email content" rows={8} value={state.message} onChange={(e) => setState({ ...state, message: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="push" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="push-title">Title</Label>
                    <Input id="push-title" placeholder="Enter push notification title" value={state.title} onChange={(e) => setState({ ...state, title: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="push-message">Body</Label>
                    <Textarea id="push-message" placeholder="Enter push notification body" rows={4} value={state.message} onChange={(e) => setState({ ...state, message: e.target.value })} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="in_app" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="inapp-message">Message</Label>
                    <Textarea id="inapp-message" placeholder="Enter in-app notification message" rows={4} value={state.message} onChange={(e) => setState({ ...state, message: e.target.value })} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Targeting & Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Targeting & Settings</h2>
            <div className="space-y-6">
              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={state.priority} onValueChange={(v) => setState({ ...state, priority: v as NotificationPriority })}>
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
                  <Label htmlFor="category">Category</Label>
                  <Select value={state.category} onValueChange={(v) => setState({ ...state, category: v as NotificationCategory })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="promotions">Promotions</SelectItem>
                      <SelectItem value="reminders">Reminders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Locale Selection */}
              <div>
                <Label>Locales</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableLocales.map((locale) => (
                    <Badge
                      key={locale}
                      variant={state.locales.includes(locale) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleLocale(locale)}
                    >
                      {locale.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableRoles.map((role) => (
                    <Badge
                      key={role}
                      variant={state.roles.includes(role) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Group Selection */}
              <div>
                <Label>Groups</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableGroups.map((group) => (
                    <Badge key={group} variant={state.groups.includes(group) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleGroup(group)}>
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Safety Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Safety Settings
            </h2>
            <div className="space-y-6">
              {/* Rate Limiting */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rate-limit" className="cursor-pointer">
                    Rate Limit
                  </Label>
                  <p className="text-sm text-gray-500">Limit notifications per user</p>
                </div>
                <Switch id="rate-limit" checked={state.rateLimitEnabled} onCheckedChange={(checked) => setState({ ...state, rateLimitEnabled: checked })} />
              </div>
              {state.rateLimitEnabled && (
                <div>
                  <Label htmlFor="rate-limit-value">Max notifications per hour</Label>
                  <Input
                    id="rate-limit-value"
                    type="number"
                    value={state.rateLimitValue}
                    onChange={(e) => setState({ ...state, rateLimitValue: Number.parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              )}

              {/* Quiet Hours */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quiet-hours" className="cursor-pointer flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Quiet Hours
                  </Label>
                  <p className="text-sm text-gray-500">Delay delivery during these hours</p>
                </div>
                <Switch id="quiet-hours" checked={state.quietHoursEnabled} onCheckedChange={(checked) => setState({ ...state, quietHoursEnabled: checked })} />
              </div>
              {state.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input id="quiet-start" type="time" value={state.quietHoursStart} onChange={(e) => setState({ ...state, quietHoursStart: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input id="quiet-end" type="time" value={state.quietHoursEnd} onChange={(e) => setState({ ...state, quietHoursEnd: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Hide Preview" : "Show Preview"}
            </Button>
            <Button onClick={handleSubmit} disabled={sending} className="flex-1">
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </h2>
            {previewMode && state.message ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-semibold mb-2">{state.title || "No title"}</div>
                  <div className="text-sm text-gray-600">{state.message}</div>
                </div>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-semibold">Template:</span> {state.template}
                  </div>
                  <div>
                    <span className="font-semibold">Priority:</span> {state.priority}
                  </div>
                  <div>
                    <span className="font-semibold">Category:</span> {state.category}
                  </div>
                  <div>
                    <span className="font-semibold">Locales:</span> {state.locales.length > 0 ? state.locales.join(", ") : "All"}
                  </div>
                  <div>
                    <span className="font-semibold">Roles:</span> {state.roles.join(", ")}
                  </div>
                  <div>
                    <span className="font-semibold">Groups:</span> {state.groups.join(", ")}
                  </div>
                  {state.rateLimitEnabled && (
                    <div>
                      <span className="font-semibold">Rate Limit:</span> {state.rateLimitValue}/hour
                    </div>
                  )}
                  {state.quietHoursEnabled && (
                    <div>
                      <span className="font-semibold">Quiet Hours:</span> {state.quietHoursStart} - {state.quietHoursEnd}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Enable preview to see notification details</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

