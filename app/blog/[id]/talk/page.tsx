"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  getBlogPostById,
  getPetById,
  getUserById,
  getEditorialDiscussionsByArticleId,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { EditorialDiscussions } from "@/components/editorial-discussion/editorial-discussions"

export default function TalkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()
  const [post, setPost] = useState(() => getBlogPostById(id))
  const [pet, setPet] = useState(() => (post ? getPetById(post.petId) : null))
  const [author, setAuthor] = useState(() => (post ? getUserById(post.authorId) : null))
  const [discussionCount, setDiscussionCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load data only on client side
    const loadedPost = getBlogPostById(id)
    if (loadedPost) {
      setPost(loadedPost)
      setPet(getPetById(loadedPost.petId))
      setAuthor(getUserById(loadedPost.authorId))
      const discussions = getEditorialDiscussionsByArticleId(loadedPost.id)
      setDiscussionCount(discussions.length)
    }
    setIsLoading(false)
  }, [id])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!post || !pet || !author) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Blog post not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <BackButton href={`/blog/${id}`} label="Back to Article" />
      </div>

      <Card className="mb-6">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>Editorial Discussion</span>
          </div>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={getPetUrlFromPet(pet, author.username)} className="hover:underline font-medium">
              {pet.name}
            </Link>
            {" · "}
            <Link href={`/user/${author.username}`} className="hover:underline">
              {author.fullName}
            </Link>
            {" · "}
            {formatDate(post.createdAt)}
          </p>
          <p className="text-sm text-muted-foreground pt-2 border-t">
            This is the editorial discussion page for this article. Use this space to discuss editorial decisions, improvements, corrections, or other administrative matters related to this content. This discussion is separate from the public comments section.
          </p>
        </CardHeader>
      </Card>

      <Card className="border-2">
        <CardContent className="p-6">
          <EditorialDiscussions
            articleId={post.id}
            onCountChange={setDiscussionCount}
            emptyStateMessage="No editorial discussions yet. Start a discussion about this article."
          />
        </CardContent>
      </Card>
    </div>
  )
}

