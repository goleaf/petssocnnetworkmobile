"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/components/auth/auth-provider"
import { PrivacySelector } from "@/components/privacy-selector"
import { updateUser, getUsers, blockUser, unblockUser } from "@/lib/storage"
import type { PrivacyLevel } from "@/lib/types"
import { ArrowLeft, Ban, UserX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function PrivacySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
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

  const handleSave = () => {
    if (!user) return
    updateUser(user.id, { privacy: settings })
    router.back()
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Privacy Settings</h1>
          <p className="text-muted-foreground mt-2">Control who can see your information and content</p>
        </div>

        {/* Profile Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Privacy</CardTitle>
            <CardDescription>Choose who can see different parts of your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <CardTitle>Content Privacy</CardTitle>
            <CardDescription>Control who can see your posts, pets, and lists</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <CardTitle>Interactions</CardTitle>
            <CardDescription>Control how others can interact with you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Searchable</Label>
                <p className="text-sm text-muted-foreground">Allow others to find you by searching</p>
              </div>
              <Switch
                checked={settings.searchable}
                onCheckedChange={(checked) => setSettings({ ...settings, searchable: checked })}
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

        {/* Blocked Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
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
