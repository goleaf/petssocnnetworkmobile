"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SettingsHeader } from "@/components/settings/SettingsHeader"
import { useAuth } from "@/components/auth/auth-provider"
import { PrivacySelector } from "@/components/privacy-selector"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  updateUser,
  getUsers,
  getPetsByOwnerId,
  getBlogPosts,
  updatePet,
  updateBlogPost,
  blockUser,
  unblockUser,
  unrestrictUser,
  getConversationsForUser,
  getDirectMessages,
  updateConversation,
  setConversationArchiveState,
  muteUser,
  unmuteUser,
} from "@/lib/storage"
import type { PrivacyLevel, Pet } from "@/lib/types"
import { formatDate } from "@/lib/utils/date"
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
  PawPrint,
  Globe,
  Lock,
  Sliders,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

const PRIVACY_LEVELS: PrivacyLevel[] = ["public", "followers-only", "private"]

function normalizePrivacyLevel(value: unknown, fallback: PrivacyLevel = "public"): PrivacyLevel {
  return typeof value === "string" && PRIVACY_LEVELS.includes(value as PrivacyLevel)
    ? (value as PrivacyLevel)
    : fallback
}

function getPetVisibility(privacy: Pet["privacy"], fallback: PrivacyLevel): PrivacyLevel {
  if (privacy && typeof privacy === "object") {
    return normalizePrivacyLevel(privacy.visibility, fallback)
  }
  return normalizePrivacyLevel(privacy, fallback)
}

function getPetInteractions(
  privacy: Pet["privacy"],
  fallback: PrivacyLevel,
  visibilityFallback?: PrivacyLevel
): PrivacyLevel {
  if (privacy && typeof privacy === "object") {
    return normalizePrivacyLevel(privacy.interactions, visibilityFallback ?? fallback)
  }
  return normalizePrivacyLevel(privacy, visibilityFallback ?? fallback)
}

type PetControl = {
  id: string
  name: string
  avatar?: string
  visibility: PrivacyLevel
  interactions: PrivacyLevel
}

type PostControl = {
  id: string
  title: string
  petName?: string
  privacy: PrivacyLevel
  createdAt: string
}

