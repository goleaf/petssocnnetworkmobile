"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreateButton } from "@/components/ui/create-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFeedPosts, getBlogPosts, getPets, getUsers, getPetsByOwnerId, addFeedPost, deleteFeedPost, toggleFeedPostReaction, deleteBlogPost, togglePostReaction, toggleFollow } from "@/lib/storage"
import { PawPrint, Heart, Users, BookOpen, TrendingUp, MessageCircle, Share2, MoreHorizontal, Globe, UsersIcon, Lock, Edit2, Trash2, Smile, Plus, Filter, Send, UserPlus, Rocket, ArrowRight, FileText } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils/date"
import type { FeedPost, BlogPost, Pet, User as UserType, ReactionType } from "@/lib/types"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { canViewPost } from "@/lib/utils/privacy"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<UserType[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedPet, setSelectedPet] = useState("")
  const [filter, setFilter] = useState<"all" | "following">("all")
  const [isFeedLoading, setIsFeedLoading] = useState(true)

  useEffect(() => {
    // Get featured posts (most liked)
    const posts = getBlogPosts()
    const featured = [...posts].sort((a, b) => b.likes.length - a.likes.length).slice(0, 6)
    setFeaturedPosts(featured)

    // Calculate stats only on client
    setStats([
      { label: "Active Users", value: getUsers().length, icon: Users },
      { label: "Pets", value: getPets().length, icon: PawPrint },
      { label: "Blog Posts", value: getBlogPosts().length, icon: BookOpen },
    ])
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Load feed data if user is authenticated
    if (isAuthenticated && user) {
      setIsFeedLoading(true)
      const pets = getPetsByOwnerId(user.id)
      setMyPets(pets)
      if (pets.length > 0 && !selectedPet) {
        setSelectedPet(pets[0].id)
      }
      loadFeed()
      loadTrending()
      loadSuggestedUsers()
      setIsFeedLoading(false)
    }
  }, [user, isAuthenticated, filter])

  const loadFeed = () => {
    if (!user) return

    const allPosts = getFeedPosts()
    const allUsers = getUsers()

    if (filter === "following") {
      const followedPosts = allPosts.filter((post) => {
        const author = allUsers.find((u) => u.id === post.authorId)
        if (!author) return false
        
        const pet = getPets().find((p) => p.id === post.petId)
        const isFollowingUser = user.following.includes(post.authorId)
        const isFollowingPet = pet && pet.followers.includes(user.id)
        
        if (!isFollowingUser && !isFollowingPet) return false
        
        if (!post.privacy || post.privacy === "public") return true
        if (post.privacy === "private" && post.authorId !== user.id) return false
        if (post.privacy === "followers-only" && !user.following.includes(post.authorId)) return false
        return true
      })
      setFeedPosts(followedPosts)
    } else {
      const visiblePosts = allPosts.filter((post) => {
        const author = allUsers.find((u) => u.id === post.authorId)
        if (!author) return false
        return canViewPost(post, author, user.id)
      })
      setFeedPosts(visiblePosts)
    }
  }

  const loadTrending = () => {
    if (!user) return
    
    const allPosts = getBlogPosts()
    const allUsers = getUsers()
    
    const visiblePosts = allPosts.filter((post) => {
      const author = allUsers.find((u) => u.id === post.authorId)
      if (!author) return false
      return canViewPost(post, author, user.id)
    })
    
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
    const suggested = allUsers
      .filter((u) => {
        if (u.id === user.id) return false
        if (user.following.includes(u.id)) return false
        if (u.blockedUsers?.includes(user.id)) return false
        if (user.blockedUsers?.includes(u.id)) return false
        if (u.privacy?.searchable === false) return false
        return true
      })
      .slice(0, 4)
    setSuggestedUsers(suggested)
  }

  const handleCreatePost = () => {
    if (!user || !newPostContent.trim() || !selectedPet) return

    // Extract hashtags from content
    const hashtagMatches = newPostContent.match(/#\w+/g) || []
    const hashtags = hashtagMatches.map((tag) => tag.substring(1))

    const newPost: FeedPost = {
      id: String(Date.now()),
      petId: selectedPet,
      authorId: user.id,
      content: newPostContent,
      images: [],
      likes: [],
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      privacy: "public",
      hashtags: hashtags.length > 0 ? hashtags : undefined,
    }

    addFeedPost(newPost)
    setNewPostContent("")
    loadFeed()
    loadTrending()
  }

  const handleDelete = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    // Check if it's a feed post or blog post
    const feedPost = getFeedPosts().find((p) => p.id === postId)
    if (feedPost) {
      deleteFeedPost(postId)
    } else {
      deleteBlogPost(postId)
    }
    loadFeed()
    loadTrending()
  }

  const handleEdit = (post: FeedPost) => {
    // Feed posts don't have a dedicated edit page, can edit inline if needed
    // For now, we'll just show an alert that feed posts are simpler
    alert("Feed posts are quick updates. To create longer posts, use the Blog section.")
  }

  const handleReaction = (postId: string, reactionType: ReactionType) => {
    if (!user) return
    // Check if it's a feed post or blog post
    const feedPost = getFeedPosts().find((p) => p.id === postId)
    if (feedPost) {
      toggleFeedPostReaction(postId, user.id, reactionType)
    } else {
      togglePostReaction(postId, user.id, reactionType)
    }
    loadFeed()
    loadTrending()
  }

  const handleShare = (post: FeedPost) => {
    const url = `${window.location.origin}/feed/${post.id}`
    const pet = getPets().find((p) => p.id === post.petId)
    if (navigator.share) {
      navigator.share({
        title: pet ? `${pet.name}'s Post` : "Feed Post",
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
        title: "Feed Posts",
        value: getFeedPosts().filter((p) => p.authorId === user.id).length,
        icon: MessageCircle,
        color: "text-blue-500",
      },
      {
        title: "Blog Posts",
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
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
          <Link href={`/user/${user.username}`} onClick={(e) => {
            e.preventDefault()
            router.push(`/user/${user.username}`)
            setTimeout(() => {
              const tabs = document.querySelector('[role="tablist"]')
              if (tabs) {
                tabs.scrollIntoView({ behavior: "smooth", block: "start" })
                const tabButton = document.querySelector('[role="tab"][value="feed"]') as HTMLButtonElement
                if (tabButton) {
                  setTimeout(() => tabButton.click(), 100)
                }
              }
            }, 100)
          }}>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Feed Posts</p>
                    <p className="text-2xl font-bold">{feedStats[3].value}</p>
                  </div>
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/user/${user.username}`} onClick={(e) => {
            e.preventDefault()
            router.push(`/user/${user.username}`)
            setTimeout(() => {
              const tabs = document.querySelector('[role="tablist"]')
              if (tabs) {
                tabs.scrollIntoView({ behavior: "smooth", block: "start" })
                const tabButton = document.querySelector('[role="tab"][value="blog"]') as HTMLButtonElement
                if (tabButton) {
                  setTimeout(() => tabButton.click(), 100)
                }
              }
            }, 100)
          }}>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Blog Posts</p>
                    <p className="text-2xl font-bold">{feedStats[4].value}</p>
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
                      <div className="flex items-center justify-between">
                        <Select value={selectedPet} onValueChange={setSelectedPet}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select pet">
                              {selectedPet && (() => {
                                const selectedPetObj = myPets.find((p) => p.id === selectedPet)
                                return selectedPetObj ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5 flex-shrink-0">
                                      <AvatarImage src={selectedPetObj.avatar || "/placeholder.svg"} alt={selectedPetObj.name} />
                                      <AvatarFallback className="text-xs">{selectedPetObj.name.charAt(0)}</AvatarFallback>
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
                        <CreateButton onClick={handleCreatePost} disabled={!newPostContent.trim()} iconType="send">
                          Post
                        </CreateButton>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <PawPrint className="h-4 w-4" />
              <span>The Social Network for Pet Lovers</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance">
              Connect, Share, and Learn About Your Pets
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Join a vibrant community of pet owners. Share your pet{"'"}s adventures, discover care tips, and connect
              with fellow animal lovers.
            </p>
            <div className="flex flex-wrap gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-bold text-lg">{stat.value}+</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="flex flex-col gap-6">
            {showRegister ? (
              <RegisterForm
                onSuccess={() => {}}
                onSwitchToLogin={() => setShowRegister(false)}
              />
            ) : (
              <LoginForm onSuccess={() => {}} onSwitchToRegister={() => setShowRegister(true)} />
            )}
            
            {/* Demo Credentials Section */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2 text-muted-foreground">Demo Credentials</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p><strong className="text-foreground">Username:</strong> sarahpaws, mikecatlover, emmabirds, alexrabbits</p>
                  <p><strong className="text-foreground">Password:</strong> password123</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need for Your Pet Community</h2>
          <p className="text-muted-foreground text-lg">Discover features designed for pet lovers</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Pet Profiles</h3>
              <p className="text-muted-foreground">
                Create detailed profiles for each of your pets. Share their photos, stories, and milestones with the
                community.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Pet Care Wiki</h3>
              <p className="text-muted-foreground">
                Access comprehensive guides on pet care, health, training, and nutrition. Learn from experts and
                experienced pet owners.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Social Features</h3>
              <p className="text-muted-foreground">
                Follow other pet owners, like and comment on posts, and build connections with people who share your
                love for animals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                Trending Stories
              </h2>
              <p className="text-muted-foreground">Popular posts from our community</p>
            </div>
            <Link href="/blog">
              <Button variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => {
              const pet = getPets().find((p) => p.id === post.petId)
              return (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow p-0">
                  {post.coverImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={post.coverImage || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-1">By {pet?.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        {post.likes.length}
                      </div>
                      <div className="flex gap-1">
                        {post.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
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
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Join the Community?</h2>
            <p className="text-lg opacity-90">
              Create your account today and start sharing your pet{"'"}s amazing journey
            </p>
            <Button size="lg" variant="secondary" onClick={() => setShowRegister(true)}>
              <Rocket className="h-4 w-4 mr-2" />
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
  post: FeedPost
  onReaction: (postId: string, reactionType: ReactionType) => void
  onDelete: (postId: string) => void
  onEdit: (post: FeedPost) => void
  onShare: (post: FeedPost) => void
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
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(post.id)} variant="destructive">
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
          <p className="text-foreground whitespace-pre-wrap break-words">{post.content}</p>
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {post.images.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img src={image} alt={`Post image ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.hashtags.slice(0, 5).map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(`#${tag}`)}&tab=feed`}>
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
