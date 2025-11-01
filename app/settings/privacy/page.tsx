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
import type { PrivacyLevel } from "@/lib/types"
import { ArrowLeft, Ban, UserX, User, FileText, Users, CheckCircle2, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function PrivacySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [settings, setSettings] = useState({
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
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])

  // Handle success/error messages from URL params
  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success") {
      setMessage({ type: "success", text: "Privacy settings saved successfully!" })
      const timer = setTimeout(() => {
        setMessage(null)
        router.replace("/settings/privacy")
      }, 5000)
      return () => clearTimeout(timer)
    } else if (status === "error") {
      setMessage({ type: "error", text: "Failed to save privacy settings. Please try again." })
      const timer = setTimeout(() => {
        setMessage(null)
        router.replace("/settings/privacy")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router])

  // Load user data
  useEffect(() => {
    if (user) {
      if (user.privacy) {
        setSettings({
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
      
      updateUser(user.id, { privacy: settings })
      
      // Redirect with success message
      router.push("/settings/privacy?status=success")
      router.refresh()
    } catch (error) {
      // Redirect with error message
      router.push("/settings/privacy?status=error")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlock = (blockUserId: string) => {
    // This function is not used in the UI - blocking is typically done from profile pages
    // Keep it for potential future use
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
          <h1 className="text-2xl sm:text-3xl font-bold">Privacy Settings</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Control who can see your information and content</p>
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
                  value={settings.profile}
                  onChange={(value) => setSettings({ ...settings, profile: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can see your email address</p>
                <PrivacySelector
                  value={settings.email}
                  onChange={(value) => setSettings({ ...settings, email: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can see your location</p>
                <PrivacySelector
                  value={settings.location}
                  onChange={(value) => setSettings({ ...settings, location: value })}
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
                  value={settings.posts}
                  onChange={(value) => setSettings({ ...settings, posts: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Pets</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can see your pets</p>
                <PrivacySelector
                  value={settings.pets}
                  onChange={(value) => setSettings({ ...settings, pets: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Followers List</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can see your followers</p>
                <PrivacySelector
                  value={settings.followers}
                  onChange={(value) => setSettings({ ...settings, followers: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Following List</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can see who you follow</p>
                <PrivacySelector
                  value={settings.following}
                  onChange={(value) => setSettings({ ...settings, following: value })}
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
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <Label className="text-xs sm:text-sm">Searchable</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Allow others to find you by searching</p>
                </div>
                <Switch
                  checked={settings.searchable}
                  onCheckedChange={(checked) => setSettings({ ...settings, searchable: checked })}
                  className="flex-shrink-0"
                />
              </div>

              <div className="space-y-2">
                <Label>Follow Requests</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can send you follow requests</p>
                <PrivacySelector
                  value={settings.allowFollowRequests}
                  onChange={(value) => setSettings({ ...settings, allowFollowRequests: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tagging</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can tag you in posts</p>
                <PrivacySelector
                  value={settings.allowTagging}
                  onChange={(value) => setSettings({ ...settings, allowTagging: value })}
                />
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

        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isLoading} disabled={isLoading} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
