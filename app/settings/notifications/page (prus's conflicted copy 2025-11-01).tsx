"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { useAuth } from "@/components/auth/auth-provider"
import { ArrowLeft, Mail, Bell } from "lucide-react"
import type { NotificationSettings } from "@/lib/types"

export default function NotificationSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSettings>({
    userId: "",
    email: {
      follows: true,
      likes: true,
      comments: true,
      mentions: true,
      posts: true,
    },
    inApp: {
      follows: true,
      likes: true,
      comments: true,
      mentions: true,
      posts: true,
    },
  })

  useEffect(() => {
    if (user) {
      // Load notification settings from localStorage
      const saved = localStorage.getItem(`notification_settings_${user.id}`)
      if (saved) {
        setSettings(JSON.parse(saved))
      } else {
        setSettings((prev) => ({ ...prev, userId: user.id }))
      }
    }
  }, [user])

  const handleSave = () => {
    if (!user) return
    localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(settings))
    router.back()
  }

  const updateEmailSetting = (key: keyof NotificationSettings["email"], value: boolean) => {
    setSettings({
      ...settings,
      email: { ...settings.email, [key]: value },
    })
  }

  const updateInAppSetting = (key: keyof NotificationSettings["inApp"], value: boolean) => {
    setSettings({
      ...settings,
      inApp: { ...settings.inApp, [key]: value },
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
      <BackButton onClick={() => router.back()} label="Back" />

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Choose how you want to be notified about activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              </div>
              Email Notifications
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Receive notifications via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">New Followers</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone follows you</p>
              </div>
              <Switch
                checked={settings.email.follows}
                onCheckedChange={(checked) => updateEmailSetting("follows", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">Likes</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone likes your content</p>
              </div>
              <Switch
                checked={settings.email.likes}
                onCheckedChange={(checked) => updateEmailSetting("likes", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">Comments</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone comments on your posts</p>
              </div>
              <Switch
                checked={settings.email.comments}
                onCheckedChange={(checked) => updateEmailSetting("comments", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">Mentions</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone mentions you</p>
              </div>
              <Switch
                checked={settings.email.mentions}
                onCheckedChange={(checked) => updateEmailSetting("mentions", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">New Posts</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When people you follow create new posts</p>
              </div>
              <Switch
                checked={settings.email.posts}
                onCheckedChange={(checked) => updateEmailSetting("posts", checked)}
                className="flex-shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
              </div>
              In-App Notifications
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Receive notifications within the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">New Followers</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone follows you</p>
              </div>
              <Switch
                checked={settings.inApp.follows}
                onCheckedChange={(checked) => updateInAppSetting("follows", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">Likes</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone likes your content</p>
              </div>
              <Switch
                checked={settings.inApp.likes}
                onCheckedChange={(checked) => updateInAppSetting("likes", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">Comments</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone comments on your posts</p>
              </div>
              <Switch
                checked={settings.inApp.comments}
                onCheckedChange={(checked) => updateInAppSetting("comments", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">Mentions</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When someone mentions you</p>
              </div>
              <Switch
                checked={settings.inApp.mentions}
                onCheckedChange={(checked) => updateInAppSetting("mentions", checked)}
                className="flex-shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="space-y-0.5 min-w-0 flex-1">
                <Label className="text-xs sm:text-sm">New Posts</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">When people you follow create new posts</p>
              </div>
              <Switch
                checked={settings.inApp.posts}
                onCheckedChange={(checked) => updateInAppSetting("posts", checked)}
                className="flex-shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
