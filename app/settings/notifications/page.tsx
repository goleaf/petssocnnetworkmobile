"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { ArrowLeft } from "lucide-react"
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground mt-2">Choose how you want to be notified about activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Receive notifications via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Followers</Label>
                <p className="text-sm text-muted-foreground">When someone follows you</p>
              </div>
              <Switch
                checked={settings.email.follows}
                onCheckedChange={(checked) => updateEmailSetting("follows", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Likes</Label>
                <p className="text-sm text-muted-foreground">When someone likes your content</p>
              </div>
              <Switch
                checked={settings.email.likes}
                onCheckedChange={(checked) => updateEmailSetting("likes", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comments</Label>
                <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
              </div>
              <Switch
                checked={settings.email.comments}
                onCheckedChange={(checked) => updateEmailSetting("comments", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mentions</Label>
                <p className="text-sm text-muted-foreground">When someone mentions you</p>
              </div>
              <Switch
                checked={settings.email.mentions}
                onCheckedChange={(checked) => updateEmailSetting("mentions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Posts</Label>
                <p className="text-sm text-muted-foreground">When people you follow create new posts</p>
              </div>
              <Switch
                checked={settings.email.posts}
                onCheckedChange={(checked) => updateEmailSetting("posts", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In-App Notifications</CardTitle>
            <CardDescription>Receive notifications within the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Followers</Label>
                <p className="text-sm text-muted-foreground">When someone follows you</p>
              </div>
              <Switch
                checked={settings.inApp.follows}
                onCheckedChange={(checked) => updateInAppSetting("follows", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Likes</Label>
                <p className="text-sm text-muted-foreground">When someone likes your content</p>
              </div>
              <Switch
                checked={settings.inApp.likes}
                onCheckedChange={(checked) => updateInAppSetting("likes", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Comments</Label>
                <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
              </div>
              <Switch
                checked={settings.inApp.comments}
                onCheckedChange={(checked) => updateInAppSetting("comments", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mentions</Label>
                <p className="text-sm text-muted-foreground">When someone mentions you</p>
              </div>
              <Switch
                checked={settings.inApp.mentions}
                onCheckedChange={(checked) => updateInAppSetting("mentions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Posts</Label>
                <p className="text-sm text-muted-foreground">When people you follow create new posts</p>
              </div>
              <Switch
                checked={settings.inApp.posts}
                onCheckedChange={(checked) => updateInAppSetting("posts", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
