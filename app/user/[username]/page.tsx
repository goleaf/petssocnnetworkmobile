"use client"

import { useEffect, useState } from "react"
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
import { getUserByUsername, getUserById, getPetsByOwnerId, getBlogPosts, getFeedPosts, getFeedPostsByAuthorId, toggleFollow, updateFeedPost, deleteFeedPost, updateBlogPost, deleteBlogPost } from "@/lib/storage"
import type { User, FeedPost, BlogPost } from "@/lib/types"
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
  User as UserIcon,
  MessageCircle,
  MoreHorizontal,
  Edit2,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { BadgeDisplay } from "@/components/badge-display"
import { RoleBadge } from "@/components/role-badge"
import { SidebarUserList } from "@/components/sidebar-user-list"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { formatDate } from "@/lib/utils/date"
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

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, isAuthenticated } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [pets, setPets] = useState<any[]>([])
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState("feed")
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editPostContent, setEditPostContent] = useState("")
  const [editingBlogPostId, setEditingBlogPostId] = useState<string | null>(null)

  useEffect(() => {
    const username = params.username as string
    const fetchedUser = getUserByUsername(username)

    if (!fetchedUser) {
      router.push("/")
      return
    }

    const viewerId = currentUser?.id || null

    // Check if viewer can see profile
    if (!canViewProfile(fetchedUser, viewerId)) {
      router.push("/")
      return
    }

    setUser(fetchedUser)

    // Filter pets and posts based on privacy
    if (canViewUserPets(fetchedUser, viewerId)) {
      setPets(getPetsByOwnerId(fetchedUser.id))
    } else {
      setPets([])
    }

    if (canViewUserPosts(fetchedUser, viewerId)) {
      // Get feed posts
      const allFeedPosts = getFeedPostsByAuthorId(fetchedUser.id).filter((post) => {
        if (!post.privacy || post.privacy === "public") return true
        if (post.privacy === "private" && post.authorId !== viewerId) return false
        if (post.privacy === "followers-only" && viewerId && !getUserById(viewerId || "")?.following.includes(post.authorId)) return false
        return true
      })
      setFeedPosts(allFeedPosts)

      // Get blog posts
      const allBlogPosts = getBlogPosts()
        .filter((post) => post.authorId === fetchedUser.id)
        .filter((post) => canViewPost(post, fetchedUser, viewerId))
      setBlogPosts(allBlogPosts)
    } else {
      setFeedPosts([])
      setBlogPosts([])
    }

    if (currentUser) {
      setIsFollowing(currentUser.following.includes(fetchedUser.id))
    }
  }, [params.username, currentUser, router])

  const handleFollow = () => {
    if (!currentUser || !user) return
    toggleFollow(currentUser.id, user.id)
    setIsFollowing(!isFollowing)
    // Refresh user data
    const updatedUser = getUserByUsername(user.username)
    if (updatedUser) setUser(updatedUser)
  }

  const handleEditPost = (post: FeedPost) => {
    setEditingPostId(post.id)
    setEditPostContent(post.content)
  }

  const handleSavePost = (postId: string) => {
    if (!currentUser) return
    const post = feedPosts.find((p) => p.id === postId)
    if (!post) return

    const updatedPost: FeedPost = {
      ...post,
      content: editPostContent.trim(),
      updatedAt: new Date().toISOString(),
    }

    try {
      updateFeedPost(updatedPost, currentUser.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update post")
      return
    }

    // Refresh posts
    const username = params.username as string
    const fetchedUser = getUserByUsername(username)
    if (fetchedUser) {
      const viewerId = currentUser?.id || null
      const allFeedPosts = getFeedPostsByAuthorId(fetchedUser.id).filter((post) => {
        if (!post.privacy || post.privacy === "public") return true
        if (post.privacy === "private" && post.authorId !== viewerId) return false
        if (post.privacy === "followers-only" && viewerId && !getUserById(viewerId || "")?.following.includes(post.authorId)) return false
        return true
      })
      setFeedPosts(allFeedPosts)
    }

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
      deleteFeedPost(postId, currentUser.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete post")
      return
    }

    // Refresh posts
    const username = params.username as string
    const fetchedUser = getUserByUsername(username)
    if (fetchedUser) {
      const viewerId = currentUser?.id || null
      const allFeedPosts = getFeedPostsByAuthorId(fetchedUser.id).filter((post) => {
        if (!post.privacy || post.privacy === "public") return true
        if (post.privacy === "private" && post.authorId !== viewerId) return false
        if (post.privacy === "followers-only" && viewerId && !getUserById(viewerId || "")?.following.includes(post.authorId)) return false
        return true
      })
      setFeedPosts(allFeedPosts)
    }
  }

  const handleDeleteBlogPost = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return

    deleteBlogPost(postId)

    // Refresh blog posts by filtering out the deleted one
    setBlogPosts(blogPosts.filter((p) => p.id !== postId))
  }

  if (!user) return null

  const isOwnProfile = currentUser?.id === user.id
  const viewerId = currentUser?.id || null
  const canViewPets = canViewUserPets(user, viewerId)
  const canViewPosts = canViewUserPosts(user, viewerId)
  const canViewFollowersList = canViewFollowers(user, viewerId)
  const canViewFollowingList = canViewFollowing(user, viewerId)
  const canFollow = canSendFollowRequest(user, viewerId)

  const stats = [
    { label: "Pets", value: canViewPets ? pets.length : 0, icon: PawPrint, canView: canViewPets },
    { label: "Feed Posts", value: canViewPosts ? feedPosts.length : 0, icon: MessageCircle, canView: canViewPosts },
    { label: "Blog Posts", value: canViewPosts ? blogPosts.length : 0, icon: BookOpen, canView: canViewPosts },
    { label: "Followers", value: canViewFollowersList ? user.followers.length : 0, icon: Users, canView: canViewFollowersList },
    { label: "Following", value: canViewFollowingList ? user.following.length : 0, icon: Heart, canView: canViewFollowingList },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.fullName} />
                  <AvatarFallback className="text-4xl">{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-3xl font-bold">{user.fullName}</h1>
                      <BadgeDisplay user={user} size="lg" />
                      <RoleBadge role={user.role} size="md" />
                    </div>
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.isPro && user.proExpiresAt && (
                      <p className="text-xs text-amber-600 mt-1">
                        Pro member until {formatDate(user.proExpiresAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isOwnProfile ? (
                      <EditButton onClick={() => router.push(`/user/${user.username}/edit`)}>
                        Edit Profile
                      </EditButton>
                    ) : (
                      isAuthenticated && (
                        <>
                          {isFollowing ? (
                            <Button onClick={handleFollow} variant="outline">
                              <UserMinus className="h-4 w-4 mr-2" />
                              Unfollow
                            </Button>
                          ) : canFollow ? (
                            <Button onClick={handleFollow} variant="default">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </Button>
                          ) : null}
                        </>
                      )
                    )}
                  </div>
                </div>

                {user.bio && <p className="text-muted-foreground">{user.bio}</p>}

                {user.shelterSponsorship && (
                  <div className="flex items-center gap-2 text-sm text-pink-600 bg-pink-50 dark:bg-pink-950 px-3 py-2 rounded-lg">
                    <Heart className="h-4 w-4" />
                    <span>Supporting animal shelters</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
                        <Card className="hover:bg-accent/50 transition-all duration-300 ease-in-out cursor-pointer group h-full border-transparent hover:border-input hover:shadow-sm">
                          <CardContent className="px-1 py-0.5 text-center">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              <div className="flex items-center justify-center gap-1">
                                <stat.icon className="h-4 w-4 text-primary group-hover:text-foreground transition-all duration-300 ease-in-out" />
                                <p className="text-base font-bold text-foreground group-hover:text-foreground transition-all duration-300 ease-in-out">
                                  {stat.value}
                                </p>
                              </div>
                              <p className="text-xs font-medium text-muted-foreground group-hover:text-accent-foreground leading-tight transition-all duration-300 ease-in-out">{stat.label}</p>
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
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                      <p>This user{"'"}s feed posts are private</p>
                    </CardContent>
                  </Card>
                ) : feedPosts.length > 0 ? (
                  feedPosts.map((post) => {
                    const pet = pets.find((p) => p.id === post.petId)
                    const isOwnPost = isOwnProfile && post.authorId === currentUser?.id
                    const isEditingThisPost = editingPostId === post.id
                    return (
                      <Card key={post.id}>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {pet && (
                                  <>
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{pet.name}</p>
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                              <p className="text-foreground whitespace-pre-wrap break-words">{post.content}</p>
                            )}
                            {post.images && post.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2">
                                {post.images.map((image, index) => (
                                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                    <img src={image} alt={`Post image ${index + 1}`} className="w-full h-full object-cover" />
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
                      <p>This user{"'"}s blog posts are private</p>
                    </CardContent>
                  </Card>
                ) : blogPosts.length > 0 ? (
                  blogPosts.map((post) => {
                    const pet = pets.find((p) => p.id === post.petId)
                    const isOwnPost = isOwnProfile && post.authorId === currentUser?.id
                    return (
                      <Card key={post.id}>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                {pet && (
                                  <>
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                      <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold">{pet.name}</p>
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
                                <h3 className="text-xl font-bold">{post.title}</h3>
                                <p className="text-muted-foreground line-clamp-3">{post.content}</p>
                                {post.coverImage && (
                                  <img
                                    src={post.coverImage || "/placeholder.svg"}
                                    alt={post.title}
                                    className="w-full h-64 object-cover rounded-lg"
                                  />
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
                      <p>This user{"'"}s pets are private</p>
                    </CardContent>
                  </Card>
                ) : pets.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {pets.map((pet) => (
                      <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg">{pet.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {pet.breed || pet.species}
                                  {pet.age && ` • ${pet.age} years old`}
                                </p>
                                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                  <Heart className="h-3 w-3" />
                                  {pet.followers.length} followers
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
                <Card>
                  <CardContent className="p-6 space-y-4">
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
                  </CardContent>
                </Card>
              </TabsContent>
            </CategoryTabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {canViewFollowersList && (
              <SidebarUserList
                title="Followers"
                icon={Users}
                userIds={user.followers}
                username={user.username}
                type="followers"
                emptyMessage="No followers yet"
                viewAllMessage={`View all ${user.followers.length} followers`}
              />
            )}
            {canViewFollowingList && (
              <SidebarUserList
                title="Following"
                icon={Heart}
                userIds={user.following}
                username={user.username}
                type="following"
                emptyMessage="Not following anyone yet"
                viewAllMessage={`View all ${user.following.length} following`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
