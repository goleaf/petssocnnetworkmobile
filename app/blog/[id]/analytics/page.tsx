"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { BarChart3, ExternalLink } from "lucide-react"

import { useAuth } from "@/lib/auth"
import { getBlogPostById, getPetById, getUserById } from "@/lib/storage"
import type { BlogPost, Pet, User } from "@/lib/types"
import { BackButton } from "@/components/ui/back-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { PostAnalyticsDashboard } from "@/components/posts/PostAnalyticsDashboard"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"

export default function PostAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [pet, setPet] = useState<Pet | null>(null)
  const [author, setAuthor] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadedPost = getBlogPostById(id)
    if (loadedPost) {
      setPost(loadedPost)
      setPet(getPetById(loadedPost.petId) ?? null)
      setAuthor(getUserById(loadedPost.authorId) ?? null)
    }
    setIsLoading(false)
  }, [id])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!post || !author) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <BackButton href="/blog" label="Back to Blogs" />
        <Alert className="mt-6">
          <AlertDescription>This post could not be found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const canViewAnalytics =
    user &&
    (user.id === post.authorId || user.role === "admin" || user.role === "moderator")

  if (!canViewAnalytics) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <BackButton href={`/blog/${post.id}`} label="Back to Post" />
        <Alert className="mt-6">
          <AlertDescription>
            Only the post author or platform moderators can view analytics for this post.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
      <BackButton href={`/blog/${post.id}`} label="Back to Post" />

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Analytics Overview
            </div>
            <CardTitle className="mt-1 text-2xl font-bold">{post.title}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Posted on {formatDate(post.createdAt)}</span>
              <span>•</span>
              <Link href={`/user/${author.username}`} className="hover:underline">
                {author.fullName}
              </Link>
              {pet && (
                <>
                  <span>•</span>
                  <Link href={getPetUrlFromPet(pet, author.username)} className="hover:underline">
                    {pet.name}
                  </Link>
                </>
              )}
              {post.isPromoted && (
                <>
                  <span>•</span>
                  <Badge variant="secondary">Promoted</Badge>
                </>
              )}
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/blog/${post.id}`}>
              View Post
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pet && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>
                Linked pet:{" "}
                <Link href={getPetUrlFromPet(pet, author.username)} className="font-medium hover:underline">
                  {pet.name}
                </Link>
              </span>
              <span>•</span>
              <span>Tags: {post.tags.length > 0 ? post.tags.join(", ") : "None"}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <PostAnalyticsDashboard post={post} />
    </div>
  )
}