export default function PrivacySettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [settings, setSettings] = useState({
    profile: "public" as PrivacyLevel,
    // Contact & identity
    avatarVisibility: "public" as PrivacyLevel,
    coverPhotoVisibility: "public" as PrivacyLevel,
    email: "private" as PrivacyLevel | "never",
    phone: "private" as PrivacyLevel | "never",
    birthdayVisibility: "private" as "public_show_year" | "public_hide_year" | PrivacyLevel,
    ageVisibility: "private" as PrivacyLevel,
    location: "followers-only" as PrivacyLevel,
    locationGranularity: "exact" as "exact" | "region" | "country" | "hidden",
    joinDateVisibility: "public" as PrivacyLevel,
    lastActiveVisibility: "followers-only" as PrivacyLevel | "hidden",
    messagePermissions: "public" as any,
    likesVisibility: "followers-only" as PrivacyLevel,
    readReceipts: true,
    typingIndicators: true,
    allowMessageForwarding: true,
    mentionPermissions: "public" as "public" | "followers-only" | "none",
    tagReviewRequired: false,
    tagNotifications: true,

    // Content & lists
    pets: "public" as PrivacyLevel,
    posts: "public" as PrivacyLevel,
    followers: "public" as PrivacyLevel,
    following: "public" as PrivacyLevel,

    // Controls
    searchable: true,
    externalIndexing: true,
    showInRecommendations: true,
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
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [mutedUsersList, setMutedUsersList] = useState<any[]>([])
  const [blockedSearch, setBlockedSearch] = useState("")
  const [mutedSearch, setMutedSearch] = useState("")
  const [bulkBlockOpen, setBulkBlockOpen] = useState(false)
  const [bulkBlockInput, setBulkBlockInput] = useState("")
  const [blockTimestamps, setBlockTimestamps] = useState<Record<string, string>>({})
  const [restrictedUsers, setRestrictedUsers] = useState<any[]>([])
  const [petControls, setPetControls] = useState<PetControl[]>([])
  const [postControls, setPostControls] = useState<PostControl[]>([])
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [messageRequests, setMessageRequests] = useState<Array<{
    conversationId: string
    otherUserId: string
    name: string
    username: string
    avatar?: string
    preview: string
    receivedAt: string
  }>>([])

  const savePrivacyField = async (field: string, value: any) => {
    if (!user) return
    setSaving((prev) => ({ ...prev, [field]: true }))
    setSaved((prev) => ({ ...prev, [field]: false }))
    setSettings((prev) => ({ ...prev, [field]: value }))
    // Persist client-side
    updateUser(user.id, { privacy: { ...(user.privacy || {}), [field]: value } } as any)
    try {
      await fetch('/api/user/privacy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field, value }) })
    } catch {}
    setSaving((prev) => ({ ...prev, [field]: false }))
    setSaved((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => setSaved((prev) => ({ ...prev, [field]: false })), 1200)
  }

  const audiencePresets: { value: PrivacyLevel; label: string }[] = [
    { value: "public", label: "Public" },
    { value: "followers-only", label: "Friends Only" },
    { value: "private", label: "Private" },
  ]

  const applyProfilePreset = (preset: PrivacyLevel) => {
    setSettings((prev) => ({
      ...prev,
      profile: preset,
      email: preset,
      location: preset,
      sections: {
        ...prev.sections,
        basics: preset,
        statistics: preset,
      },
    }))
  }

  const isProfilePresetActive = (preset: PrivacyLevel) =>
    settings.profile === preset &&
    settings.email === preset &&
    settings.location === preset &&
    settings.sections.basics === preset &&
    settings.sections.statistics === preset

  const profileVisibilitySelection: "public" | "followers-only" | "private" | "custom" =
    isProfilePresetActive("public")
      ? "public"
      : isProfilePresetActive("followers-only")
        ? "followers-only"
        : isProfilePresetActive("private")
          ? "private"
          : "custom"

  const applyContentPreset = (preset: PrivacyLevel) => {
    setSettings((prev) => ({
      ...prev,
      posts: preset,
      pets: preset,
      followers: preset,
      following: preset,
      sections: {
        ...prev.sections,
        pets: preset,
      },
    }))
  }

  const isContentPresetActive = (preset: PrivacyLevel) =>
    settings.posts === preset &&
    settings.pets === preset &&
    settings.followers === preset &&
    settings.following === preset &&
    settings.sections.pets === preset

  const applyInteractionPreset = (preset: PrivacyLevel) => {
    setSettings((prev) => ({
      ...prev,
      searchable: preset !== "private",
      allowFollowRequests: preset,
      allowTagging: preset,
    }))
  }

  const isInteractionPresetActive = (preset: PrivacyLevel) =>
    settings.allowFollowRequests === preset &&
    settings.allowTagging === preset &&
    settings.searchable === (preset !== "private")

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
    if (!user) {
      setPetControls([])
      setPostControls([])
      setBlockedUsers([])
      setMutedUsersList([])
      return
    }

    if (user.privacy) {
      setSettings({
        profile: user.privacy.profile || "public",
        avatarVisibility: user.privacy.avatarVisibility || "public",
        coverPhotoVisibility: user.privacy.coverPhotoVisibility || "public",
        email: (user.privacy.email as any) || "private",
        phone: user.privacy.phone || "private",
        birthdayVisibility: (user.privacy.birthdayVisibility as any) || "private",
        ageVisibility: user.privacy.ageVisibility || "private",
        location: user.privacy.location || "followers-only",
        locationGranularity: user.privacy.locationGranularity || "exact",
        joinDateVisibility: user.privacy.joinDateVisibility || "public",
        lastActiveVisibility: user.privacy.lastActiveVisibility || "followers-only",
        pets: user.privacy.pets || "public",
        posts: user.privacy.posts || "public",
        followers: user.privacy.followers || "public",
        following: user.privacy.following || "public",
        searchable: user.privacy.searchable !== false,
        externalIndexing: (user.privacy as any).externalIndexing !== false,
        showInRecommendations: (user.privacy as any).showInRecommendations !== false,
        allowFollowRequests: user.privacy.allowFollowRequests || "public",
        allowTagging: user.privacy.allowTagging || "public",
        secureMessages: user.privacy.secureMessages !== false,
        messagePermissions: (user.privacy as any).messagePermissions || "public",
        likesVisibility: (user.privacy as any).likesVisibility || "followers-only",
        readReceipts: (user.privacy as any).readReceipts !== false,
        typingIndicators: (user.privacy as any).typingIndicators !== false,
        allowMessageForwarding: (user.privacy as any).allowMessageForwarding !== false,
        mentionPermissions: (user.privacy as any).mentionPermissions || "public",
        tagReviewRequired: (user.privacy as any).tagReviewRequired || false,
        tagNotifications: (user.privacy as any).tagNotifications ?? true,
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

    const defaultPetPrivacy = user.privacy?.pets || "public"
    const ownedPets = getPetsByOwnerId(user.id)
    setPetControls(
      ownedPets.map((pet) => {
        const visibility = getPetVisibility(pet.privacy, defaultPetPrivacy)
        const interactions = getPetInteractions(pet.privacy, defaultPetPrivacy, visibility)
        return {
          id: pet.id,
          name: pet.name,
          avatar: pet.avatar,
          visibility,
          interactions,
        }
      })
    )

    const defaultPostPrivacy = user.privacy?.posts || "public"
    const petNameMap = new Map(ownedPets.map((pet) => [pet.id, pet.name]))
    const authoredPosts = getBlogPosts()
      .filter((post) => post.authorId === user.id && !post.isDraft)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    setPostControls(
      authoredPosts.map((post) => ({
        id: post.id,
        title: post.title || "Untitled post",
        petName: post.petId ? petNameMap.get(post.petId) : undefined,
        privacy: normalizePrivacyLevel(post.privacy, defaultPostPrivacy),
        createdAt: post.createdAt,
      }))
    )

    if (user.blockedUsers && user.blockedUsers.length > 0) {
      const allUsers = getUsers()
      const blocked = allUsers.filter((u) => user.blockedUsers!.includes(u.id))
      setBlockedUsers(blocked)
    } else {
      setBlockedUsers([])
    }
    if ((user as any).restrictedUsers && (user as any).restrictedUsers.length > 0) {
      const allUsers = getUsers()
      const restricted = allUsers.filter((u) => (user as any).restrictedUsers!.includes(u.id))
      setRestrictedUsers(restricted)
    } else {
      setRestrictedUsers([])
    }
    // Load blocked + muted lists
    const allUsers = getUsers()
    const blocked = (user.blockedUsers ?? []).map((id) => allUsers.find((u) => u.id === id)).filter(Boolean)
    setBlockedUsers(blocked)
    const muted = (user.mutedUsers ?? []).map((id) => allUsers.find((u) => u.id === id)).filter(Boolean)
    setMutedUsersList(muted)

    // Load block timestamps
    try {
      const key = `pet_social_blocked_meta_${user.id}`
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      setBlockTimestamps(raw ? JSON.parse(raw) : {})
    } catch {}
  }, [user])

  // Derive message requests (non-friends incoming DMs)
  useEffect(() => {
    if (!user) return
    try {
      const convs = getConversationsForUser(user.id, { includeArchived: false })
      const all = getDirectMessages()
      const requests: Array<{
        conversationId: string
        otherUserId: string
        name: string
        username: string
        avatar?: string
        preview: string
        receivedAt: string
      }> = []

      convs.forEach((c) => {
        // Only 1:1 conversations
        const others = c.participantIds.filter((pid) => pid !== user.id)
        if (others.length !== 1) return
        const otherId = others[0]
        const me = getUsers().find((u) => u.id === user.id)
        const other = getUsers().find((u) => u.id === otherId)
        if (!me || !other) return
        const mutual = me.followers.includes(otherId) && me.following.includes(otherId)
        if (mutual) return
        // Find last incoming message from other
        const msgs = all.filter((m) => m.conversationId === c.id)
        const lastIncoming = [...msgs].reverse().find((m) => m.senderId === otherId)
        if (!lastIncoming) return
        const preview = (c.snippet || lastIncoming.content || "").slice(0, 120)
        requests.push({
          conversationId: c.id,
          otherUserId: otherId,
          name: other.fullName,
          username: other.username,
          avatar: other.avatar,
          preview,
          receivedAt: lastIncoming.createdAt,
        })
      })

      setMessageRequests(requests)
    } catch {}
  }, [user])

  const handleAcceptRequest = (conversationId: string) => {
    updateConversation(conversationId, { tags: ['accepted'] })
    setMessageRequests((prev) => prev.filter((r) => r.conversationId !== conversationId))
  }

  const persistBlockTimestamps = (userId: string, map: Record<string, string>) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`pet_social_blocked_meta_${userId}`, JSON.stringify(map))
  }

  const handleUnblock = (unblockUserId: string) => {
    if (!user) return
    unblockUser(user.id, unblockUserId)
    setBlockedUsers(blockedUsers.filter((u) => u.id !== unblockUserId))
    const next = { ...blockTimestamps }
    delete next[unblockUserId]
    setBlockTimestamps(next)
    persistBlockTimestamps(user.id, next)
  }

  const handleUnmute = (unmuteUserId: string) => {
    if (!user) return
    unmuteUser(user.id, unmuteUserId)
    setMutedUsersList(mutedUsersList.filter((u) => u.id !== unmuteUserId))
  }

  const handleBulkBlock = () => {
    if (!user) return
    const usernames = Array.from(new Set(bulkBlockInput.split(/[,\s\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)))
    if (usernames.length === 0) return
    const all = getUsers()
    const found = all.filter((u) => usernames.includes(u.username.toLowerCase()))
    const nextTimestamps = { ...blockTimestamps }
    found.forEach((target) => {
      blockUser(user.id, target.id)
      nextTimestamps[target.id] = new Date().toISOString()
    })
    setBlockTimestamps(nextTimestamps)
    persistBlockTimestamps(user.id, nextTimestamps)
    // refresh list
    const blocked = (getUsers().find((u) => u.id === user.id)?.blockedUsers ?? [])
      .map((id) => all.find((u) => u.id === id)).filter(Boolean)
    setBlockedUsers(blocked)
    setBulkBlockInput("")
    setBulkBlockOpen(false)
  }

  const handleDeclineRequest = (conversationId: string) => {
    setConversationArchiveState(conversationId, true)
    setMessageRequests((prev) => prev.filter((r) => r.conversationId !== conversationId))
  }

  const handleBlockRequest = (otherUserId: string, conversationId: string) => {
    if (!user) return
    blockUser(user.id, otherUserId)
    setConversationArchiveState(conversationId, true)
    setMessageRequests((prev) => prev.filter((r) => r.conversationId !== conversationId))
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    setMessage(null)
    
  try {
    // Simulate async operation (in case updateUser becomes async in the future)
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    updateUser(user.id, { privacy: settings })
    const defaultPetPrivacy = settings.pets
    const defaultPostPrivacy = settings.posts

    const ownedPets = getPetsByOwnerId(user.id)
    petControls.forEach((control) => {
      const pet = ownedPets.find((p) => p.id === control.id)
      if (!pet) return

      const currentVisibility = getPetVisibility(pet.privacy, defaultPetPrivacy)
      const currentInteractions = getPetInteractions(pet.privacy, defaultPetPrivacy, currentVisibility)

      if (currentVisibility !== control.visibility || currentInteractions !== control.interactions) {
        updatePet({
          ...pet,
          privacy: {
            visibility: control.visibility,
            interactions: control.interactions,
          },
        })
      }
    })

    const authoredPosts = getBlogPosts().filter((post) => post.authorId === user.id)
    postControls.forEach((control) => {
      const post = authoredPosts.find((p) => p.id === control.id)
      if (!post) return

      const existingPrivacy = normalizePrivacyLevel(post.privacy, defaultPostPrivacy)
      if (existingPrivacy !== control.privacy) {
        updateBlogPost({ ...post, privacy: control.privacy })
      }
    })
    
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

  const handleUnrestrict = (targetUserId: string) => {
    if (!user) return
    unrestrictUser(user.id, targetUserId)
    setRestrictedUsers(restrictedUsers.filter((u) => u.id !== targetUserId))
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
      <SettingsHeader description="Control who can see your information and content." />

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
          {/* Contact & Interactions */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500" />
                </div>
                Contact & Interactions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage who can reach out and interact with you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can send me messages</Label>
                    <p className="text-sm text-muted-foreground">Disables DMs when set to No one</p>
                  </div>
                  {saving['messagePermissions'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['messagePermissions'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select
                  value={(settings as any).messagePermissions || 'public'}
                  onValueChange={(v) => savePrivacyField('messagePermissions', v)}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Select who can message you" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Everyone</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="friends-of-friends">Friends of Friends</SelectItem>
                    <SelectItem value="following">Only people I follow</SelectItem>
                    <SelectItem value="none">No one</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Requests */}
              <div className="space-y-2">
                <Label>Message requests</Label>
                <p className="text-sm text-muted-foreground">Pending messages from people who aren’t your friends</p>
                {messageRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending requests</p>
                ) : (
                  <div className="space-y-2">
                    {messageRequests.map((req) => (
                      <div key={req.conversationId} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={req.avatar} alt={req.name} />
                            <AvatarFallback>{req.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{req.name} <span className="text-muted-foreground">@{req.username}</span></p>
                            <p className="text-xs text-muted-foreground truncate">{req.preview || 'New message'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleDeclineRequest(req.conversationId)}>Decline</Button>
                          <Button size="sm" variant="outline" onClick={() => handleBlockRequest(req.otherUserId, req.conversationId)}>Block</Button>
                          <Button size="sm" onClick={() => handleAcceptRequest(req.conversationId)}>Accept</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can tag me in posts</Label>
                    <p className="text-sm text-muted-foreground">Control who can add tags to your posts</p>
                  </div>
                  {saving['allowTagging'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['allowTagging'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select
                  value={settings.allowTagging as string}
                  onValueChange={(v) => savePrivacyField('allowTagging', v)}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Select tagging permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Everyone</SelectItem>
                    <SelectItem value="followers-only">Friends Only</SelectItem>
                    <SelectItem value="none">No One</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">Review tags before showing on profile</div>
                    <p className="text-xs text-muted-foreground">When enabled, tagged posts require your approval</p>
                  </div>
                  {saving['tagReviewRequired'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['tagReviewRequired'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                  <Switch
                    checked={Boolean((settings as any).tagReviewRequired)}
                    onCheckedChange={(checked) => savePrivacyField('tagReviewRequired', checked)}
                  />
                </div>
              </div>

              {/* Messaging preferences */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Read receipts</Label>
                    <p className="text-sm text-muted-foreground">When off, senders don’t see when you read their messages</p>
                  </div>
                  {saving['readReceipts'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['readReceipts'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Show read receipts</span>
                  <Switch
                    checked={Boolean((settings as any).readReceipts) !== false}
                    onCheckedChange={(checked) => savePrivacyField('readReceipts', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Typing indicators</Label>
                    <p className="text-sm text-muted-foreground">When off, others don’t see when you’re typing</p>
                  </div>
                  {saving['typingIndicators'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['typingIndicators'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Show typing indicators</span>
                  <Switch
                    checked={Boolean((settings as any).typingIndicators) !== false}
                    onCheckedChange={(checked) => savePrivacyField('typingIndicators', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Allow message forwarding</Label>
                    <p className="text-sm text-muted-foreground">When off, others can’t forward your messages</p>
                  </div>
                  {saving['allowMessageForwarding'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['allowMessageForwarding'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Forwarding enabled</span>
                  <Switch
                    checked={Boolean((settings as any).allowMessageForwarding) !== false}
                    onCheckedChange={(checked) => savePrivacyField('allowMessageForwarding', checked)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can mention me</Label>
                    <p className="text-sm text-muted-foreground">When set to No One, mentions won’t notify or link</p>
                  </div>
                  {saving['mentionPermissions'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['mentionPermissions'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select
                  value={(settings as any).mentionPermissions || 'public'}
                  onValueChange={(v) => savePrivacyField('mentionPermissions', v)}
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Select who can mention you" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Everyone</SelectItem>
                    <SelectItem value="followers-only">Friends</SelectItem>
                    <SelectItem value="none">No One</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Notification for tags</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable notifications when tagged</p>
                  </div>
                  {saving['tagNotifications'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['tagNotifications'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Notify me when I am tagged</span>
                  <Switch
                    checked={Boolean((settings as any).tagNotifications) !== false}
                    onCheckedChange={(checked) => savePrivacyField('tagNotifications', checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can see my friends/followers list</Label>
                    <p className="text-sm text-muted-foreground">Controls visibility of your followers</p>
                  </div>
                  {saving['followers'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['followers'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <PrivacySelector
                  value={settings.followers}
                  onChange={(v) => savePrivacyField('followers', v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can see who I'm following</Label>
                    <p className="text-sm text-muted-foreground">Controls visibility of your following list</p>
                  </div>
                  {saving['following'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['following'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <PrivacySelector
                  value={settings.following}
                  onChange={(v) => savePrivacyField('following', v)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can see my liked posts</Label>
                    <p className="text-sm text-muted-foreground">Likes may still be visible to authors depending on post privacy</p>
                  </div>
                  {saving['likesVisibility'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['likesVisibility'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <PrivacySelector
                  value={(settings as any).likesVisibility || 'followers-only'}
                  onChange={(v) => savePrivacyField('likesVisibility', v)}
                />
              </div>
            </CardContent>
          </Card>
          {/* Profile Privacy */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                </div>
                Profile Privacy
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Choose who can see different parts of your profile</CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Audience Presets</span>
                {audiencePresets.map((preset) => (
                  <Button
                    key={`profile-${preset.value}`}
                    variant={isProfilePresetActive(preset.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyProfilePreset(preset.value)}
                    aria-pressed={isProfilePresetActive(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label>Who can see my joined date</Label>
                <p className="text-sm text-muted-foreground mb-2">Controls visibility of your member since date</p>
                <PrivacySelector
                  value={settings.joinDateVisibility as PrivacyLevel}
                  onChange={(v) => setSettings({ ...settings, joinDateVisibility: v })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Show online status</Label>
                    <p className="text-sm text-muted-foreground">When off, you always appear offline</p>
                  </div>
                  {saving['lastActiveVisibility'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['lastActiveVisibility'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Show last active</span>
                  <Switch
                    checked={(settings.lastActiveVisibility as any) !== 'hidden'}
                    onCheckedChange={(checked) => savePrivacyField('lastActiveVisibility', checked ? 'public' : 'hidden')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground mb-2">Who can see your profile information</p>
                <RadioGroup.Root
                  value={profileVisibilitySelection}
                  onValueChange={(val) => {
                    if (val === "custom") {
                      setIsCustomOpen(true)
                      return
                    }
                    const v = val as PrivacyLevel
                    applyProfilePreset(v)
                    setSettings((prev) => ({ ...prev, profile: v }))
                  }}
                  className="grid grid-cols-1 gap-2"
                >
                  {[
                    {
                      value: "public",
                      label: "Public",
                      description: "Anyone can see my profile",
                      Icon: Globe,
                    },
                    {
                      value: "followers-only",
                      label: "Friends Only",
                      description: "Only people I follow who follow me back",
                      Icon: Users,
                    },
                    {
                      value: "private",
                      label: "Private",
                      description: "Only approved followers can see",
                      Icon: Lock,
                    },
                  ].map((opt) => (
                    <RadioGroup.Item key={opt.value} value={opt.value} asChild>
                      <button
                        type="button"
                        className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30 data-[state=checked]:border-primary focus:outline-none"
                        aria-label={opt.label}
                      >
                        <div className="mt-0.5">
                          <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 font-medium">
                            <opt.Icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                          <p className="text-sm text-muted-foreground">{opt.description}</p>
                        </div>
                      </button>
                    </RadioGroup.Item>
                  ))}
                  <RadioGroup.Item value="custom" asChild>
                    <button
                      type="button"
                      onClick={() => setIsCustomOpen(true)}
                      className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-accent/30 data-[state=checked]:border-primary focus:outline-none"
                      aria-label="Custom - Advanced settings"
                    >
                      <div className="mt-0.5">
                        <div className="h-4 w-4 rounded-full border data-[state=checked]:border-[5px] data-[state=checked]:border-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Sliders className="h-4 w-4" />
                          Custom - Advanced settings
                        </div>
                        <p className="text-sm text-muted-foreground">Open detailed controls for sections, search, and tagging.</p>
                      </div>
                    </button>
                  </RadioGroup.Item>
                </RadioGroup.Root>
              </div>

              {/* Granular controls */}
              <div className="space-y-2">
                <Label>Who can see my profile photo</Label>
                <p className="text-sm text-muted-foreground mb-2">Control visibility of your avatar across the app</p>
                <PrivacySelector
                  value={settings.avatarVisibility as PrivacyLevel}
                  onChange={(value) => setSettings({ ...settings, avatarVisibility: value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Who can see my cover photo</Label>
                <p className="text-sm text-muted-foreground mb-2">Control visibility of your banner image</p>
                <PrivacySelector
                  value={settings.coverPhotoVisibility as PrivacyLevel}
                  onChange={(value) => setSettings({ ...settings, coverPhotoVisibility: value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Show email address</Label>
                    <p className="text-sm text-muted-foreground">Default: Only Me</p>
                  </div>
                  {saving['email'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['email'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select value={settings.email} onValueChange={(v) => savePrivacyField('email', v)}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Everyone</SelectItem>
                    <SelectItem value="followers-only">Friends</SelectItem>
                    <SelectItem value="private">Only Me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Show phone number</Label>
                    <p className="text-sm text-muted-foreground">Default: Only Me</p>
                  </div>
                  {saving['phone'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['phone'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select value={settings.phone as string} onValueChange={(v) => savePrivacyField('phone', v)}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Everyone</SelectItem>
                    <SelectItem value="followers-only">Friends</SelectItem>
                    <SelectItem value="private">Only Me</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Show birthday</Label>
                    <p className="text-sm text-muted-foreground">Choose how much detail to display</p>
                  </div>
                  {saving['birthdayVisibility'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['birthdayVisibility'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select
                  value={settings.birthdayVisibility}
                  onValueChange={(v) => savePrivacyField('birthdayVisibility', v)}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public_show_year">Full Date</SelectItem>
                    <SelectItem value="public_hide_year">Month/Day Only</SelectItem>
                    <SelectItem value="private">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Show age</Label>
                    <p className="text-sm text-muted-foreground">Age is calculated from your birthday</p>
                  </div>
                  {saving['ageVisibility'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['ageVisibility'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">When off, your age is hidden</span>
                  <Switch
                    checked={(settings.ageVisibility as PrivacyLevel) !== 'private'}
                    onCheckedChange={(checked) => savePrivacyField('ageVisibility', checked ? 'public' : 'private')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Who can see my location</Label>
                    <p className="text-sm text-muted-foreground">Control who can see your location</p>
                  </div>
                  {saving['location'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['location'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <PrivacySelector
                  value={settings.location}
                  onChange={(value) => savePrivacyField('location', value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label>Show location</Label>
                    <p className="text-sm text-muted-foreground">Choose how precise your location appears</p>
                  </div>
                  {saving['locationGranularity'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['locationGranularity'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                </div>
                <Select
                  value={settings.locationGranularity}
                  onValueChange={(v) => savePrivacyField('locationGranularity', v)}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select detail level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exact">Exact City</SelectItem>
                    <SelectItem value="region">State/Region Only</SelectItem>
                    <SelectItem value="country">Country Only</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Content Privacy */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500" />
                </div>
                Content Privacy
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Control who can see your posts, pets, and lists</CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Audience Presets</span>
                {audiencePresets.map((preset) => (
                  <Button
                    key={`content-${preset.value}`}
                    variant={isContentPresetActive(preset.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyContentPreset(preset.value)}
                    aria-pressed={isContentPresetActive(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
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

          {/* Item-Level Privacy */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                </div>
                Item Visibility
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Override privacy for individual posts and pet profiles without changing your defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Posts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose visibility for each published post.
                  </p>
                </div>
                {postControls.length > 0 ? (
                  <div className="space-y-3">
                    {postControls.map((post) => (
                      <div key={post.id} className="rounded-lg border p-3 sm:p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{post.title}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                              {post.petName && <span>{post.petName}</span>}
                              <span>{post.createdAt ? formatDate(post.createdAt) : "Not dated"}</span>
                            </div>
                          </div>
                          <PrivacySelector
                            value={post.privacy}
                            onChange={(value) =>
                              setPostControls((prev) =>
                                prev.map((item) => (item.id === post.id ? { ...item, privacy: value } : item))
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground border rounded-lg p-3">
                    You haven't published any posts yet.
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <PawPrint className="h-4 w-4 text-blue-500" />
                    Pets
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Decide who can view and interact with each pet profile.
                  </p>
                </div>
                {petControls.length > 0 ? (
                  <div className="space-y-3">
                    {petControls.map((pet) => (
                      <div key={pet.id} className="rounded-lg border p-3 sm:p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                            <AvatarFallback>{pet.name?.charAt(0)?.toUpperCase() || "P"}</AvatarFallback>
                          </Avatar>
                          <p className="font-medium truncate">{pet.name}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Profile Visibility
                            </Label>
                            <PrivacySelector
                              value={pet.visibility}
                              onChange={(value) =>
                                setPetControls((prev) =>
                                  prev.map((item) => (item.id === pet.id ? { ...item, visibility: value } : item))
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Interaction Access
                            </Label>
                            <PrivacySelector
                              value={pet.interactions}
                              onChange={(value) =>
                                setPetControls((prev) =>
                                  prev.map((item) => (item.id === pet.id ? { ...item, interactions: value } : item))
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground border rounded-lg p-3">
                    You haven't added any pets yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Sections */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                </div>
                Profile Sections
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Choose individual visibility for profile basics, stats, friends, pets, and recent activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label>Profile Basics</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Controls visibility of your avatar, name, username, and bio on your profile header
                </p>
                <PrivacySelector
                  value={settings.sections.basics}
                  onChange={(value) =>
                    setSettings({ ...settings, sections: { ...settings.sections, basics: value } })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Statistics</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Controls visibility of profile statistics like counts of pets, posts, followers, and following
                </p>
                <PrivacySelector
                  value={settings.sections.statistics}
                  onChange={(value) =>
                    setSettings({ ...settings, sections: { ...settings.sections, statistics: value } })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Friends</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Controls visibility of your followers and following lists from your profile
                </p>
                <PrivacySelector
                  value={settings.sections.friends}
                  onChange={(value) =>
                    setSettings({ ...settings, sections: { ...settings.sections, friends: value } })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Pets Section</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Controls visibility of the pets tab on your profile
                </p>
                <PrivacySelector
                  value={settings.sections.pets}
                  onChange={(value) =>
                    setSettings({ ...settings, sections: { ...settings.sections, pets: value } })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Activity Logs</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Controls visibility of your recent activity feed on your profile
                </p>
                <PrivacySelector
                  value={settings.sections.activity}
                  onChange={(value) =>
                    setSettings({ ...settings, sections: { ...settings.sections, activity: value } })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Interactions */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                </div>
                Interactions
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Control how others can interact with you</CardDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Audience Presets</span>
                {audiencePresets.map((preset) => (
                  <Button
                    key={`interactions-${preset.value}`}
                    variant={isInteractionPresetActive(preset.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyInteractionPreset(preset.value)}
                    aria-pressed={isInteractionPresetActive(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <Label className="text-xs sm:text-sm">Searchable</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">Allow others to find you by searching</p>
                </div>
                <Switch
                  checked={settings.searchable}
                  onCheckedChange={(checked) => savePrivacyField('searchable', checked)}
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

          {/* Message Privacy */}
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                </div>
                Message Privacy
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Protect sensitive conversations with end-to-end encryption
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm">End-to-end encryption</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Only you and approved recipients can read your direct messages.
                  </p>
                </div>
                <Switch
                  checked={settings.secureMessages}
                  onCheckedChange={(checked) => setSettings({ ...settings, secureMessages: checked })}
                  className="flex-shrink-0"
                />
              </div>
              <div className="rounded-lg border border-dashed border-orange-500/30 bg-orange-500/10 p-3 sm:p-4 space-y-2">
                <p className="text-xs sm:text-sm font-semibold text-foreground">What stays protected</p>
                <ul className="list-disc list-inside text-xs sm:text-sm text-muted-foreground space-y-1.5">
                  <li>Messages are encrypted on your device before they leave it.</li>
                  <li>Encryption keys rotate automatically when devices change.</li>
                  <li>Attachments and reactions use the same secure channel.</li>
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
          <CardContent className="space-y-4">
            <div className="rounded-md border p-3 text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium text-foreground">When you block someone:</span> they can’t see your profile, send messages, tag you, or see your posts.
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <Input
                placeholder="Search blocked users"
                value={blockedSearch}
                onChange={(e) => setBlockedSearch(e.target.value)}
                className="sm:max-w-xs"
              />
              <Button variant="outline" onClick={() => setBulkBlockOpen(true)}>Block multiple users</Button>
            </div>
            {blockedUsers.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {blockedUsers
                  .filter((u) => {
                    const q = blockedSearch.trim().toLowerCase()
                    if (!q) return true
                    return (
                      u.username.toLowerCase().includes(q) ||
                      (u.fullName || "").toLowerCase().includes(q)
                    )
                  })
                  .map((blockedUser) => (
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
                      <div className="text-xs text-muted-foreground sm:mr-3">
                        {blockTimestamps[blockedUser.id] ? (
                          <span>Blocked {new Date(blockTimestamps[blockedUser.id]).toLocaleDateString()}</span>
                        ) : (
                          <span>Blocked</span>
                        )}
                      </div>
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

        {/* Muted Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              </div>
              Muted Accounts
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Muted users’ posts don’t appear in your feed. They are not notified.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search muted users"
              value={mutedSearch}
              onChange={(e) => setMutedSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            {mutedUsersList.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {mutedUsersList
                  .filter((u) => {
                    const q = mutedSearch.trim().toLowerCase()
                    if (!q) return true
                    return (
                      u.username.toLowerCase().includes(q) || (u.fullName || '').toLowerCase().includes(q)
                    )
                  })
                  .map((muted) => (
                    <div key={muted.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border gap-2 sm:gap-3">
                      <Link href={`/profile/${muted.username}`} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          <AvatarImage src={muted.avatar || "/placeholder.svg"} alt={muted.fullName} />
                          <AvatarFallback className="text-xs sm:text-sm">{muted.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{muted.fullName}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">@{muted.username}</p>
                        </div>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleUnmute(muted.id)} className="flex-shrink-0">
                        Unmute
                      </Button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">No muted users</p>
            )}
          </CardContent>
        </Card>

        {/* Bulk Block Dialog */}
        <Dialog open={bulkBlockOpen} onOpenChange={setBulkBlockOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Block multiple users</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Paste usernames (comma, space, or newline separated).</p>
              <Textarea rows={6} value={bulkBlockInput} onChange={(e) => setBulkBlockInput(e.target.value)} placeholder="username1, username2, username3" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkBlockOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkBlock}>Block users</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Custom Advanced Modal */}
        <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Advanced Profile Visibility</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Control visibility for specific sections and discovery options. These settings may not match a single preset and will be shown as "Custom".
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Basics</Label>
                  <PrivacySelector
                    value={settings.sections.basics}
                    onChange={(v) => setSettings((prev) => ({ ...prev, sections: { ...prev.sections, basics: v } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Statistics</Label>
                  <PrivacySelector
                    value={settings.sections.statistics}
                    onChange={(v) => setSettings((prev) => ({ ...prev, sections: { ...prev.sections, statistics: v } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Friends</Label>
                  <PrivacySelector
                    value={settings.sections.friends}
                    onChange={(v) => setSettings((prev) => ({ ...prev, sections: { ...prev.sections, friends: v } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pets</Label>
                  <PrivacySelector
                    value={settings.sections.pets}
                    onChange={(v) => setSettings((prev) => ({ ...prev, sections: { ...prev.sections, pets: v } }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Activity</Label>
                  <PrivacySelector
                    value={settings.sections.activity}
                    onChange={(v) => setSettings((prev) => ({ ...prev, sections: { ...prev.sections, activity: v } }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label>Show profile in user search</Label>
                    <p className="text-xs text-muted-foreground">When off, your profile won’t appear in internal search results</p>
                  </div>
                  <Switch
                    checked={settings.searchable}
                    onCheckedChange={(checked) => savePrivacyField('searchable', checked)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label>Allow search engines to index my profile</Label>
                    <p className="text-xs text-muted-foreground">Adds noindex when disabled (search engines won’t index your profile)</p>
                  </div>
                  {saving['externalIndexing'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['externalIndexing'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                  <Switch
                    checked={Boolean((settings as any).externalIndexing) !== false}
                    onCheckedChange={(checked) => savePrivacyField('externalIndexing', checked)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label>Show in recommendations</Label>
                    <p className="text-xs text-muted-foreground">When off, you won’t be suggested as “People you may know”</p>
                  </div>
                  {saving['showInRecommendations'] ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : saved['showInRecommendations'] ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : null}
                  <Switch
                    checked={Boolean((settings as any).showInRecommendations) !== false}
                    onCheckedChange={(checked) => savePrivacyField('showInRecommendations', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Follow Requests</Label>
                  <PrivacySelector
                    value={settings.allowFollowRequests}
                    onChange={(v) => setSettings((prev) => ({ ...prev, allowFollowRequests: v }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagging</Label>
                  <PrivacySelector
                    value={settings.allowTagging}
                    onChange={(v) => setSettings((prev) => ({ ...prev, allowTagging: v }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCustomOpen(false)}>Close</Button>
              <Button onClick={() => setIsCustomOpen(false)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
