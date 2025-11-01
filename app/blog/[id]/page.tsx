"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditButton } from "@/components/ui/edit-button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getBlogPostById,
  getPetById,
  getUserById,
  getCommentsByPostId,
  areUsersBlocked,
  updateBlogPost,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Heart, MessageCircle, Share2, BarChart3, Link2, ExternalLink, ShieldAlert, Tag } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import { PostShareDialog } from "@/components/post-share-dialog"
import { AdvancedComments } from "@/components/comments/advanced-comments"
import { BrandAffiliationLabel } from "@/components/brand-affiliation-label"
import { canViewPost } from "@/lib/utils/privacy"
import { MediaGallery } from "@/components/media-gallery"
import type { BlogPostMedia } from "@/lib/types"
import { formatCategoryLabel, slugifyCategory } from "@/lib/utils/categories"
import { PostContent } from "@/components/post/post-content"
import { WatchButton } from "@/components/watch-button"
import { isWatching } from "@/lib/storage"

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()
  const [post, setPost] = useState(() => getBlogPostById(id))
  const [pet, setPet] = useState(() => (post ? getPetById(post.petId) : null))
  const [author, setAuthor] = useState(() => (post ? getUserById(post.authorId) : null))
  const [commentCount, setCommentCount] = useState(() => (post ? getCommentsByPostId(post.id).length : 0))
  const [hasLiked, setHasLiked] = useState(false)
  const [isWatchingPost, setIsWatchingPost] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    // Load data only on client side
    const loadedPost = getBlogPostById(id)
    if (loadedPost) {
      setPost(loadedPost)
      setPet(getPetById(loadedPost.petId))
      setAuthor(getUserById(loadedPost.authorId))
      setCommentCount(getCommentsByPostId(loadedPost.id).length)
    }
    setIsLoading(false)
  }, [id])
  useEffect(() => {
    if (post && currentUser) {
      setHasLiked(post.likes.includes(currentUser.id))
      setIsWatchingPost(isWatching(currentUser.id, post.id, "post"))
    }
  }, [post, currentUser])

  useEffect(() => {
    if (!post || !author) {
      setAccessDenied(false)
      return
    }
    const viewerId = currentUser?.id ?? null
    const canView = canViewPost(post, author, viewerId)
    setAccessDenied(!canView)
  }, [post, author, currentUser])

  const handleLike = () => {
    if (!currentUser || !post || !author) return
    if (isInteractionBlocked) {
      window.alert(interactionBlockedMessage)
      return
    }

    const updatedPost = { ...post }

    if (hasLiked) {
      updatedPost.likes = updatedPost.likes.filter((id) => id !== currentUser.id)
    } else {
      updatedPost.likes.push(currentUser.id)
    }

    updateBlogPost(updatedPost)
    setPost(updatedPost)
    setHasLiked(!hasLiked)
  }

  const totalCommentsCount = commentCount
  const isInteractionBlocked = Boolean(currentUser && author && areUsersBlocked(currentUser.id, author.id))
  const interactionBlockedMessage = isInteractionBlocked
    ? currentUser?.blockedUsers?.includes(author?.id ?? "")
      ? `You have blocked ${author?.fullName ?? "this author"}. Unblock them to interact.`
      : `${author?.fullName ?? "This author"} has blocked you. Interactions are disabled.`
    : ""

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

  if (accessDenied) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
            <h2 className="text-xl font-semibold">You can&apos;t view this post</h2>
            <p className="text-sm text-muted-foreground">
              Access to this content is restricted due to privacy or blocking settings.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const media = post.media ?? { images: [], videos: [], links: [] }
  const heroImage = post.coverImage || media.images[0]
  const galleryImages = post.coverImage ? media.images : media.images.slice(heroImage ? 1 : 0)
  const galleryMedia: BlogPostMedia = {
    images: galleryImages,
    videos: media.videos,
    links: media.links,
  }

  const formatHost = (url: string): string => {
    try {
      return new URL(url).hostname.replace(/^www\./, "")
    } catch (error) {
      return url
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <BackButton href="/blog" label="Back to Blogs" />
        <Button variant="outline" size="sm" onClick={() => setIsShareDialogOpen(true)}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {heroImage && (
          <div className="aspect-video w-full overflow-hidden">
            <img src={heroImage} alt={post.title} className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader className="space-y-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <Link href={getPetUrlFromPet(pet, author.username)}>
              <Avatar className="h-12 w-12 cursor-pointer">
                <AvatarImage src={pet.avatar || "/placeholder.svg"} alt={pet.name} />
                <AvatarFallback>{pet.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href={getPetUrlFromPet(pet, author.username)} className="font-semibold hover:underline">
                {pet.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                by{" "}
                <Link href={`/user/${author.username}`} className="hover:underline">
                  {author.fullName}
                </Link>{" "}
                • {formatDate(post.createdAt)}
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <span className="text-xs italic ml-2">(edited)</span>
                )}
              </p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
          <div className="flex flex-wrap gap-2">
            {post.categories?.length
              ? post.categories.map((category) => {
                  const slug = slugifyCategory(category)
                  return (
                    <Badge
                      key={`category-${slug}`}
                      variant="outline"
                      className="flex items-center gap-1 cursor-default"
                    >
                      <Tag className="h-3 w-3" />
                      {formatCategoryLabel(category)}
                    </Badge>
                  )
                })
              : null}
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag}
                </Badge>
              </Link>
            ))}
            {post.hashtags && post.hashtags.length > 0 && (
              <>
                {post.hashtags.map((hashtag) => (
                  <Link key={hashtag} href={`/search?q=${encodeURIComponent(`#${hashtag}`)}&tab=blogs`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      #{hashtag}
                    </Badge>
                  </Link>
                ))}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {post.brandAffiliation && (
              <BrandAffiliationLabel brandAffiliation={post.brandAffiliation} />
            )}
            <Button
              onClick={handleLike}
              variant={hasLiked ? "default" : "outline"}
              size="sm"
              disabled={!currentUser || isInteractionBlocked}
            >
              <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
              {post.likes.length} {post.likes.length === 1 ? "Like" : "Likes"}
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
            </Button>
            {currentUser && currentUser.id !== post.authorId && (
              <WatchButton targetId={post.id} targetType="post" initialWatching={isWatchingPost} />
            )}
            {currentUser && currentUser.id === post.authorId && (
              <>
                <Link href={`/blog/${post.id}/edit`}>
                  <EditButton asChild size="sm">
                    Edit
                  </EditButton>
                </Link>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/blog/${post.id}/analytics`}>
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-6">
          <div className="prose prose-lg max-w-none">
            <PostContent content={post.content} post={post} className="text-foreground leading-relaxed whitespace-pre-wrap" />
          </div>

          {(galleryMedia.images.length > 0 || galleryMedia.videos.length > 0) && (
            <div className="not-prose">
              <MediaGallery media={galleryMedia} caption="Rich media attachments" />
            </div>
          )}

          {media.links.length > 0 && (
            <div className="not-prose space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Link2 className="h-5 w-5 text-primary" />
                Helpful Resources
              </h3>
              <div className="space-y-2">
                {media.links.map((link, index) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                      <Link2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{link.title || formatHost(link.url)}</p>
                      <p className="truncate text-sm text-muted-foreground">{link.url}</p>
                    </div>
                    <ExternalLink className="mt-1 h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="mt-6 border-2">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Comments</h2>
            <Badge variant="secondary" className="text-sm">
              {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AdvancedComments
            context={{ type: "post", id: post.id }}
            header={null}
            emptyStateMessage="No comments yet. Be the first to comment!"
            onCountChange={setCommentCount}
          />
        </CardContent>
      </Card>
      <PostShareDialog post={post} open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} />
    </div>
  )
}
