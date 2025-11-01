"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getBlogPostById, getPetById, getUserById } from "@/lib/storage"
import { formatDate } from "@/lib/utils/date"

export default function PostEmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [post, setPost] = useState(() => getBlogPostById(id))
  const [pet, setPet] = useState(() => (post ? getPetById(post.petId) ?? null : null))
  const [author, setAuthor] = useState(() => (post ? getUserById(post.authorId) ?? null : null))

  useEffect(() => {
    const loadedPost = getBlogPostById(id)
    if (!loadedPost) {
      setPost(null)
      setPet(null)
      setAuthor(null)
      return
    }
    setPost(loadedPost)
    setPet(getPetById(loadedPost.petId) ?? null)
    setAuthor(getUserById(loadedPost.authorId) ?? null)
  }, [id])

  if (!post || !pet || !author) {
    return (
      <div className="p-4 bg-background text-center text-muted-foreground text-sm">
        Post not found.
      </div>
    )
  }

  return (
    <div className="p-4 bg-background text-foreground">
      <style>{`body { margin: 0; background: transparent; }`}</style>
      <Card className="max-w-md w-full mx-auto shadow-md border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
              <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{pet.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {author.fullName} · {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold leading-tight">{post.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-4">{post.content}</p>
          </div>
          {(post.tags?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <Link
            href={`/blog/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
          >
            Read more on Pet Social Network
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
