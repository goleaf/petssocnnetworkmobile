"use client"

import { use } from "react"
import Head from "next/head"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { getUsers, getPets, getBlogPosts, getActivities, updateUser } from "@/lib/storage"
import type { Activity as UserActivity, PrivacyLevel } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { MapPin, Calendar, Users, Heart, PawPrint, FileText, Lock, Activity as ActivityIcon, Camera, CheckCircle2, Award } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useCallback, useEffect, useState, useRef } from "react"
import { formatCommentDate, formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { CompactStatBlock, ProfileStats } from "@/components/profile-stats"
import { BadgeDisplay } from "@/components/badge-display"
import { getProfileOverview } from "@/lib/utils/profile-overview"
import {
  canViewProfile,
  canViewUserPosts,
  canViewUserPets,
  canViewFollowers,
  canViewFollowing,
  canViewProfileField,
  canSendFollowRequest,
  canViewPost,
  canViewProfileSection,
  canViewPet,
} from "@/lib/utils/privacy"
import { getPrivacyNotice } from "@/lib/utils/privacy-messages"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { AudienceInsights } from "@/components/profile/audience-insights"
import { recordMediaView } from "@/lib/profile-analytics"

const STORAGE_KEYS_TO_WATCH = ["pet_social_users", "pet_social_pets", "pet_social_blog_posts", "pet_social_activities"]

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [pets, setPets] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [postCount, setPostCount] = useState(0)
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldNoIndex, setShouldNoIndex] = useState(false)
  const avatarRef = useRef<HTMLDivElement | null>(null)
  const coverRef = useRef<HTMLDivElement | null>(null)

  const loadProfile = useCallback(() => {
    setIsLoading(true)

    const allUsers = getUsers()
    const foundUser = allUsers.find((u) => u.username === username)
    const viewerId = currentUser?.id || null

    if (!foundUser || !canViewProfile(foundUser, viewerId)) {
      setUser(null)
      setPets([])
      setPosts([])
      setPostCount(0)
      setActivities([])
      setIsFollowing(false)
      setIsLoading(false)
      return
    }

    setUser(foundUser)
    setIsFollowing(viewerId ? foundUser.followers.includes(viewerId) : false)
    
    // Check if profile should be indexed by search engines
    const searchIndexingEnabled = foundUser.privacy?.searchIndexingEnabled !== false
    setShouldNoIndex(!searchIndexingEnabled)

    if (canViewUserPets(foundUser, viewerId)) {
      const visiblePets = getPets()
        .filter((p) => p.ownerId === foundUser.id)
        .filter((p) => canViewPet(p, foundUser, viewerId))
      setPets(visiblePets)
    } else {
      setPets([])
    }

    if (canViewUserPosts(foundUser, viewerId)) {
      const userPosts = getBlogPosts()
        .filter((p) => p.authorId === foundUser.id)
        .filter((p) => canViewPost(p, foundUser, viewerId))
      setPostCount(userPosts.length)
      setPosts(userPosts.slice(0, 6))
    } else {
      setPostCount(0)
      setPosts([])
    }

    if (canViewProfileSection("activity", foundUser, viewerId)) {
      const recentActivity = getActivities()
        .filter((activity) => activity.userId === foundUser.id)
        .slice(0, 10)
      setActivities(recentActivity)
    } else {
      setActivities([])
    }

    setIsLoading(false)
  }, [username, currentUser?.id])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useStorageListener(STORAGE_KEYS_TO_WATCH, loadProfile)

  useEffect(() => {
    if (currentUser && user) {
      setIsFollowing(user.followers.includes(currentUser.id))
    }
  }, [currentUser, user])

  const handleFollow = () => {
    if (!currentUser || !user) return

    const isCurrentlyFollowing = user.followers.includes(currentUser.id)

    const updatedFollowers = isCurrentlyFollowing
      ? user.followers.filter((id) => id !== currentUser.id)
      : [...new Set([...user.followers, currentUser.id])]

    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter((id) => id !== user.id)
      : [...new Set([...currentUser.following, user.id])]

    updateUser(user.id, { followers: updatedFollowers })
    updateUser(currentUser.id, { following: updatedFollowing })

    useAuth.setState((state) => {
      if (!state.user || state.user.id !== currentUser.id) {
        return state
      }
      return {
        ...state,
        user: {
          ...state.user,
          following: updatedFollowing,
        },
      }
    })

    setUser((prev: any) => (prev ? { ...prev, followers: updatedFollowers } : prev))
    setIsFollowing(!isCurrentlyFollowing)
    loadProfile()
  }

  // Record media views when visible (exclude owner)
  useEffect(() => {
    if (!user) return
    if (currentUser?.id === user.id) return
    // Avatar
    const aKey = `media_viewed_session_${user.id}_avatar`
    const aEl = avatarRef.current
    let aObs: IntersectionObserver | null = null
    if (aEl && !sessionStorage.getItem(aKey)) {
      aObs = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            try { recordMediaView(user.id, 'avatar'); sessionStorage.setItem(aKey, '1') } catch {}
            aObs && aObs.disconnect()
            break
          }
        }
      }, { threshold: 0.5 })
      aObs.observe(aEl)
    }
    // Cover
    const cKey = `media_viewed_session_${user.id}_cover`
    const cEl = coverRef.current
    let cObs: IntersectionObserver | null = null
    if (cEl && !sessionStorage.getItem(cKey)) {
      cObs = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            try { recordMediaView(user.id, 'cover'); sessionStorage.setItem(cKey, '1') } catch {}
            cObs && cObs.disconnect()
            break
          }
        }
      }, { threshold: 0.3 })
      cObs.observe(cEl)
    }
    return () => {
      try { aObs && aObs.disconnect() } catch {}
      try { cObs && cObs.disconnect() } catch {}
    }
  }, [user?.id, currentUser?.id])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">User not found or profile is private</p>
            <p className="text-muted-foreground">
              This profile may not exist or you don{"'"}t have permission to view it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)
  const canViewPosts = canViewUserPosts(user, viewerId)
  const canViewFollowersList = canViewFollowers(user, viewerId)
  const canViewFollowingList = canViewFollowing(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)
  const canViewBasics = canViewProfileSection("basics", user, viewerId)
  const canViewStatistics = canViewProfileSection("statistics", user, viewerId)
  const canViewActivityLogs = canViewProfileSection("activity", user, viewerId)

  // Get profile overview for badges and highlights
  const profileOverview = getProfileOverview(user.id)
  const badges = profileOverview?.badges
  const highlights = profileOverview?.highlights
  const completion = profileOverview?.completionPercent ?? 0

  const getPrivacyMessage = (scope: "pets" | "posts" | "followers" | "following") =>
    getPrivacyNotice({
      profileUser: user,
      scope,
      viewerId,
      canRequestAccess: canFollow,
    })

  const privacyLabelMap: Record<PrivacyLevel, string> = {
    public: "Public",
    "followers-only": "Followers Only",
    private: "Private",
  }

  const describeActivity = (activity: UserActivity) => {
    const targetLabels: Record<UserActivity["targetType"], string> = {
      user: "a community member",
      pet: "a pet profile",
      post: "a post",
      wiki: "a wiki article",
    }

    switch (activity.type) {
      case "follow":
        return `Followed ${targetLabels[activity.targetType]}`
      case "like":
        return `Liked ${targetLabels[activity.targetType]}`
      case "comment":
        return `Commented on ${targetLabels[activity.targetType]}`
      case "post":
        return activity.targetType === "post"
          ? "Published a new post"
          : `Shared a new ${targetLabels[activity.targetType]}`
      default:
        return "Recent activity"
    }
  }

  const formatTargetLabel = (type: UserActivity["targetType"]) => {
    switch (type) {
      case "user":
        return "User profile"
      case "pet":
        return "Pet profile"
      case "post":
        return "Post"
      case "wiki":
        return "Wiki article"
      default:
        return "Item"
    }
  }

  const isOwnProfile = currentUser?.id === user.id
  const coverPhoto = user.coverPhoto || "/golden-retriever-beach.png"
  const memberSinceLabel = (() => {
    const parsedDate = new Date(user.joinedAt)
    if (Number.isNaN(parsedDate.getTime())) {
      return formatDate(user.joinedAt)
    }
    return parsedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  })()
  const isVerified = Boolean(badges?.verified || user.badge === "verified")
  const statItems = [
    {
      key: "followers",
      label: user.followers.length === 1 ? "Follower" : "Followers",
      value: canViewFollowersList ? user.followers.length : "—",
      href: canViewFollowersList ? `/user/${user.username}/followers` : undefined,
      lockedMessage: !canViewFollowersList ? getPrivacyMessage("followers") : undefined,
    },
    {
      key: "following",
      label: "Following",
      value: canViewFollowingList ? user.following.length : "—",
      href: canViewFollowingList ? `/user/${user.username}/following` : undefined,
      lockedMessage: !canViewFollowingList ? getPrivacyMessage("following") : undefined,
    },
    {
      key: "posts",
      label: postCount === 1 ? "Post" : "Posts",
      value: canViewPosts ? postCount : "—",
      href: canViewPosts ? `/profile/${user.username}/posts` : undefined,
      lockedMessage: !canViewPosts ? getPrivacyMessage("posts") : undefined,
    },
  ]

  return (
      <>
      {shouldNoIndex && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      )}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('renamed_from')) && (
          <div className="mb-4 rounded-md border bg-amber-50 text-amber-900 border-amber-200 p-3 text-sm">
            This user recently changed their username from @{new URLSearchParams(window.location.search).get('renamed_from')} to @{user.username}.
          </div>
        )}
      <section className="rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div ref={coverRef} className="relative h-[220px] sm:h-[260px] lg:h-[400px] w-full group">
          <img src={coverPhoto} alt={`${user.fullName}'s cover`} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/50" />
          {isOwnProfile && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-white text-sm font-semibold uppercase tracking-wide bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5" />
              Change Cover
            </div>
          )}
        </div>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-20 sm:-mt-24 flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="relative group self-start" ref={avatarRef}>
                  <Avatar className="h-[200px] w-[200px] border-4 border-background shadow-2xl">
                    {canViewBasics ? (
                      <>
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                        <AvatarFallback className="text-4xl">{user.fullName.charAt(0)}</AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {isOwnProfile && canViewBasics && (
                    <div className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-sm font-medium">
                      <Camera className="h-5 w-5" />
                      Change Photo
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-[250px] space-y-4">
                  {canViewBasics ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-4xl font-bold tracking-tight">{user.fullName}</h1>
                          <BadgeDisplay user={user} size="lg" variant="icon" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-lg text-muted-foreground">
                          <span className="flex items-center gap-2">
                            @{user.username}
                            {/* Blue verification checkmark next to username */}
                            {isVerified && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center justify-center h-5 w-5" aria-label="Verified account">
                                      <CheckCircle2 className="h-4 w-4 text-sky-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Verified account</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {(() => {
                              const pct = profileOverview?.completionPercent ?? 0
                              const tier = pct <= 30 ? "Bronze" : pct <= 60 ? "Silver" : pct <= 85 ? "Gold" : "Platinum"
                              const color = tier === "Bronze" ? "text-amber-600" : tier === "Silver" ? "text-slate-400" : tier === "Gold" ? "text-yellow-500" : "text-indigo-500"
                              return (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted/60" aria-label={`Profile strength: ${tier}`}>
                                        <Award className={`h-3.5 w-3.5 ${color}`} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Profile strength: {tier}. This user has a complete, verified profile.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            })()}
                          </span>
                        </div>
                      </div>
                      {user.bio && <p className="text-base text-foreground">{user.bio}</p>}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {user.location && canViewProfileField("location", user, viewerId) && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {user.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Member since {memberSinceLabel}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">Profile basics are private</p>
                      <p>Follow to request access to @{user.username}{"'"}s profile details.</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-8 pt-2">
                    {statItems.map((stat) => {
                      const content = (
                        <div className="flex flex-col" title={stat.lockedMessage}>
                          <span className="text-3xl font-bold leading-tight">{stat.value}</span>
                          <span className="mt-1 text-sm font-medium text-muted-foreground flex items-center gap-1">
                            {stat.label}
                            {!stat.href && stat.lockedMessage && <Lock className="h-3 w-3" />}
                          </span>
                        </div>
                      )
                      return stat.href ? (
                        <Link
                          key={stat.key}
                          href={stat.href}
                          className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div key={stat.key} className="opacity-80" title={stat.lockedMessage}>
                          {content}
                        </div>
                      )
                    })}
                  </div>
                  {canViewStatistics ? (
                    <div className="mt-2 space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <CompactStatBlock
                          label={pets.length === 1 ? "Pet" : "Pets"}
                          value={canViewPets ? pets.length : "—"}
                          icon={PawPrint}
                          href={canViewPets ? `/profile/${user.username}/pets` : undefined}
                          isLocked={!canViewPets}
                          lockedMessage={!canViewPets ? getPrivacyMessage("pets") : undefined}
                        />
                        <CompactStatBlock
                          label="Posts"
                          value={canViewPosts ? postCount : "—"}
                          icon={FileText}
                          href={canViewPosts ? `/profile/${user.username}/posts` : undefined}
                          isLocked={!canViewPosts}
                          lockedMessage={!canViewPosts ? getPrivacyMessage("posts") : undefined}
                        />
                      </div>
                      <ProfileStats
                        followers={user.followers.length}
                        following={user.following.length}
                        followersHref={canViewFollowersList ? `/user/${user.username}/followers` : undefined}
                        followingHref={canViewFollowingList ? `/user/${user.username}/following` : undefined}
                        canViewFollowers={canViewFollowersList}
                        canViewFollowing={canViewFollowingList}
                        followersLockedMessage={!canViewFollowersList ? getPrivacyMessage("followers") : undefined}
                        followingLockedMessage={!canViewFollowingList ? getPrivacyMessage("following") : undefined}
                        badges={badges}
                        highlights={highlights}
                      />
                      {currentUser?.id === user.id && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Profile completion</span>
                            <span>{completion}%</span>
                          </div>
                          <Progress value={completion} />
                          {completion < 100 && (
                            <Link href={`/user/${user.username}/edit`} className="text-xs text-primary hover:underline">
                              Complete your profile
                            </Link>
                          )}
                        </div>
                      )}
                      {currentUser?.id === user.id && (
                        <div className="mt-4 space-y-4">
                          <ProfileInsights profileId={user.id} />
                          <AudienceInsights profileId={user.id} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span>Profile statistics are hidden by the owner's privacy settings.</span>
                    </div>
                  )}
                </div>
              </div>
              {currentUser && currentUser.id !== user.id && (
                <div className="flex items-start justify-end">
                  {isFollowing ? (
                    <Button onClick={handleFollow} variant="outline">
                      Unfollow
                    </Button>
                  ) : canFollow ? (
                    <Button onClick={handleFollow} variant="default">
                      Follow
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Tabs defaultValue="pets" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pets">Pets</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="pets" className="mt-6">
          {!canViewPets ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">{getPrivacyMessage("pets")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentUser && currentUser.id === user.id && (
                <div className="mb-6 flex justify-end">
                  <Link href={`/profile/${user.username}/add-pet`}>
                    <CreateButton iconType="paw" size="lg" className="gap-2 px-6 py-6 text-base">
                      Add Pet
                    </CreateButton>
                  </Link>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((pet) => {
                  const ownerPrivacyFallback = (user.privacy?.sections?.pets ?? user.privacy?.pets ?? "public") as PrivacyLevel
                  const rawPrivacy = pet.privacy
                  const visibilitySetting =
                    rawPrivacy && typeof rawPrivacy === "object" && "visibility" in rawPrivacy
                      ? (rawPrivacy.visibility as PrivacyLevel)
                      : typeof rawPrivacy === "string"
                        ? (rawPrivacy as PrivacyLevel)
                        : ownerPrivacyFallback
                  const interactionSetting =
                    rawPrivacy && typeof rawPrivacy === "object" && "interactions" in rawPrivacy
                      ? (rawPrivacy.interactions as PrivacyLevel)
                      : typeof rawPrivacy === "string"
                        ? (rawPrivacy as PrivacyLevel)
                        : ownerPrivacyFallback
                  const withYouLabel = (() => {
                    if (!pet.adoptionDate) return null
                    const adopt = new Date(pet.adoptionDate)
                    if (Number.isNaN(adopt.getTime())) return null
                    const now = new Date()
                    let months = (now.getFullYear() - adopt.getFullYear()) * 12 + (now.getMonth() - adopt.getMonth())
                    if (now.getDate() < adopt.getDate()) months -= 1
                    if (months < 0) months = 0
                    const years = Math.floor(months / 12)
                    const remMonths = months % 12
                    if (years > 0) {
                      return `With you for ${years} year${years === 1 ? "" : "s"}${remMonths ? `, ${remMonths} month${remMonths === 1 ? "" : "s"}` : ""}`
                    }
                    return `With you for ${months} month${months === 1 ? "" : "s"}`
                  })()

                  return (
                    <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                              <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">{pet.name}</h3>
                                {pet.spayedNeutered && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Fixed
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {pet.breed || pet.species}
                                {pet.age && ` • ${pet.age} ${pet.age === 1 ? "year" : "years"} old`}
                              </p>
                              {pet.bio && <p className="text-sm mt-2 line-clamp-2">{pet.bio}</p>}
                              {withYouLabel && (
                                <p className="text-xs text-muted-foreground mt-1">{withYouLabel}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  Visibility: {privacyLabelMap[visibilitySetting]}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  Interactions: {privacyLabelMap[interactionSetting]}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {pet.followers.length} {pet.followers.length === 1 ? "follower" : "followers"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              {pets.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center space-y-3">
                    <img src="/man-and-cat.png" alt="Add your first pet" className="h-32 w-auto mx-auto rounded-md" />
                    <p className="text-base text-foreground font-medium">Add your first furry friend!</p>
                    <p className="text-sm text-muted-foreground">Create a pet profile to start sharing updates.</p>
                    {currentUser && currentUser.id === user.id && (
                      <Link href={`/profile/${user.username}/add-pet`}>
                        <CreateButton iconType="paw" size="lg" className="mt-2 px-6 py-6 text-base">
                          Add Pet
                        </CreateButton>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          {!canViewPosts ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">{getPrivacyMessage("posts")}</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => {
                  const pet = pets.find((p) => p.id === post.petId)
                  return (
                    <Link key={post.id} href={`/blog/${post.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        {post.coverImage && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                            <img
                              src={post.coverImage || "/placeholder.svg"}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            By {pet?.name} • {formatDate(post.createdAt)}
                          </p>
                          <p className="text-sm mt-2 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {post.likes.length}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              {posts.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">No posts yet</CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          {!canViewActivityLogs ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">Recent activity is hidden by the owner's privacy settings.</p>
              </CardContent>
            </Card>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <ActivityIcon className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">No recent activity yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ActivityIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm sm:text-base">{describeActivity(activity)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatCommentDate(activity.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTargetLabel(activity.targetType)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  )
}
