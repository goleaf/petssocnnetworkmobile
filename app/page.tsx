"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PrivacySelector } from "@/components/privacy-selector"
import { getBlogPosts, getPets, getUsers, getPetsByOwnerId, addBlogPost, deleteBlogPost, togglePostReaction, toggleFollow, getCommentsByPostId, getPlaces } from "@/lib/storage"
import { PawPrint, Heart, Users, BookOpen, TrendingUp, MessageCircle, Share2, MoreHorizontal, Globe, UsersIcon, Lock, Edit2, Trash2, Smile, Plus, Filter, Send, UserPlus, Rocket, ArrowRight, FileText, Video, Link2, ExternalLink, ShieldCheck, Pin } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils/date"
import type { BlogPost, BlogPostMedia, Pet, User as UserType, ReactionType, PrivacyLevel } from "@/lib/types"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { canViewPost } from "@/lib/utils/privacy"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MediaGallery } from "@/components/media-gallery"
import { getFriendSuggestions, type FriendSuggestion } from "@/lib/friend-suggestions"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"
import { PostContent } from "@/components/post/post-content"
import { PinnedItems } from "@/components/pinned-items"
import { PinButton } from "@/components/ui/pin-button"
import { rankPosts } from "@/lib/utils/post-ranking"
import type { Place } from "@/lib/types"

