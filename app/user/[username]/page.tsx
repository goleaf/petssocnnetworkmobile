"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
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
} from "@/lib/storage"
import type { User, BlogPost } from "@/lib/types"
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
} from "lucide-react"
import Link from "next/link"
import { BadgeDisplay } from "@/components/badge-display"
import { RoleBadge } from "@/components/role-badge"
import { TierBadge } from "@/components/tier-badge"
import { SidebarUserList } from "@/components/sidebar-user-list"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatDate } from "@/lib/utils/date"
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

const STORAGE_KEYS_TO_WATCH = ["pet_social_users", "pet_social_pets", "pet_social_blog_posts"]

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated, initialize } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [pets, setPets] = useState<any[]>([])
  const [feedPosts, setFeedPosts] = useState<BlogPost[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("feed")
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Profile Header */}
        <Card className="mb-4 sm:mb-6 shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
              <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 border-background shadow-xl ring-4 ring-primary/10">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                  <AvatarFallback className="text-2xl sm:text-3xl md:text-4xl">{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="w-full sm:w-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{user.fullName}</h1>
                      <BadgeDisplay user={user} size="lg" />
                      <RoleBadge role={user.role} size="md" />
                      <TierBadge user={user} size="md" showPoints={isOwnProfile} />
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">@{user.username}</p>
                    {user.isPro && user.proExpiresAt && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Pro member until {formatDate(user.proExpiresAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto items-center">
                    {isOwnProfile ? (
                      <EditButton onClick={() => router.push(`/user/${user.username}/edit`)} className="w-full sm:w-auto">
                        Edit Profile
                      </EditButton>
                    ) : (
                      isAuthenticated && (
                        <>
                          {isInteractionBlocked ? (
                            <Badge
                              variant="secondary"
                              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 text-sm"
                            >
                              <Ban className="h-4 w-4" />
                              <span>Blocked</span>
                            </Badge>
                          ) : (
                            <>
                              {isFollowing ? (
                                <Button
                                  onClick={handleFollow}
                                  variant="outline"
                                  className="w-full sm:w-auto"
                                  disabled={blockActionPending}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Unfollow
                                </Button>
                              ) : canFollow ? (
                                <Button
                                  onClick={handleFollow}
                                  variant="default"
                                  className="w-full sm:w-auto"
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
                              <Button variant="outline" size="icon" className="h-10 w-10">
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

                {user.bio && <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{user.bio}</p>}

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

                {user.shelterSponsorship && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950 px-3 py-2 rounded-lg">
                    <Heart className="h-4 w-4" />
                    <span>Supporting animal shelters</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                  {stats.map((stat) => {
                    let linkHref = "#"
                    if (stat.label === "Pets") {
                      linkHref = `/user/${user.username}/pets`
                    } else if (stat.label === "Posts") {
                      linkHref = `/user/${user.username}/posts`
                    } else if (stat.label === "Followers") {
                      linkHref = `/user/${user.username}/followers`
                    } else if (stat.label === "Following") {
                      linkHref = `/user/${user.username}/following`
                    }

                    return (
                      <Link
                        key={stat.label}
                        href={linkHref}
                        onClick={(e) => {
                          if (linkHref.startsWith("#")) {
                            e.preventDefault()
                            // Scroll to the tab section
                            const tabs = document.querySelector('[role="tablist"]')
                            if (tabs) {
                              tabs.scrollIntoView({ behavior: "smooth", block: "start" })
                              // Switch to the appropriate tab
                              const tabButton = document.querySelector(
                                linkHref === "#pets"
                                  ? '[role="tab"][value="pets"]'
                                  : '[role="tab"][value="posts"]'
                              ) as HTMLButtonElement
                              if (tabButton) {
                                setTimeout(() => tabButton.click(), 100)
                              }
                            }
                          }
                        }}
                      >
                        <Card className="hover:bg-accent/50 transition-all duration-300 ease-in-out cursor-pointer group h-full border-transparent hover:border-input hover:shadow-md hover:scale-105">
                          <CardContent className="px-2 py-3 sm:px-3 sm:py-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className="flex items-center justify-center gap-1">
                                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-foreground transition-all duration-300 ease-in-out" />
                                <p className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-foreground transition-all duration-300 ease-in-out">
                                  {stat.value}
                                </p>
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-accent-foreground leading-tight transition-all duration-300 ease-in-out">{stat.label}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
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
                { value: "feed", label: "Feed Posts", icon: MessageCircle, color: "text-blue-500" },
                { value: "blog", label: "Blog Posts", icon: BookOpen, color: "text-purple-500" },
                { value: "pets", label: "Pets", icon: PawPrint, color: "text-orange-500" },
                { value: "about", label: "About", icon: UserIcon, color: "text-indigo-500" },
              ]}
              className="w-full"
              defaultGridCols={{ mobile: 2, tablet: 4, desktop: 4 }}
              showLabels={{ mobile: true, desktop: true }}
            >

              <TabsContent value="feed" className="space-y-4">
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
                  blogPosts.map((post) => {
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
                                      <p className="font-semibold text-sm sm:text-base truncate">{pet.name}</p>
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
