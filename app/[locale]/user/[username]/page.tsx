"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EditButton } from "@/components/ui/edit-button"
import { Badge } from "@/components/ui/badge"
import { CategoryTabs, type TabItem } from "@/components/ui/category-tabs"
import { TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  getUserByUsername,
  getPetsByOwnerId,
  getBlogPosts,
  toggleFollow,
  updateBlogPost,
  deleteBlogPost,
  blockUser,
  unblockUser,
  getWikiRevisions,
  getGroupMembersByGroupId,
} from "@/lib/storage"
import type { User, BlogPost, WikiRevision, Group } from "@/lib/types"
import {
  MapPin,
  Calendar,
  Mail,
  Phone,
  Globe,
  Users,
  Heart,
  PawPrint,
  BookOpen,
  Save,
  X,
  UserPlus,
  UserMinus,
  Lock,
  User as UserIcon,
  MessageCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Fish,
  Turtle,
  CircleDot,
  Activity,
  HeartHandshake,
  Ruler,
  GraduationCap,
  Zap,
  Scissors,
  Dumbbell,
  Baby,
  ShieldCheck,
  Ban,
  Camera,
  FileText,
  Users as UsersIcon,
  Pin,
} from "lucide-react"
import Link from "next/link"
import { BadgeDisplay } from "@/components/badge-display"
import { RoleBadge } from "@/components/role-badge"
import { TierBadge } from "@/components/tier-badge"
import { SidebarUserList } from "@/components/sidebar-user-list"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatDate } from "@/lib/utils/date"
import { Progress } from "@/components/ui/progress"
import { getAnimalConfigLucide } from "@/lib/animal-types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  canViewProfile,
  canViewUserPosts,
  canViewUserPets,
  canViewFollowers,
  canViewFollowing,
  canViewProfileField,
  canSendFollowRequest,
  canViewPost,
} from "@/lib/utils/privacy"
import { getPrivacyNotice } from "@/lib/utils/privacy-messages"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import { PostContent } from "@/components/post/post-content"
import { CompactStatBlock, ProfileStats } from "@/components/profile-stats"
import { getProfileOverview } from "@/lib/utils/profile-overview"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Award } from "lucide-react"
import { usePinnedItems } from "@/lib/pinned-items"
import { useProfileUpdates } from "@/lib/profile-updates"
import { recordProfileView, classifyReferrer } from "@/lib/profile-analytics"
import { ProfileInsights } from "@/components/profile/profile-insights"

