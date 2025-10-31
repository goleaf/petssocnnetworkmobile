"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getPets,
  getBlogPosts,
  getUsers,
  getPetsByOwnerId,
  addBlogPost,
  updateBlogPost,
  deleteBlogPost,
  togglePostReaction,
  toggleFollow,
} from "@/lib/storage"
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  UsersIcon,
  Lock,
  Edit2,
  Trash2,
  Smile,
  TrendingUp,
  PawPrint,
  BookOpen,
  Plus,
  Users,
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import type { BlogPost, Pet, User as UserType, ReactionType } from "@/lib/types"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { canViewPost } from "@/lib/utils/privacy"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function FeedPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [feedPosts, setFeedPosts] = useState<BlogPost[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<UserType[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedPet, setSelectedPet] = useState("")
  const [filter, setFilter] = useState<"all" | "following">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Load feed data if user is authenticated
    if (user) {
      setIsLoading(true)
      const pets = getPetsByOwnerId(user.id)
      setMyPets(pets)
      if (pets.length > 0 && !selectedPet) {
        setSelectedPet(pets[0].id)
      }
      loadFeed()
      loadTrending()
      loadSuggestedUsers()
      setIsLoading(false)
    }
  }, [user, isAuthenticated, router, filter])

  const loadFeed = () => {
    if (!user) return

    const allPosts = getBlogPosts()
    const allUsers = getUsers()

    if (filter === "following") {
      // Show only posts from followed users and pets that viewer can see
      const followedPosts = allPosts.filter((post) => {
        const author = allUsers.find((u) => u.id === post.authorId)
        if (!author) return false
        
        // Must be following the author or the pet
        const pet = getPets().find((p) => p.id === post.petId)
        const isFollowingUser = user.following.includes(post.authorId)
        const isFollowingPet = pet && pet.followers.includes(user.id)
        
        if (!isFollowingUser && !isFollowingPet) return false
        
        // Check if viewer can see this post based on privacy
        return canViewPost(post, author, user.id)
      })
      setFeedPosts(followedPosts)
    } else {
      // Show all posts that viewer can see based on privacy
      const visiblePosts = allPosts.filter((post) => {
        const author = allUsers.find((u) => u.id === post.authorId)
        if (!author) return false
        
        // Check if viewer can see this post based on privacy
        return canViewPost(post, author, user.id)
      })
      setFeedPosts(visiblePosts)
    }
  }

  const loadTrending = () => {
    if (!user) return
    
    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    
    // Filter posts that viewer can see based on privacy
    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((u) => u.id === post.authorId)
      if (!author) return false
      return canViewPost(post, author, user.id)
    })
    
    // Sort by engagement (reactions/likes)
    const trending = [...visiblePosts].sort((a, b) => {
      const aLikes = a.reactions
        ? Object.values(a.reactions).reduce((sum, arr) => sum + arr.length, 0)
        : a.likes.length
      const bLikes = b.reactions
        ? Object.values(b.reactions).reduce((sum, arr) => sum + arr.length, 0)
        : b.likes.length
      return bLikes - aLikes
    })
    setTrendingPosts(trending.slice(0, 3))
  }

  const loadSuggestedUsers = () => {
    if (!user) return
    const allUsers = getUsers()
    // Filter out blocked users and users who blocked the current user
    const suggested = allUsers
      .filter((u) => {
        if (u.id === user.id) return false
        if (user.following.includes(u.id)) return false
        // Check if blocked
        if (u.blockedUsers?.includes(user.id)) return false
        if (user.blockedUsers?.includes(u.id)) return false
        // Check if user is searchable
        if (u.privacy?.searchable === false) return false
        return true
      })
      .slice(0, 4)
    setSuggestedUsers(suggested)
  }

  const handleCreatePost = () => {
    if (!user || !newPostContent.trim() || !selectedPet) return

    const newPost: BlogPost = {
      id: String(Date.now()),
      petId: selectedPet,
      authorId: user.id,
      title: newPostContent.substring(0, 50) + (newPostContent.length > 50 ? "..." : ""),
      content: newPostContent,
      tags: [],
      likes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "public",
      hashtags: [],
    }

    addBlogPost(newPost)
    setNewPostContent("")
    loadFeed()
    loadTrending()
  }

  const handleDelete = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    deleteBlogPost(postId)
    loadFeed()
    loadTrending()
  }

  const handleEdit = (post: BlogPost) => {
    router.push(`/blog/${post.id}/edit`)
  }

  const handleReaction = (postId: string, reactionType: ReactionType) => {
    if (!user) return
    togglePostReaction(postId, user.id, reactionType)
    loadFeed()
    loadTrending()
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
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copied to clipboard!")
      }).catch(() => {
        // Fallback if clipboard API fails
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
    loadSuggestedUsers()
  }

  if (!user || isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const stats = [
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link href={`/user/${user.username}/following`}>
          <Card className="hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Following</p>
                  <p className="text-2xl font-bold">{stats[1].value}</p>
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
                  <p className="text-2xl font-bold">{stats[2].value}</p>
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
                  <p className="text-2xl font-bold">{stats[3].value}</p>
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
          {/* My Pets Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My Pets</CardTitle>
              <Link href={`/profile/${user.username}/add-pet`}>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pet
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myPets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPets.map((pet) => (
                    <Link key={pet.id} href={getPetUrlFromPet(pet, user.username)}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                          <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{pet.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{pet.breed || pet.species}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          {pet.followers.length}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You haven{"'"}t added any pets yet</p>
                  <Link href={`/profile/${user.username}/add-pet`}>
                    <Button className="mt-4">Add Your First Pet</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter and Create Post */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Feed</h2>
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                All Posts
              </Button>
              <Button
                variant={filter === "following" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("following")}
              >
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
                    <div className="flex items-center justify-between">
                      <Select value={selectedPet} onValueChange={setSelectedPet}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select pet" />
                        </SelectTrigger>
                        <SelectContent>
                          {myPets.map((pet) => (
                            <SelectItem key={pet.id} value={pet.id}>
                              {pet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
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
            </CardHeader>
            <CardContent>
              {trendingPosts.length > 0 ? (
                <div className="space-y-4">
                  {trendingPosts.map((post) => {
                    const pet = getPets().find((p) => p.id === post.petId)
                    return (
                      <Link key={post.id} href={`/blog/${post.id}`}>
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                          {post.coverImage && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={post.coverImage || "/placeholder.svg"}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
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

          {/* Suggested Users */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Users</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestedUsers.length > 0 ? (
                <div className="space-y-4">
                  {suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="flex items-center justify-between">
                      <Link href={`/profile/${suggestedUser.username}`} className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={suggestedUser.avatar || "/placeholder.svg"} alt={suggestedUser.fullName} />
                          <AvatarFallback>{suggestedUser.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{suggestedUser.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">@{suggestedUser.username}</p>
                        </div>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFollowSuggested(suggestedUser.id)}
                      >
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
  const pet = getPets().find((p) => p.id === post.petId)
  const author = getUsers().find((u) => u.id === post.authorId)
  const [showReactionsMenu, setShowReactionsMenu] = useState(false)
  const isOwner = post.authorId === currentUser.id

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

        {/* Post Content */}
        <div className="mb-3">
          <Link href={`/blog/${post.id}`}>
            <h3 className="font-semibold text-lg mb-2 hover:underline cursor-pointer">{post.title}</h3>
          </Link>
          <p className="text-muted-foreground line-clamp-3">{post.content}</p>
        </div>

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
              <Link key={tag} href={`/explore/hashtag/${encodeURIComponent(tag)}`}>
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