const STORAGE_KEYS_TO_WATCH = ["pet_social_blog_posts", "pet_social_users", "pet_social_pets"]

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [showRegister, setShowRegister] = useState(false)
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Array<{ label: string; value: number; icon: any }>>([
    { label: "Active Users", value: 0, icon: Users },
    { label: "Pets", value: 0, icon: PawPrint },
    { label: "Blog Posts", value: 0, icon: BookOpen },
  ])

  // Feed state
  const [feedPosts, setFeedPosts] = useState<BlogPost[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<FriendSuggestion[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostPrivacy, setNewPostPrivacy] = useState<PrivacyLevel>("public")
  const [selectedPet, setSelectedPet] = useState("")
  const [filter, setFilter] = useState<"all" | "following">("all")
  const [isFeedLoading, setIsFeedLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const refreshFeatured = useCallback(() => {
    const posts = getBlogPosts()
    const users = getUsers()
    const viewerId = user?.id || null

    const visiblePosts = posts.filter((post) => {
      const author = users.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      
      // Only show published or scheduled posts
      const status = post.queueStatus || (post.isDraft ? "draft" : "published")
      if (status !== "published" && status !== "scheduled") return false
      
      // Check if scheduled post should be visible (if scheduledAt is in the past or now)
      if (status === "scheduled" && post.scheduledAt) {
        const scheduledDate = new Date(post.scheduledAt)
        if (scheduledDate > new Date()) {
          return false // Don't show future scheduled posts
        }
      }
      
      return canViewPost(post, author, viewerId)
    })

    // Prioritize featured posts from queue, then sort by likes
    const featured = [...visiblePosts].sort((a, b) => {
      // First, prioritize featuredOnHomepage posts
      if (a.featuredOnHomepage && !b.featuredOnHomepage) return -1
      if (!a.featuredOnHomepage && b.featuredOnHomepage) return 1
      
      // Then sort by likes/reactions
      const aLikes = a.reactions
        ? Object.values(a.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : a.likes.length
      const bLikes = b.reactions
        ? Object.values(b.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : b.likes.length
      return bLikes - aLikes
    })

    setFeaturedPosts(featured.slice(0, 6))

    setStats([
      { label: "Active Users", value: users.length, icon: Users },
      { label: "Pets", value: getPets().length, icon: PawPrint },
      { label: "Blog Posts", value: posts.length, icon: BookOpen },
    ])

    setIsLoading(false)
  }, [user?.id])

  const loadFeed = useCallback(() => {
    if (!user) {
      setFeedPosts([])
      return
    }

    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    const allPets = getPets()

    if (filter === "following") {
      const followedPosts = allPosts.filter((post) => {
        const author = allUsers.find((candidate) => candidate.id === post.authorId)
        if (!author) return false

        const pet = allPets.find((p) => p.id === post.petId)
        const isFollowingUser = user.following?.includes(post.authorId) ?? false
        const isFollowingPet = pet?.followers?.includes(user.id) ?? false

        if (!isFollowingUser && !isFollowingPet) return false

        return canViewPost(post, author, user.id)
      })
      setFeedPosts(followedPosts)
      return
    }

    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      return canViewPost(post, author, user.id)
    })
    setFeedPosts(visiblePosts)
  }, [user, filter])

  const loadTrending = useCallback(() => {
    if (!user) {
      setTrendingPosts([])
      return
    }

    const allPosts = getBlogPosts()
    const allUsers = getUsers()

    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      return canViewPost(post, author, user.id)
    })

    const trending = [...visiblePosts].sort((a, b) => {
      const aLikes = a.reactions
        ? Object.values(a.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : a.likes.length
      const bLikes = b.reactions
        ? Object.values(b.reactions).reduce((sum, arr) => sum + (arr?.length || 0), 0)
        : b.likes.length
      return bLikes - aLikes
    })
    setTrendingPosts(trending.slice(0, 3))
  }, [user])

  const loadSuggestedUsers = useCallback(() => {
    if (!user) {
      setSuggestedUsers([])
      return
    }

    const suggestions = getFriendSuggestions(user, { limit: 4 })
    setSuggestedUsers(suggestions)
  }, [user])

  const refreshFeedData = useCallback(() => {
    loadFeed()
    loadTrending()
    loadSuggestedUsers()
  }, [loadFeed, loadTrending, loadSuggestedUsers])

  const refreshPersonalData = useCallback(() => {
    if (!isAuthenticated || !user) {
      setFeedPosts([])
      setTrendingPosts([])
      setSuggestedUsers([])
      setMyPets([])
      setIsFeedLoading(false)
      return
    }

    setIsFeedLoading(true)
    const pets = getPetsByOwnerId(user.id)
    setMyPets(pets)
    setSelectedPet((prev) => {
      if (prev && pets.some((pet) => pet.id === prev)) {
        return prev
      }
      return pets[0]?.id ?? ""
    })
    refreshFeedData()
    setIsFeedLoading(false)
  }, [isAuthenticated, user, refreshFeedData])

  useEffect(() => {
    refreshFeatured()
  }, [refreshFeatured])

  useEffect(() => {
    refreshPersonalData()
  }, [refreshPersonalData])

  // Get user location for proximity ranking
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator && isAuthenticated) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // User denied or error - continue without location (proximity will be 0)
          console.log("Location access denied or unavailable:", error.message)
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      )
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!user) {
      setNewPostPrivacy("public")
      return
    }

    setNewPostPrivacy(user.privacy?.posts || "public")
  }, [user?.id])

  const refreshAll = useCallback(() => {
    refreshFeatured()
    refreshPersonalData()
  }, [refreshFeatured, refreshPersonalData])

  useStorageListener(STORAGE_KEYS_TO_WATCH, refreshAll)

  const handleCreatePost = () => {
    if (!user || !newPostContent.trim() || !selectedPet) return

    const newPost: BlogPost = {
      id: String(Date.now()),
      petId: selectedPet,
      authorId: user.id,
      title: newPostContent.substring(0, 50) + (newPostContent.length > 50 ? "..." : ""),
      content: newPostContent,
      tags: [],
      categories: [],
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: newPostPrivacy,
      hashtags: [],
    }

    addBlogPost(newPost)
    setNewPostContent("")
    refreshFeedData()
  }

  const handleDelete = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    deleteBlogPost(postId)
    refreshFeedData()
  }

  const handleEdit = (post: BlogPost) => {
    router.push(`/blog/${post.id}/edit`)
  }

  const handleReaction = (postId: string, reactionType: ReactionType) => {
    if (!user) return
    togglePostReaction(postId, user.id, reactionType)
    refreshFeedData()
  }

  const handleShare = (post: BlogPost) => {
    const url = `${window.location.origin}/blog/${post.id}`
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content.substring(0, 100),
        url: url,
      }).catch((err) => {
        console.log("Error sharing:", err)
      })
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copied to clipboard!")
      }).catch(() => {
        const textArea = document.createElement("textarea")
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        alert("Link copied to clipboard!")
      })
    }
  }

  const handleFollowSuggested = (userId: string) => {
    if (!user) return
    toggleFollow(user.id, userId)
    setSuggestedUsers((prev) => prev.filter((suggestion) => suggestion.user.id !== userId))
    loadSuggestedUsers()
  }

  // Show loading spinner while checking auth and loading data
  if (isLoading || (isAuthenticated && isFeedLoading)) {
    return <LoadingSpinner fullScreen />
  }

  // If user is authenticated, show feed
  if (isAuthenticated && user) {
    const feedStats = [
      {
        title: "My Pets",
        value: myPets.length,
        icon: PawPrint,
        color: "text-blue-500",
      },
      {
        title: "Following",
        value: user.following.length,
        icon: Users,
        color: "text-green-500",
      },
      {
        title: "Followers",
        value: user.followers.length,
        icon: Heart,
        color: "text-red-500",
      },
      {
        title: "Total Posts",
        value: getBlogPosts().filter((p) => p.authorId === user.id).length,
        icon: BookOpen,
        color: "text-purple-500",
      },
    ]

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.fullName}!</h1>
          <p className="text-muted-foreground">Here{"'"}s what{"'"}s happening in your pet community</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Link href={`/profile/${user.username}/pets`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">My Pets</p>
                    <p className="text-2xl font-bold">{feedStats[0].value}</p>
                  </div>
                  <PawPrint className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/user/${user.username}/following`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Following</p>
                    <p className="text-2xl font-bold">{feedStats[1].value}</p>
                  </div>
                  <Users className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/user/${user.username}/followers`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Followers</p>
                    <p className="text-2xl font-bold">{feedStats[2].value}</p>
                  </div>
                  <Heart className="h-6 w-6 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/profile/${user.username}/posts`}>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Posts</p>
                    <p className="text-2xl font-bold">{feedStats[3].value}</p>
                  </div>
                  <BookOpen className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter and Create Post */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Feed</h2>
              <div className="flex gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                  <FileText className="h-4 w-4 mr-2" />
                  All Posts
                </Button>
                <Button
                  variant={filter === "following" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("following")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Following
                </Button>
              </div>
            </div>

            {/* Create Post Card */}
            {myPets.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="What's on your pet's mind?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                          <Select value={selectedPet} onValueChange={setSelectedPet}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                              <SelectValue placeholder="Select pet">
                                {selectedPet &&
                                  (() => {
                                    const selectedPetObj = myPets.find((p) => p.id === selectedPet)
                                    return selectedPetObj ? (
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 flex-shrink-0">
                                          <AvatarImage src={selectedPetObj.avatar || "/placeholder.svg"} alt={selectedPetObj.name} />
                                          <AvatarFallback className="text-xs">
                                            {selectedPetObj.name.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate">{selectedPetObj.name}</span>
                                      </div>
                                    ) : null
                                  })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {myPets.map((pet) => (
                                <SelectItem key={pet.id} value={pet.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                      <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                                      <AvatarFallback className="text-xs">{pet.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{pet.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <PrivacySelector
                            value={newPostPrivacy}
                            onChange={setNewPostPrivacy}
                            className="w-full sm:w-[180px] justify-between"
                          />
                        </div>
                        <Button onClick={handleCreatePost} disabled={!newPostContent.trim() || !selectedPet}>
                          <Send className="h-4 w-4 mr-2" />
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feed Posts */}
            <div className="space-y-4">
              {feedPosts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {filter === "following" ? "No posts from accounts you follow yet" : "No posts to show yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                feedPosts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    onReaction={handleReaction}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onShare={handleShare}
                    currentUser={user}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Posts
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Most popular posts from the community</p>
              </CardHeader>
              <CardContent>
                {trendingPosts.length > 0 ? (
                  <div className="space-y-4">
                    {trendingPosts.map((post) => {
                      const pet = getPets().find((p) => p.id === post.petId)
                      const previewImage = post.coverImage || post.media?.images?.[0]
                      const hasVideoPreview = !previewImage && (post.media?.videos?.length || 0) > 0
                      return (
                        <Link key={post.id} href={`/blog/${post.id}`}>
                          <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            {previewImage ? (
                              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                <img src={previewImage} alt={post.title} className="h-full w-full object-cover" />
                              </div>
                            ) : hasVideoPreview ? (
                              <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                <Video className="h-6 w-6 text-primary" />
                              </div>
                            ) : null}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold line-clamp-2 text-sm">{post.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">By {pet?.name}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 fill-current text-red-500" />
                                  {post.reactions
                                    ? Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0)
                                    : post.likes.length}
                                </div>
                                <div className="flex gap-1">
                                  {post.tags.slice(0, 2).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No trending posts yet</p>
                )}
              </CardContent>
            </Card>

            {/* Pinned Items */}
            <PinnedItems />

            {/* Suggested Users */}
            <Card>
              <CardHeader>
                <CardTitle>Suggested Users</CardTitle>
              </CardHeader>
              <CardContent>
                {suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map((suggestion) => (
                      <div key={suggestion.user.id} className="flex items-center justify-between">
                        <Link href={`/profile/${suggestion.user.username}`} className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={suggestion.user.avatar || "/placeholder.svg"} alt={suggestion.user.fullName} />
                            <AvatarFallback>{suggestion.user.fullName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{suggestion.user.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">@{suggestion.user.username}</p>
                            {suggestion.reasons.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {suggestion.reasons.slice(0, 2).map((reason) => (
                                  <Badge key={`${suggestion.user.id}-${reason}`} variant="secondary" className="text-xs font-normal">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollowSuggested(suggestion.user.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No suggestions available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/blog">
                  <Button variant="ghost" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse All Blogs
                  </Button>
                </Link>
                <Link href="/wiki">
                  <Button variant="ghost" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Pet Care Wiki
                  </Button>
                </Link>
                <Link href={`/profile/${user.username}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    My Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If user is not logged in, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-5 sm:space-y-6 md:space-y-7 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs sm:text-sm font-semibold shadow-sm border border-primary/20 animate-in fade-in slide-in-from-top-4 duration-700">
              <PawPrint className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">The Social Network for Pet Lovers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight sm:leading-tight md:leading-tight text-balance bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent animate-in fade-in slide-in-from-left-4 duration-1000">
              Connect, Share, and Learn About Your Pets
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground text-pretty leading-relaxed animate-in fade-in slide-in-from-left-4 duration-1000 delay-200">
              Join a vibrant community of pet owners. Share your pet{"'"}s adventures, discover care tips, and connect
              with fellow animal lovers.
            </p>
            <div className="flex flex-wrap gap-4 sm:gap-5 md:gap-6 pt-4 animate-in fade-in slide-in-from-left-4 duration-1000 delay-300">
              {stats.map((stat, index) => (
                <Card key={stat.label} className="flex-1 min-w-[140px] sm:min-w-[160px] border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 sm:gap-3.5">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-lg sm:text-xl md:text-2xl text-foreground">{stat.value}+</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 order-1 lg:order-2 animate-in fade-in slide-in-from-right-4 duration-1000">
            {showRegister ? (
              <RegisterForm
                onSuccess={() => {}}
                onSwitchToLogin={() => setShowRegister(false)}
              />
            ) : (
              <LoginForm onSuccess={() => {}} onSwitchToRegister={() => setShowRegister(true)} />
            )}
            
            {/* Demo Credentials Section */}
            <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm font-semibold text-foreground">Demo Credentials</p>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground pl-6">
                  <p className="break-words">
                    <strong className="text-foreground font-semibold">Username:</strong>{" "}
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">sarahpaws</span>,{" "}
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">mikecatlover</span>,{" "}
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">emmabirds</span>,{" "}
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">alexrabbits</span>
                  </p>
                  <p>
                    <strong className="text-foreground font-semibold">Password:</strong>{" "}
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">password123</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 md:py-20 bg-gradient-to-b from-transparent via-muted/20 to-transparent">
        <div className="text-center mb-10 sm:mb-12 md:mb-16 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4">
            <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Platform Features</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything You Need for Your Pet Community
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto">
            Discover features designed for pet lovers
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 max-w-7xl mx-auto">
          <Card className="h-full group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-5 sm:p-6 md:p-7 space-y-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <PawPrint className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-2xl font-bold">Pet Profiles</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Create detailed profiles for each of your pets. Share their photos, stories, and milestones with the
                community.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-5 sm:p-6 md:p-7 space-y-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-2xl font-bold">Pet Care Wiki</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Access comprehensive guides on pet care, health, training, and nutrition. Learn from experts and
                experienced pet owners.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full sm:col-span-2 lg:col-span-1 group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-5 sm:p-6 md:p-7 space-y-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-pink-500" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-2xl font-bold">Social Features</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Follow other pet owners, like and comment on posts, and build connections with people who share your
                love for animals.
              </p>
            </CardContent>
          </Card>
          <Card className="h-full sm:col-span-2 lg:col-span-1 group hover:shadow-xl hover:border-primary/30 transition-all duration-300 border-2 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-5 sm:p-6 md:p-7 space-y-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-2xl font-bold">Message Privacy</h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Keep sensitive conversations secure with automatic end-to-end encryption for direct messages and shared
                attachments.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Trending Now</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2 flex-wrap">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 flex-shrink-0 text-primary" />
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Trending Stories</span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">Popular posts from our community</p>
            </div>
            <Link href="/blog" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="w-full sm:w-auto border-2 hover:border-primary/50 hover:shadow-md transition-all duration-300">
                <ArrowRight className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
            {featuredPosts.map((post) => {
              const pet = getPets().find((p) => p.id === post.petId)
              const featureImage = post.coverImage || post.media?.images?.[0]
              return (
                <Card key={post.id} className="overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 p-0 h-full flex flex-col group border-2 bg-gradient-to-br from-card to-card/80">
                  {featureImage && (
                    <div className="aspect-video w-full overflow-hidden flex-shrink-0 relative">
                      <img src={featureImage} alt={post.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  )}
                  <CardContent className="p-5 sm:p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-lg sm:text-xl md:text-xl line-clamp-2 mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-medium">By {pet?.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 mb-4 flex-1 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm flex-wrap pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-red-500 text-red-500" />
                        <span className="font-semibold">{post.likes.length}</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {post.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <Card className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-transparent opacity-50"></div>
          <CardContent className="p-6 sm:p-8 md:p-10 lg:p-12 text-center space-y-4 sm:space-y-5 md:space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs sm:text-sm font-medium mb-2">
              <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Start Your Journey</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Ready to Join the Community?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-95 max-w-2xl mx-auto leading-relaxed">
              Create your account today and start sharing your pet{"'"}s amazing journey
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => setShowRegister(true)} 
              className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function FeedPostCard({
  post,
  onReaction,
  onDelete,
  onEdit,
  onShare,
  currentUser,
}: {
  post: BlogPost
  onReaction: (postId: string, reactionType: ReactionType) => void
  onDelete: (postId: string) => void
  onEdit: (post: BlogPost) => void
  onShare: (post: BlogPost) => void
  currentUser: UserType
}) {
  const media = (post.media ?? { images: [], videos: [], links: [] }) as BlogPostMedia
  const pet = getPets().find((p) => p.id === post.petId)
  const author = getUsers().find((u) => u.id === post.authorId)
  const [showReactionsMenu, setShowReactionsMenu] = useState(false)
  const isOwner = post.authorId === currentUser.id

  const previewLinks = media.links.slice(0, 2)

  const formatHost = (url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, "")
    } catch (error) {
      return url
    }
  }

  const reactionEmojis: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    laugh: "😄",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }

  const getUserReaction = (): ReactionType | null => {
    if (!post.reactions) return null
    for (const [type, userIds] of Object.entries(post.reactions)) {
      if (userIds.includes(currentUser.id)) {
        return type as ReactionType
      }
    }
    return null
  }

  const getTotalReactions = (): number => {
    if (!post.reactions) return 0
    return Object.values(post.reactions).reduce((sum, arr) => sum + arr.length, 0)
  }

  const userReaction = getUserReaction()
  const totalReactions = getTotalReactions()

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case "private":
        return <Lock className="h-3 w-3" />
      case "followers-only":
        return <UsersIcon className="h-3 w-3" />
      default:
        return <Globe className="h-3 w-3" />
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-3">
            <Link href={author ? getPetUrlFromPet(pet, author.username) : "#"}>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={pet?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={author ? getPetUrlFromPet(pet, author.username) : "#"} className="font-semibold hover:underline">
                  {pet?.name}
                </Link>
                <span className="text-muted-foreground text-sm">•</span>
                <Link href={`/user/${author?.username}`} className="text-sm text-muted-foreground hover:underline">
                  {author?.fullName}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(post.createdAt)}</span>
                <span>•</span>
                {getPrivacyIcon()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PinButton
              type="post"
              itemId={post.id}
              metadata={{
                title: post.title,
                description: post.content.substring(0, 200),
                image: post.coverImage || post.media?.images?.[0],
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/blog/${post.id}`}>
                  <DropdownMenuItem>View full post</DropdownMenuItem>
                </Link>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(post)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-3">
          <Link href={`/blog/${post.id}`}>
            <h3 className="font-semibold text-lg mb-2 hover:underline cursor-pointer">{post.title}</h3>
          </Link>
          <div className="text-muted-foreground line-clamp-3">
            <PostContent content={post.content} post={post} />
          </div>
        </div>

        {(media.images.length > 0 || media.videos.length > 0 || media.links.length > 0) && (
          <div className="mb-3 space-y-3">
            {(media.images.length > 0 || media.videos.length > 0) && (
              <MediaGallery media={media} mode="compact" />
            )}

            {media.links.length > 0 && (
              <div className="space-y-2">
                {previewLinks.map((link, index) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border px-3 py-2 text-xs sm:text-sm hover:bg-accent transition-colors"
                  >
                    <Link2 className="h-4 w-4 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{link.title || formatHost(link.url)}</p>
                      <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{link.url}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                ))}
                {media.links.length > previewLinks.length && (
                  <span className="text-xs text-muted-foreground">+{media.links.length - previewLinks.length} more links</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Post Tags/Hashtags */}
        {(post.tags.length > 0 || (post.hashtags && post.hashtags.length > 0)) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}>
                <Badge
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
            {post.hashtags?.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(`#${tag}`)}&tab=blogs`}>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Post Actions */}
        <div className="flex items-center gap-1 pt-3 border-t">
          <div className="flex items-center gap-1">
            <DropdownMenu open={showReactionsMenu} onOpenChange={setShowReactionsMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 ${userReaction ? "bg-primary/10 text-primary" : ""}`}
                >
                  <Smile className="h-4 w-4 mr-2" />
                  {totalReactions > 0 ? (
                    <span className="font-medium">{totalReactions}</span>
                  ) : (
                    <span className="text-muted-foreground">React</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {Object.entries(reactionEmojis).map(([type, emoji]) => {
                  const reactionType = type as ReactionType
                  const isActive = userReaction === reactionType
                  const count = post.reactions?.[reactionType]?.length || 0
                  return (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => {
                        onReaction(post.id, reactionType)
                        setShowReactionsMenu(false)
                      }}
                      className={`cursor-pointer ${isActive ? "bg-primary/10 font-medium" : ""}`}
                    >
                      <span className="mr-2 text-lg">{emoji}</span>
                      <span className="capitalize flex-1">{type}</span>
                      {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {userReaction && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => onReaction(post.id, userReaction)}
              >
                <span className="text-base mr-1">{reactionEmojis[userReaction]}</span>
                <span className="font-medium">{post.reactions?.[userReaction]?.length || 0}</span>
              </Button>
            )}
          </div>
          <Link href={`/blog/${post.id}`}>
            <Button variant="ghost" size="sm" className="h-9">
              <MessageCircle className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="h-9" onClick={() => onShare(post)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