const STORAGE_KEYS_TO_WATCH = ["pet_social_users", "pet_social_pets", "pet_social_blog_posts"]

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated, initialize } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [pets, setPets] = useState<any[]>([])
  const [feedPosts, setFeedPosts] = useState<BlogPost[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const { checkIsPinned } = usePinnedItems()
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editPostContent, setEditPostContent] = useState("")
  const [editingBlogPostId, setEditingBlogPostId] = useState<string | null>(null)
  const [blockActionPending, setBlockActionPending] = useState(false)

  const loadProfile = useCallback(() => {
    const usernameParam = params.username as string
    const fetchedUser = getUserByUsername(usernameParam)

    if (!fetchedUser) {
      setUser(null)
      setPets([])
      setFeedPosts([])
      setBlogPosts([])
      setIsFollowing(false)
      router.push("/")
      return
    }

    const viewer = useAuth.getState().user
    const viewerId = viewer?.id || null

    if (!canViewProfile(fetchedUser, viewerId)) {
      setUser(null)
      setPets([])
      setFeedPosts([])
      setBlogPosts([])
      setIsFollowing(false)
      router.push("/")
      return
    }

    setUser(fetchedUser)

    if (canViewUserPets(fetchedUser, viewerId)) {
      setPets(getPetsByOwnerId(fetchedUser.id))
    } else {
      setPets([])
    }

    if (canViewUserPosts(fetchedUser, viewerId)) {
      const authorPosts = getBlogPosts().filter((post) => post.authorId === fetchedUser.id)
      const visiblePosts = authorPosts
        .filter((post) => canViewPost(post, fetchedUser, viewerId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setFeedPosts(visiblePosts)
      setBlogPosts(visiblePosts)
    } else {
      setFeedPosts([])
      setBlogPosts([])
    }

    setIsFollowing(viewer ? viewer.following.includes(fetchedUser.id) : false)
  }, [params.username, router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile, currentUser?.id])

  useStorageListener(STORAGE_KEYS_TO_WATCH, loadProfile)

  // Realtime: refresh this profile when its photo updates
  useProfileUpdates((evt) => {
    if (evt.type === 'profilePhotoUpdated' || evt.type === 'coverPhotoUpdated') {
      const usernameParam = params.username as string
      const current = getUserByUsername(usernameParam)
      if (current && current.id === evt.userId) {
        loadProfile()
      }
    }
  })

  const handleFollow = () => {
    if (!currentUser || !user) return
    const isCurrentlyFollowing = currentUser.following.includes(user.id)

    toggleFollow(currentUser.id, user.id)

    const updatedFollowing = isCurrentlyFollowing
      ? currentUser.following.filter((id) => id !== user.id)
      : [...new Set([...currentUser.following, user.id])]

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

    setIsFollowing(!isCurrentlyFollowing)
    loadProfile()
  }

  // Record profile view once per session for non-owners
  useEffect(() => {
    if (!user) return
    if (currentUser?.id === user.id) return
    const src = classifyReferrer(typeof document !== 'undefined' ? document.referrer : '')
    recordProfileView(user.id, currentUser?.id || null, src)
  }, [user?.id, currentUser?.id])

  const handleBlockUser = () => {
    if (!currentUser || !user) return

    const confirmed = window.confirm(
      `Block ${user.fullName}? They will no longer be able to interact with you or see your content.`,
    )
    if (!confirmed) {
      return
    }

    setBlockActionPending(true)
    try {
      blockUser(currentUser.id, user.id)
      initialize()
      router.push("/")
    } finally {
      setBlockActionPending(false)
    }
  }

  const handleUnblockUser = () => {
    if (!currentUser || !user) return

    setBlockActionPending(true)
    try {
      unblockUser(currentUser.id, user.id)
      initialize()
      const refreshedUser = getUserByUsername(user.username)
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    } finally {
      setBlockActionPending(false)
    }
  }

  const handleEditPost = (post: BlogPost) => {
    setEditingPostId(post.id)
    setEditPostContent(post.content)
  }

  const handleSavePost = (postId: string) => {
    if (!currentUser) return
    const post = feedPosts.find((p) => p.id === postId)
    if (!post) return

    const updatedPost: BlogPost = {
      ...post,
      content: editPostContent.trim(),
      updatedAt: new Date().toISOString(),
    }

    try {
      updateBlogPost(updatedPost)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update post")
      return
    }

    loadProfile()
    setEditingPostId(null)
    setEditPostContent("")
  }

  const handleCancelEdit = () => {
    setEditingPostId(null)
    setEditPostContent("")
  }

  const handleDeletePost = (postId: string) => {
    if (!currentUser) return
    if (!window.confirm("Are you sure you want to delete this post?")) return

    try {
      deleteBlogPost(postId)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete post")
      return
    }

    loadProfile()
  }

  const handleDeleteBlogPost = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return

    try {
      deleteBlogPost(postId)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete post")
      return
    }

    loadProfile()
  }

  // Calculate mutual followers - must be before early return
  const mutualFollowersCount = useMemo(() => {
    if (!currentUser || !user || currentUser.id === user.id) return 0
    const currentUserFollowing = currentUser.following || []
    const profileUserFollowers = user.followers || []
    const mutual = currentUserFollowing.filter((id) => profileUserFollowers.includes(id))
    return mutual.length
  }, [currentUser, user])

  // Get profile overview for badges and highlights - must be before early return
  const profileOverview = useMemo(() => {
    if (!user) return null
    return getProfileOverview(user.id)
  }, [user?.id])

  if (!user) return null

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)
  const canViewPosts = canViewUserPosts(user, viewerId)
  const canViewFollowersList = canViewFollowers(user, viewerId)
  const canViewFollowingList = canViewFollowing(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)
  const viewerHasBlocked = viewerId ? currentUser?.blockedUsers?.includes(user.id) ?? false : false
  const profileHasBlockedViewer = viewerId ? user.blockedUsers?.includes(viewerId) ?? false : false
  const isInteractionBlocked = Boolean(viewerHasBlocked || profileHasBlockedViewer)
  const blockMenuLabel = viewerHasBlocked ? "Unblock User" : "Block User"
  const blockMenuAction = viewerHasBlocked ? handleUnblockUser : handleBlockUser

  const getPrivacyMessage = (scope: "pets" | "posts" | "followers" | "following") =>
    getPrivacyNotice({
      profileUser: user,
      scope,
      viewerId,
      canRequestAccess: canFollow,
    })

  const stats = [
    { label: "Pets", value: canViewPets ? pets.length : 0, icon: PawPrint, canView: canViewPets },
    { label: "Feed Posts", value: canViewPosts ? feedPosts.length : 0, icon: MessageCircle, canView: canViewPosts },
    { label: "Blog Posts", value: canViewPosts ? blogPosts.length : 0, icon: BookOpen, canView: canViewPosts },
    { label: "Followers", value: canViewFollowersList ? user.followers.length : 0, icon: Users, canView: canViewFollowersList },
    { label: "Following", value: canViewFollowingList ? user.following.length : 0, icon: Heart, canView: canViewFollowingList },
  ]

  const badges = profileOverview?.badges
  const highlights = profileOverview?.highlights
  const completion = profileOverview?.completionPercent ?? 0
  const isVerified = Boolean(badges?.verified || user.badge === 'verified')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-6xl">
        {typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('renamed_from')) && (
          <div className="mb-4 rounded-md border bg-amber-50 text-amber-900 border-amber-200 p-3 text-sm">
            This user recently changed their username from @{new URLSearchParams(window.location.search).get('renamed_from')} to @{user.username}.
          </div>
        )}
        {/* Profile Header */}
        <Card className="mb-6 shadow-sm border bg-card">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              {/* Profile Picture */}
              <div className="flex justify-center sm:justify-start">
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 border-4 border-background shadow-lg ring-2 ring-primary/20">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                  <AvatarFallback className="text-3xl sm:text-4xl lg:text-5xl bg-primary/10 text-primary">
                    {user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4 min-w-0">
                {/* Name, Username, and Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground truncate">
                        {user.fullName}
                      </h1>
                      <BadgeDisplay user={user} size="lg" />
                      <RoleBadge role={user.role} size="md" />
                      <TierBadge user={user} size="md" showPoints={isOwnProfile} />
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                      @{user.username}
                      {isVerified && (
                        <span className="inline-flex items-center justify-center h-5 w-5" title="Verified account">
                          <CheckCircle2 className="h-4 w-4 text-sky-500" />
                        </span>
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
                    </p>
                    {mutualFollowersCount > 0 && !isOwnProfile && (
                      <Badge variant="secondary" className="w-fit mt-1">
                        {mutualFollowersCount} mutual follower{mutualFollowersCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {user.isPro && user.proExpiresAt && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Pro member until {formatDate(user.proExpiresAt)}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    {isOwnProfile ? (
                      <EditButton onClick={() => router.push(`/user/${user.username}/edit`)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </EditButton>
                    ) : (
                      isAuthenticated && (
                        <>
                          {isInteractionBlocked ? (
                            <Badge variant="secondary" className="flex items-center gap-2 px-3 py-2">
                              <Ban className="h-4 w-4" />
                              Blocked
                            </Badge>
                          ) : (
                            <>
                              {isFollowing ? (
                                <Button
                                  onClick={handleFollow}
                                  variant="outline"
                                  disabled={blockActionPending}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Unfollow
                                </Button>
                              ) : canFollow ? (
                                <Button
                                  onClick={handleFollow}
                                  variant="default"
                                  disabled={blockActionPending}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Follow
                                </Button>
                              ) : null}
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Profile actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={blockMenuAction}
                                disabled={blockActionPending}
                                className={`flex items-center gap-2 ${viewerHasBlocked ? "" : "text-destructive focus:text-destructive"}`}
                              >
                                <Ban className="h-4 w-4" />
                                {blockMenuLabel}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )
                    )}
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
                    {user.bio}
                  </p>
                )}

                {/* Favorite Animals */}
                {user.favoriteAnimals && user.favoriteAnimals.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">Favorite Animals:</span>
                    {user.favoriteAnimals.map((animal) => {
                      const animalConfig = getAnimalConfigLucide(animal)
                      if (!animalConfig) return null
                      const Icon = animalConfig.icon
                      return (
                        <Badge key={animal} variant="secondary" className="px-2 py-1 flex items-center gap-1.5 text-xs">
                          <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${animalConfig.color}`} />
                          <span>{animalConfig.label}</span>
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Shelter Sponsorship */}
                {user.shelterSponsorship && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 px-3 py-2 rounded-lg w-fit">
                    <Heart className="h-4 w-4" />
                    <span>Supporting animal shelters</span>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-2">
                  <CompactStatBlock
                    label="Pets"
                    value={stats.find((s) => s.label === "Pets")?.value || 0}
                    icon={PawPrint}
                    href={canViewPets ? `/user/${user.username}/pets` : undefined}
                    isLocked={!canViewPets}
                    lockedMessage={!canViewPets ? getPrivacyMessage("pets") : undefined}
                  />
                  <CompactStatBlock
                    label="Feed Posts"
                    value={stats.find((s) => s.label === "Feed Posts")?.value || 0}
                    icon={MessageCircle}
                    href={canViewPosts ? `#feed` : undefined}
                    isLocked={!canViewPosts}
                    lockedMessage={!canViewPosts ? getPrivacyMessage("posts") : undefined}
                  />
                  <CompactStatBlock
                    label="Blog Posts"
                    value={stats.find((s) => s.label === "Blog Posts")?.value || 0}
                    icon={BookOpen}
                    href={canViewPosts ? `#blog` : undefined}
                    isLocked={!canViewPosts}
                    lockedMessage={!canViewPosts ? getPrivacyMessage("posts") : undefined}
                  />
                  <CompactStatBlock
                    label={user.followers.length === 1 ? "Follower" : "Followers"}
                    value={canViewFollowersList ? user.followers.length : "—"}
                    icon={Users}
                    href={canViewFollowersList ? `/user/${user.username}/followers` : undefined}
                    isLocked={!canViewFollowersList}
                    lockedMessage={!canViewFollowersList ? getPrivacyMessage("followers") : undefined}
                  />
                  <CompactStatBlock
                    label="Following"
                    value={canViewFollowingList ? user.following.length : "—"}
                    icon={Heart}
                    href={canViewFollowingList ? `/user/${user.username}/following` : undefined}
                    isLocked={!canViewFollowingList}
                    lockedMessage={!canViewFollowingList ? getPrivacyMessage("following") : undefined}
                  />
                </div>
                
                {/* Badges and Highlights */}
                {(badges || highlights || (isOwnProfile && completion >= 0)) && (
                  <div className="pt-2 space-y-2">
                    {badges && (badges.verified || badges.pro || badges.shelter || badges.vet) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {badges.verified && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </Badge>
                        )}
                        {badges.pro && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Pro
                          </Badge>
                        )}
                        {badges.shelter && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            Shelter
                          </Badge>
                        )}
                        {badges.vet && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            Veterinarian
                          </Badge>
                        )}
                      </div>
                    )}
                    {highlights?.highEngagement && (
                      <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-md p-2 w-fit">
                        <Activity className="h-4 w-4" />
                        <span className="font-medium">High engagement profile</span>
                      </div>
                    )}
                    {isOwnProfile && (
                      <div className="space-y-1 w-full max-w-xs">
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
                  </div>
                )}
                {isOwnProfile && (
                  <div className="pt-4">
                    <ProfileInsights profileId={user.id} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <CategoryTabs
              value={activeTab}
              onValueChange={setActiveTab}
              items={[
                { value: "posts", label: "Posts", icon: MessageCircle, color: "text-blue-500" },
                { value: "pets", label: "Pets", icon: PawPrint, color: "text-orange-500" },
                { value: "photos", label: "Photos", icon: Camera, color: "text-green-500" },
                { value: "wiki-edits", label: "Wiki Edits", icon: FileText, color: "text-purple-500" },
                { value: "groups", label: "Groups", icon: UsersIcon, color: "text-pink-500" },
              ]}
              className="w-full"
              defaultGridCols={{ mobile: 2, tablet: 3, desktop: 5 }}
              showLabels={{ mobile: true, desktop: true }}
            >

              <TabsContent value="posts" className="space-y-4">
                {!canViewPosts ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{getPrivacyMessage("posts")}</p>
                    </CardContent>
                  </Card>
                ) : feedPosts.length > 0 ? (
                  feedPosts.map((post) => {
                    const pet = pets.find((p) => p.id === post.petId)
                    const isOwnPost = isOwnProfile && post.authorId === currentUser?.id
                    const isEditingThisPost = editingPostId === post.id
                    return (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {pet && (
                                  <>
                                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-sm sm:text-base truncate">{pet.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(post.createdAt)}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              {isOwnPost && !isEditingThisPost && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete post
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            {isEditingThisPost ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editPostContent}
                                  onChange={(e) => setEditPostContent(e.target.value)}
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => handleSavePost(post.id)} size="sm">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button onClick={handleCancelEdit} variant="outline" size="sm">
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <PostContent content={post.content} post={post} className="text-foreground text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed" />
                            )}
                            {post.images && post.images.length > 0 && (
                              <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' :
                                  post.images.length === 2 ? 'grid-cols-2' :
                                    post.images.length === 3 ? 'grid-cols-3' :
                                      'grid-cols-2 sm:grid-cols-3'
                                }`}>
                                {post.images.map((image, index) => (
                                  <div key={index} className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer">
                                    <img src={image} alt={`Post image ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                  </div>
                                ))}
                              </div>
                            )}
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {post.hashtags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{post.likes?.length || 0}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No feed posts yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="blog" className="space-y-4">
                {!canViewPosts ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{getPrivacyMessage("posts")}</p>
                    </CardContent>
                  </Card>
                ) : blogPosts.length > 0 ? (
                  [...blogPosts]
                    .sort((a, b) => {
                      // Show pinned posts first
                      const aPinned = checkIsPinned("post", a.id)
                      const bPinned = checkIsPinned("post", b.id)
                      if (aPinned !== bPinned) return aPinned ? -1 : 1
                      // Then by date
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .map((post) => {
                    const pet = pets.find((p) => p.id === post.petId)
                    const isOwnPost = isOwnProfile && post.authorId === currentUser?.id
                    return (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-4 sm:p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                {pet && (
                                  <>
                                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm sm:text-base truncate">{pet.name}</p>
                                        {checkIsPinned("post", post.id) && (
                                          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                                            <Pin className="h-3 w-3 fill-current" />
                                            Pinned
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(post.createdAt)}
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              {isOwnPost && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <Link href={`/blog/${post.id}/edit`}>
                                      <DropdownMenuItem>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem onClick={() => handleDeleteBlogPost(post.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            <Link href={`/blog/${post.id}`}>
                              <div className="space-y-3 cursor-pointer hover:opacity-80 transition-opacity">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold line-clamp-2">{post.title}</h3>
                                <div className="text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed">
                                  <PostContent content={post.content} post={post} />
                                </div>
                                {post.coverImage && (
                                  <div className="w-full overflow-hidden rounded-lg">
                                    <img
                                      src={post.coverImage || "/placeholder.svg"}
                                      alt={post.title}
                                      className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" />
                                    <span>{post.likes?.length || 0}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {post.tags.slice(0, 3).map((tag: string) => (
                                      <Badge key={tag} variant="secondary">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No blog posts yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pets" className="space-y-4">
                {!canViewPets ? (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{getPrivacyMessage("pets")}</p>
                    </CardContent>
                  </Card>
                ) : pets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {pets.map((pet) => (
                      <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                        <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] border-0 bg-card/50">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 flex-shrink-0 ring-2 ring-primary/20">
                                <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                <AvatarFallback className="text-lg sm:text-xl">{pet.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base sm:text-lg md:text-xl truncate">{pet.name}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground capitalize truncate">
                                  {pet.breed || pet.species}
                                  {pet.age && ` • ${pet.age} years old`}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span>{pet.followers.length} followers</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No pets added yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="about">
                <Card className="shadow-md">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {user.occupation && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span>{user.occupation}</span>
                      </div>
                    )}
                    {user.location && canViewProfileField("location", user, viewerId) && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <a
                          href={user.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {user.website}
                        </a>
                      </div>
                    )}
                    {user.email && canViewProfileField("email", user, viewerId) && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.favoriteAnimals && user.favoriteAnimals.length > 0 && (
                      <div className="flex items-center gap-3">
                        <PawPrint className="h-5 w-5 text-muted-foreground" />
                        <span>Favorite: {user.favoriteAnimals.join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span>Joined {formatDate(user.joinedAt)}</span>
                    </div>
                    {user.interests && user.interests.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-3">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.interests.map((interest) => (
                            <Badge key={interest} variant="secondary">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pet Preferences Section */}
                    {(user.willingToAdopt ||
                      user.preferredPetSize ||
                      user.trainingStyle ||
                      user.activityLevelPreference ||
                      user.energyLevelPreference ||
                      user.groomingNeedsPreference ||
                      user.exerciseNeedsPreference ||
                      user.agePreference ||
                      user.healthStatusPreference ||
                      user.specialNeedsAcceptance ||
                      user.breedPreferences) && (
                        <div className="pt-4 border-t">
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <Heart className="h-5 w-5 text-primary" />
                            Pet Preferences
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {user.willingToAdopt && (
                              <div className="flex items-center gap-3">
                                <HeartHandshake className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Willing to Adopt:</span>
                                  <span className="ml-2">
                                    {user.willingToAdopt === "yes" ? "Yes, Looking to Adopt" :
                                      user.willingToAdopt === "maybe" ? "Maybe in the Future" :
                                        user.willingToAdopt === "no" ? "Not Currently" : user.willingToAdopt}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.preferredPetSize && (
                              <div className="flex items-center gap-3">
                                <Ruler className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Preferred Size:</span>
                                  <span className="ml-2 capitalize">{user.preferredPetSize}</span>
                                </div>
                              </div>
                            )}
                            {user.trainingStyle && (
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Training Style:</span>
                                  <span className="ml-2">
                                    {user.trainingStyle === "positive-reinforcement" ? "Positive Reinforcement" :
                                      user.trainingStyle === "balanced" ? "Balanced Training" :
                                        user.trainingStyle === "clicker" ? "Clicker Training" :
                                          user.trainingStyle === "natural" ? "Natural Training" : user.trainingStyle}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.activityLevelPreference && (
                              <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Activity Level:</span>
                                  <span className="ml-2 capitalize">
                                    {user.activityLevelPreference === "low" ? "Low (Calm/Couch Potato)" :
                                      user.activityLevelPreference === "moderate" ? "Moderate" :
                                        user.activityLevelPreference === "high" ? "High (Very Active)" :
                                          user.activityLevelPreference === "any" ? "Any Activity Level" : user.activityLevelPreference}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.energyLevelPreference && (
                              <div className="flex items-center gap-3">
                                <Zap className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Energy Level:</span>
                                  <span className="ml-2 capitalize">
                                    {user.energyLevelPreference === "low" ? "Low Energy" :
                                      user.energyLevelPreference === "moderate" ? "Moderate Energy" :
                                        user.energyLevelPreference === "high" ? "High Energy" :
                                          user.energyLevelPreference === "any" ? "Any Energy Level" : user.energyLevelPreference}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.groomingNeedsPreference && (
                              <div className="flex items-center gap-3">
                                <Scissors className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Grooming Needs:</span>
                                  <span className="ml-2 capitalize">
                                    {user.groomingNeedsPreference === "minimal" ? "Minimal Grooming" :
                                      user.groomingNeedsPreference === "moderate" ? "Moderate Grooming" :
                                        user.groomingNeedsPreference === "high" ? "High Grooming Needs" :
                                          user.groomingNeedsPreference === "professional" ? "Professional Grooming Required" :
                                            user.groomingNeedsPreference === "any" ? "Any Grooming Level" : user.groomingNeedsPreference}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.exerciseNeedsPreference && (
                              <div className="flex items-center gap-3">
                                <Dumbbell className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Exercise Needs:</span>
                                  <span className="ml-2 capitalize">
                                    {user.exerciseNeedsPreference === "low" ? "Low Exercise Needs" :
                                      user.exerciseNeedsPreference === "moderate" ? "Moderate Exercise" :
                                        user.exerciseNeedsPreference === "high" ? "High Exercise Needs" :
                                          user.exerciseNeedsPreference === "very-high" ? "Very High Exercise Needs" :
                                            user.exerciseNeedsPreference === "any" ? "Any Exercise Level" : user.exerciseNeedsPreference}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.agePreference && (
                              <div className="flex items-center gap-3">
                                <Baby className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Age Preference:</span>
                                  <span className="ml-2">
                                    {user.agePreference === "puppy-kitten" ? "Puppy/Kitten (0-1 year)" :
                                      user.agePreference === "young" ? "Young (1-3 years)" :
                                        user.agePreference === "adult" ? "Adult (3-7 years)" :
                                          user.agePreference === "senior" ? "Senior (7+ years)" :
                                            user.agePreference === "any" ? "Any Age" : user.agePreference}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.healthStatusPreference && (
                              <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Health Status:</span>
                                  <span className="ml-2">
                                    {user.healthStatusPreference === "healthy" ? "Fully Healthy" :
                                      user.healthStatusPreference === "minor-issues" ? "Minor Health Issues OK" :
                                        user.healthStatusPreference === "chronic-conditions" ? "Chronic Conditions OK" :
                                          user.healthStatusPreference === "special-needs" ? "Special Needs OK" :
                                            user.healthStatusPreference === "any" ? "Any Health Status" : user.healthStatusPreference}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.specialNeedsAcceptance && (
                              <div className="flex items-center gap-3">
                                <HeartHandshake className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Special Needs:</span>
                                  <span className="ml-2">
                                    {user.specialNeedsAcceptance === "yes" ? "Yes, Open to Special Needs" :
                                      user.specialNeedsAcceptance === "maybe" ? "Maybe, Depending on Needs" :
                                        user.specialNeedsAcceptance === "no" ? "Prefer Fully Healthy" : user.specialNeedsAcceptance}
                                  </span>
                                </div>
                              </div>
                            )}
                            {user.breedPreferences && (
                              <div className="flex items-start gap-3 md:col-span-2">
                                <Heart className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-muted-foreground block mb-1">Breed Preferences:</span>
                                  <p className="text-sm whitespace-pre-wrap">{user.breedPreferences}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>
            </CategoryTabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 mt-6 lg:mt-0">
            {canViewFollowersList ? (
              <SidebarUserList
                title="Followers"
                icon={Users}
                userIds={user.followers}
                username={user.username}
                type="followers"
                emptyMessage="No followers yet"
                viewAllMessage={`View all ${user.followers.length} followers`}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground space-y-3">
                  <Lock className="h-10 w-10 mx-auto opacity-50" />
                  <p className="text-sm leading-relaxed">{getPrivacyMessage("followers")}</p>
                </CardContent>
              </Card>
            )}
            {canViewFollowingList ? (
              <SidebarUserList
                title="Following"
                icon={Heart}
                userIds={user.following}
                username={user.username}
                type="following"
                emptyMessage="Not following anyone yet"
                viewAllMessage={`View all ${user.following.length} following`}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground space-y-3">
                  <Lock className="h-10 w-10 mx-auto opacity-50" />
                  <p className="text-sm leading-relaxed">{getPrivacyMessage("following")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
