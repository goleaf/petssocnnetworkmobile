"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUsers, getPets, getBlogPosts, deleteBlogPost } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Heart, ArrowLeft, Edit2, Trash2, FileText, Lock } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { canViewUserPosts, canViewPost } from "@/lib/utils/privacy"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

export default function PostsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    const foundUser = getUsers().find((u) => u.username === username)
    if (foundUser) {
      setUser(foundUser)
      const viewerId = currentUser?.id || null
      if (canViewUserPosts(foundUser, viewerId)) {
        const userPosts = getBlogPosts()
          .filter((p) => p.authorId === foundUser.id)
          .filter((p) => canViewPost(p, foundUser, viewerId))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setPosts(userPosts)
      } else {
        setPosts([])
      }
    }
  }, [username, currentUser])

  const handleDelete = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteBlogPost(postId)
      setPosts(posts.filter((p) => p.id !== postId))
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <p className="text-center text-muted-foreground">User not found</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === user.id
  const pets = getPets()
  const viewerId = currentUser?.id || null
  const canViewPosts = canViewUserPosts(user, viewerId)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Link href={`/profile/${username}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{user.fullName}'s Posts</h1>
        <p className="text-muted-foreground">{canViewPosts ? `${posts.length} ${posts.length === 1 ? "post" : "posts"}` : "Private"}</p>
      </div>

      {!canViewPosts ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">This user{"'"}s posts are private</p>
          </CardContent>
        </Card>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const pet = pets.find((p) => p.id === post.petId)
            const isOwner = isOwnProfile && currentUser?.id === post.authorId

            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden p-0">
                {post.coverImage && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={post.coverImage || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                        <AvatarFallback>{pet?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{pet?.name}</p>
                      </div>
                    </div>
                    {isOwner && (
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
                          <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <Link href={`/blog/${post.id}`} className="flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes.length}
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No posts yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

