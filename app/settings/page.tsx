"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BackButton } from "@/components/ui/back-button"
import { useAuth } from "@/components/auth/auth-provider"
import { PrivacySelector } from "@/components/privacy-selector"
import { updateUser, getUsers, blockUser, unblockUser } from "@/lib/storage"
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notifications"
import type { PrivacyLevel, NotificationSettings, NotificationChannel } from "@/lib/types"
import {
  ArrowLeft,
  Ban,
  UserX,
  User,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  ShieldCheck,
  Mail,
  Bell,
  Smartphone,
  type LucideIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const CHANNEL_SUMMARY_ORDER: NotificationChannel[] = ["in_app", "push", "email", "digest"]

const CHANNEL_SUMMARY_META: Record<NotificationChannel, { label: string; icon: LucideIcon; description: string }> = {
  in_app: {
    label: "In-app",
    icon: Bell,
    description: "Delivered instantly while you're using the app",
  },
  push: {
    label: "Push",
    icon: Smartphone,
    description: "Native notifications on your device",
  },
  email: {
    label: "Email",
    icon: Mail,
    description: "Summaries and alerts delivered to your inbox",
  },
  digest: {
    label: "Digest",
    icon: LayoutGrid,
    description: "Scheduled recap at your preferred cadence",
  },
}

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
    secureMessages: true,
    sections: {
      basics: "public" as PrivacyLevel,
      statistics: "public" as PrivacyLevel,
      friends: "public" as PrivacyLevel,
      pets: "public" as PrivacyLevel,
      activity: "public" as PrivacyLevel,
    },
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
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
          secureMessages: user.privacy.secureMessages !== false,
          sections: {
            basics: user.privacy.sections?.basics || user.privacy.profile || "public",
            statistics: user.privacy.sections?.statistics || user.privacy.profile || "public",
            friends:
              user.privacy.sections?.friends ||
              user.privacy.followers ||
              user.privacy.following ||
              user.privacy.profile ||
              "public",
            pets: user.privacy.sections?.pets || user.privacy.pets || "public",
            activity: user.privacy.sections?.activity || user.privacy.posts || "public",
          },
        })
      }
      
      // Load notification settings
      const storedNotificationSettings = getNotificationSettings(user.id)
      setNotificationSettings(storedNotificationSettings)
      
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
      if (notificationSettings) {
        saveNotificationSettings({ ...notificationSettings, userId: user.id })
      }
      
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

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
      <BackButton onClick={() => router.back()} label="Back" />

      <div className="space-y-4 sm:space-y-6">
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
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage your privacy and notification preferences</p>
        </div>

        {/* Privacy Settings Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Privacy Settings</h2>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">Control who can see your information and content</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Profile Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                  </div>
                  Profile Privacy
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Choose who can see different parts of your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
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
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                  </div>
                  Content Privacy
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control who can see your posts, pets, and lists</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
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

            {/* Profile Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                  </div>
                  Profile Sections
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Choose who can see profile basics, statistics, friends, pets tab, and activity logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-2">
                  <Label>Profile Basics</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Controls visibility of your avatar, name, username, and bio on your profile header
                  </p>
                  <PrivacySelector
                    value={privacySettings.sections.basics}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, basics: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Statistics</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Controls visibility of profile statistics like counts of pets, posts, followers, and following
                  </p>
                  <PrivacySelector
                    value={privacySettings.sections.statistics}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, statistics: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Friends</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Controls visibility of your followers and following lists from your profile
                  </p>
                  <PrivacySelector
                    value={privacySettings.sections.friends}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, friends: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pets Section</Label>
                  <p className="text-sm text-muted-foreground mb-2">Controls visibility of the pets tab on your profile</p>
                  <PrivacySelector
                    value={privacySettings.sections.pets}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, pets: value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Activity Logs</Label>
                  <p className="text-sm text-muted-foreground mb-2">Controls visibility of your recent activity feed on your profile</p>
                  <PrivacySelector
                    value={privacySettings.sections.activity}
                    onChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        sections: { ...privacySettings.sections, activity: value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Interactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  Interactions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control how others can interact with you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
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

            {/* Message Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                  </div>
                  Message Privacy
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Keep direct messages private with end-to-end encryption
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">End-to-end encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Only you and approved recipients can read your conversations.
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.secureMessages}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, secureMessages: checked })}
                  />
                </div>
                <div className="rounded-lg border border-dashed border-orange-500/30 bg-orange-500/10 p-3 sm:p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Encryption coverage</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
                    <li>Messages are encrypted on-device before sending.</li>
                    <li>Keys rotate automatically when devices change.</li>
                    <li>Attachments and reactions stay in the secure channel.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blocked Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                </div>
                Blocked Users
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage users you have blocked</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedUsers.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {blockedUsers.map((blockedUser) => (
                    <div key={blockedUser.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border gap-2 sm:gap-3">
                      <Link href={`/profile/${blockedUser.username}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          <AvatarImage src={blockedUser.avatar || "/placeholder.svg"} alt={blockedUser.fullName} />
                          <AvatarFallback className="text-xs sm:text-sm">{blockedUser.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{blockedUser.fullName}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">@{blockedUser.username}</p>
                        </div>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blockedUser.id)}
                        className="flex-shrink-0"
                      >
                        <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Unblock</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">No blocked users</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings Section */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-4">Notification Settings</h2>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Quick overview of your notification delivery channels and priorities.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                </div>
                Channel overview
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Adjust advanced preferences and notification types from the dedicated notifications page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationSettings ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {CHANNEL_SUMMARY_ORDER.map((channel) => {
                    const meta = CHANNEL_SUMMARY_META[channel]
                    const pref = notificationSettings.channelPreferences?.[channel]
                    const enabled = pref?.enabled ?? false
                    const frequency = pref?.frequency ?? "real-time"
                    const priority = pref?.priorityThreshold ?? "normal"
                    const categories = pref?.categories ?? []

                    return (
                      <div key={channel} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <meta.icon className="h-4 w-4" />
                            <span className="font-medium text-sm">{meta.label}</span>
                          </div>
                          <Badge variant={enabled ? "secondary" : "outline"}>{enabled ? "Enabled" : "Muted"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded bg-muted px-2 py-1">Freq: {frequency.replace("-", " ")}</span>
                          <span className="rounded bg-muted px-2 py-1">Priority ≥ {priority}</span>
                          <span className="rounded bg-muted px-2 py-1">
                            {categories.length > 0
                              ? `Categories: ${categories.join(", ")}`
                              : "All categories"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading notification preferences…</p>
              )}

              <div className="flex justify-end">
                <Button asChild>
                  <Link href="/settings/notifications">Manage detailed preferences</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
