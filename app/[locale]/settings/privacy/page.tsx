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
import {
  updateUser,
  getUsers,
  getPetsByOwnerId,
  getBlogPosts,
  updatePet,
  updateBlogPost,
  blockUser,
  unblockUser,
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
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [petControls, setPetControls] = useState<PetControl[]>([])
  const [postControls, setPostControls] = useState<PostControl[]>([])

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
      return
    }

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
  }, [user])

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
