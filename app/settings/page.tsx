"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BackButton } from "@/components/ui/back-button"
import { useAuth } from "@/components/auth/auth-provider"
import { PrivacySelector } from "@/components/privacy-selector"
import { updateUser, getUsers, blockUser, unblockUser } from "@/lib/storage"
import type { PrivacyLevel, NotificationSettings } from "@/lib/types"
import { ArrowLeft, Ban, UserX, User, FileText, Users, CheckCircle2, XCircle, Mail, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [privacySettings, setPrivacySettings] = useState({
    profile: "public" as PrivacyLevel,
    email: "private" as PrivacyLevel,
    location: "followers-only" as PrivacyLevel,
    pets: "public" as PrivacyLevel,
    posts: "public" as PrivacyLevel,
    followers: "public" as PrivacyLevel,
    following: "public" as PrivacyLevel,
    searchable: true,
    allowFollowRequests: "public" as PrivacyLevel,
    allowTagging: "public" as PrivacyLevel,
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
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
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])

  // Handle success/error messages from URL params
  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success") {
      setMessage({ type: "success", text: "Settings saved successfully!" })
      const timer = setTimeout(() => {
        setMessage(null)
        router.replace("/settings")
      }, 5000)
      return () => clearTimeout(timer)
    } else if (status === "error") {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." })
      const timer = setTimeout(() => {
        setMessage(null)
        router.replace("/settings")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  // Load user data
  useEffect(() => {
    if (user) {
      // Load privacy settings
      if (user.privacy) {
        setPrivacySettings({
          profile: user.privacy.profile || "public",
          email: user.privacy.email || "private",
          location: user.privacy.location || "followers-only",
          pets: user.privacy.pets || "public",
          posts: user.privacy.posts || "public",
          followers: user.privacy.followers || "public",
          following: user.privacy.following || "public",
          searchable: user.privacy.searchable !== false,
          allowFollowRequests: user.privacy.allowFollowRequests || "public",
          allowTagging: user.privacy.allowTagging || "public",
        })
      }
      
      // Load notification settings
      const saved = localStorage.getItem(`notification_settings_${user.id}`)
      if (saved) {
        setNotificationSettings(JSON.parse(saved))
      } else {
        setNotificationSettings((prev) => ({ ...prev, userId: user.id }))
      }
      
      // Load blocked users
      if (user.blockedUsers && user.blockedUsers.length > 0) {
        const allUsers = getUsers()
        const blocked = allUsers.filter((u) => user.blockedUsers!.includes(u.id))
        setBlockedUsers(blocked)
      }
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    setMessage(null)
    
    try {
      // Simulate async operation (in case updateUser becomes async in the future)
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Save privacy settings
      updateUser(user.id, { privacy: privacySettings })
      
      // Save notification settings
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(notificationSettings))
      
      // Redirect with success message
      router.push("/settings?status=success")
      router.refresh()
    } catch (error) {
      // Redirect with error message
      router.push("/settings?status=error")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = (unblockUserId: string) => {
    if (!user) return
    unblockUser(user.id, unblockUserId)
    setBlockedUsers(blockedUsers.filter((u) => u.id !== unblockUserId))
  }

  const updateEmailSetting = (key: keyof NotificationSettings["email"], value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      email: { ...notificationSettings.email, [key]: value },
    })
  }

  const updateInAppSetting = (key: keyof NotificationSettings["inApp"], value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      inApp: { ...notificationSettings.inApp, [key]: value },
    })
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton onClick={() => router.back()} label="Back" />

      <div className="space-y-6">
        {/* Success/Error Message */}
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className={message.type === "success" ? "border-green-500/50 bg-green-500/10" : ""}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="text-green-500" />
            ) : (
              <XCircle className="text-destructive" />
            )}
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your privacy and notification preferences</p>
        </div>

        {/* Privacy Settings Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Privacy Settings</h2>
            <p className="text-muted-foreground mb-4">Control who can see your information and content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  Profile Privacy
                </CardTitle>
                <CardDescription>Choose who can see different parts of your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your profile information</p>
                  <PrivacySelector
                    value={privacySettings.profile}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, profile: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your email address</p>
                  <PrivacySelector
                    value={privacySettings.email}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, email: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your location</p>
                  <PrivacySelector
                    value={privacySettings.location}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, location: value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-500" />
                  </div>
                  Content Privacy
                </CardTitle>
                <CardDescription>Control who can see your posts, pets, and lists</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Posts</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your posts</p>
                  <PrivacySelector
                    value={privacySettings.posts}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, posts: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pets</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your pets</p>
                  <PrivacySelector
                    value={privacySettings.pets}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, pets: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Followers List</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see your followers</p>
                  <PrivacySelector
                    value={privacySettings.followers}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, followers: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Following List</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can see who you follow</p>
                  <PrivacySelector
                    value={privacySettings.following}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, following: value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-500" />
                  </div>
                  Interactions
                </CardTitle>
                <CardDescription>Control how others can interact with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Searchable</Label>
                    <p className="text-sm text-muted-foreground">Allow others to find you by searching</p>
                  </div>
                  <Switch
                    checked={privacySettings.searchable}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, searchable: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Follow Requests</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can send you follow requests</p>
                  <PrivacySelector
                    value={privacySettings.allowFollowRequests}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, allowFollowRequests: value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tagging</Label>
                  <p className="text-sm text-muted-foreground mb-2">Who can tag you in posts</p>
                  <PrivacySelector
                    value={privacySettings.allowTagging}
                    onChange={(value) => setPrivacySettings({ ...privacySettings, allowTagging: value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blocked Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Ban className="h-4 w-4 text-red-500" />
                </div>
                Blocked Users
              </CardTitle>
              <CardDescription>Manage users you have blocked</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedUsers.length > 0 ? (
                <div className="space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <Link href={`/profile/${blockedUser.username}`} className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={blockedUser.avatar || "/placeholder.svg"} alt={blockedUser.fullName} />
                          <AvatarFallback>{blockedUser.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{blockedUser.fullName}</p>
                          <p className="text-sm text-muted-foreground">@{blockedUser.username}</p>
                        </div>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blockedUser.id)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No blocked users</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Notification Settings</h2>
            <p className="text-muted-foreground mb-4">Choose how you want to be notified about activity</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                Email Notifications
              </CardTitle>
              <CardDescription>Receive notifications via email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Followers</Label>
                  <p className="text-sm text-muted-foreground">When someone follows you</p>
                </div>
                <Switch
                  checked={notificationSettings.email.follows}
                  onCheckedChange={(checked) => updateEmailSetting("follows", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Likes</Label>
                  <p className="text-sm text-muted-foreground">When someone likes your content</p>
                </div>
                <Switch
                  checked={notificationSettings.email.likes}
                  onCheckedChange={(checked) => updateEmailSetting("likes", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Comments</Label>
                  <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
                </div>
                <Switch
                  checked={notificationSettings.email.comments}
                  onCheckedChange={(checked) => updateEmailSetting("comments", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mentions</Label>
                  <p className="text-sm text-muted-foreground">When someone mentions you</p>
                </div>
                <Switch
                  checked={notificationSettings.email.mentions}
                  onCheckedChange={(checked) => updateEmailSetting("mentions", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Posts</Label>
                  <p className="text-sm text-muted-foreground">When people you follow create new posts</p>
                </div>
                <Switch
                  checked={notificationSettings.email.posts}
                  onCheckedChange={(checked) => updateEmailSetting("posts", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-purple-500" />
                </div>
                In-App Notifications
              </CardTitle>
              <CardDescription>Receive notifications within the app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Followers</Label>
                  <p className="text-sm text-muted-foreground">When someone follows you</p>
                </div>
                <Switch
                  checked={notificationSettings.inApp.follows}
                  onCheckedChange={(checked) => updateInAppSetting("follows", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Likes</Label>
                  <p className="text-sm text-muted-foreground">When someone likes your content</p>
                </div>
                <Switch
                  checked={notificationSettings.inApp.likes}
                  onCheckedChange={(checked) => updateInAppSetting("likes", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Comments</Label>
                  <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
                </div>
                <Switch
                  checked={notificationSettings.inApp.comments}
                  onCheckedChange={(checked) => updateInAppSetting("comments", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mentions</Label>
                  <p className="text-sm text-muted-foreground">When someone mentions you</p>
                </div>
                <Switch
                  checked={notificationSettings.inApp.mentions}
                  onCheckedChange={(checked) => updateInAppSetting("mentions", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Posts</Label>
                  <p className="text-sm text-muted-foreground">When people you follow create new posts</p>
                </div>
                <Switch
                  checked={notificationSettings.inApp.posts}
                  onCheckedChange={(checked) => updateInAppSetting("posts", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}

