"use client"

import { useState, useEffect, use, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getBlogPosts, getPets, getUsers } from "@/lib/storage"
import Link from "next/link"
import { Tag, Heart } from "lucide-react"
import type { BlogPost, Pet, User } from "@/lib/types"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { canViewPost } from "@/lib/utils/privacy"
import { useAuth } from "@/lib/auth"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

const STORAGE_KEYS_TO_WATCH = ["pet_social_blog_posts", "pet_social_users", "pet_social_pets"]

export default function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = use(params)
  const { user: currentUser } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const decodedTag = decodeURIComponent(tag)

  const loadTaggedPosts = useCallback(() => {
    setLoading(true)

    const postsData = getBlogPosts()
    const petsData = getPets()
    const usersData = getUsers()
    const viewerId = currentUser?.id || null
    const targetTag = decodedTag.toLowerCase()

    const filtered = postsData.filter((post) => {
      const author = usersData.find((candidate) => candidate.id === post.authorId)
      if (!author) return false
      const matchesTag =
        post.tags.some((t) => t.toLowerCase() === targetTag) ||
        post.hashtags?.some((h) => h.toLowerCase() === targetTag)
      if (!matchesTag) return false
      return canViewPost(post, author, viewerId)
    })

    setPosts(filtered)
    setAllPets(petsData)
    setAllUsers(usersData)
    setLoading(false)
  }, [decodedTag, currentUser?.id])

  useEffect(() => {
    loadTaggedPosts()
  }, [loadTaggedPosts])

  useStorageListener(STORAGE_KEYS_TO_WATCH, loadTaggedPosts)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <LoadingSpinner fullScreen />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href="/blog" label="Back to Blog" />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-8 w-8" />
          <h1 className="text-3xl font-bold capitalize">{decodedTag}</h1>
        </div>
        <p className="text-muted-foreground">{posts.length} {posts.length === 1 ? "post" : "posts"} with this tag</p>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No posts found with this tag</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const pet = allPets.find((p) => p.id === post.petId)
            const author = allUsers.find((u) => u.id === post.authorId)
            const previewImage = post.coverImage || post.media?.images?.[0]
            return (
              <Link key={post.id} href={`/blog/${post.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col overflow-hidden p-0">
                  {previewImage && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={previewImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                        <AvatarFallback>{pet?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{pet?.name}</p>
                        <p className="text-xs text-muted-foreground">by {author?.fullName}</p>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-2 mb-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likes.length}
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-3">
                      {post.tags.slice(0, 3).map((postTag) => (
                        <Badge
                          key={postTag}
                          variant={postTag.toLowerCase() === decodedTag.toLowerCase() ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {postTag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
