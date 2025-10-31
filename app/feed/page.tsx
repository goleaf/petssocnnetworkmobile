"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPets, getBlogPosts, getUsers, getPetsByOwnerId, addBlogPost, updateBlogPost, deleteBlogPost, togglePostReaction } from "@/lib/storage"
import { Heart, MessageCircle, Share2, MoreHorizontal, Globe, UsersIcon, Lock, Edit2, Trash2, Smile } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { BlogPost, Pet, User as UserType, ReactionType } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function FeedPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [feedPosts, setFeedPosts] = useState<BlogPost[]>([])
  const [myPets, setMyPets] = useState<Pet[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedPet, setSelectedPet] = useState("")
  const [filter, setFilter] = useState<"all" | "following">("all")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (user) {
      const pets = getPetsByOwnerId(user.id)
      setMyPets(pets)
      if (pets.length > 0 && !selectedPet) {
        setSelectedPet(pets[0].id)
      }
      loadFeed()
    }
  }, [user, isAuthenticated, router, filter])

  const loadFeed = () => {
    if (!user) return

    const allPosts = getBlogPosts()

    if (filter === "following") {
      // Show only posts from followed users and pets
      const followedPosts = allPosts.filter((post) => {
        const pet = getPets().find((p) => p.id === post.petId)
        return pet && (user.following.includes(post.authorId) || pet.followers.includes(user.id))
      })
      setFeedPosts(followedPosts)
    } else {
      // Show all public posts
      setFeedPosts(allPosts.filter((post) => post.privacy === "public" || !post.privacy))
    }
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
  }

  const handleDelete = (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    deleteBlogPost(postId)
    loadFeed()
  }

  const handleEdit = (post: BlogPost) => {
    router.push(`/blog/${post.id}/edit`)
  }

  const handleReaction = (postId: string, reactionType: ReactionType) => {
    if (!user) return
    togglePostReaction(postId, user.id, reactionType)
    loadFeed()
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

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Activity Feed</h1>
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
            <Link href={`/pet/${pet?.id}`}>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={pet?.avatar || "/placeholder.svg"} />
                <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/pet/${pet?.id}`} className="font-semibold hover:underline">
                  {pet?.name}
                </Link>
                <span className="text-muted-foreground text-sm">•</span>
                <Link href={`/user/${author?.username}`} className="text-sm text-muted-foreground hover:underline">
                  {author?.fullName}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
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
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.hashtags?.slice(0, 3).map((tag) => (
              <Link key={tag} href={`/explore/hashtag/${tag}`}>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
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
