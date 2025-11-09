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
  getBlogPosts,
  getPetById,
  getUserById,
  getUsers,
  getCommentsByPostId,
  areUsersBlocked,
  updateBlogPost,
  getPlaceById,
  getEventRSVPsByEventId,
  getUserEventRSVP,
  addEventRSVP,
  updateEventRSVP,
  generateStorageId,
  createConversation,
} from "@/lib/storage"
import { createNotification } from "@/lib/notifications"
import { cacheArticle, getCachedArticle, trackOfflineRead } from "@/lib/offline-cache"
import { useOfflineSync } from "@/lib/hooks/use-offline-sync"
import { useAuth } from "@/lib/auth"
import { Heart, MessageCircle, Share2, BarChart3, Link2, ExternalLink, ShieldAlert, Tag, BookOpen } from "lucide-react"
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
import { PostReportMenu } from "@/components/post-report-menu"
import { BadgeDisplay } from "@/components/badge-display"
import { PinButton } from "@/components/ui/pin-button"
import { AuthorBadge } from "@/components/blog/author-badge"
import { SeriesCard } from "@/components/blog/series-card"
import { PromoteToWikiButton } from "@/components/blog/promote-to-wiki"
import { extractPromoteableSections } from "@/lib/utils/blog"
import { getAllSeries } from "@/lib/storage-series"
import type { Series } from "@/components/blog/series-card"
import { findRelatedWikiArticles } from "@/lib/utils/related-wiki"
import { toast } from "sonner"

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()
  const { isOnline } = useOfflineSync()
  const [post, setPost] = useState(() => getBlogPostById(id))
  const [pet, setPet] = useState(() => (post ? getPetById(post.petId) : null))
  const [author, setAuthor] = useState(() => (post ? getUserById(post.authorId) : null))
  const [commentCount, setCommentCount] = useState(() => (post ? getCommentsByPostId(post.id).length : 0))
  const [hasLiked, setHasLiked] = useState(false)
  const [isWatchingPost, setIsWatchingPost] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [relatedWikiArticles, setRelatedWikiArticles] = useState<any[]>([])
  const isEvent = Boolean(post?.postType === 'event')
  const isListing = Boolean(post?.postType === 'listing')
  const listingSold = Boolean(post?.listingSoldAt)
  const listingArchived = Boolean(post?.listingArchivedAt)
  const [rsvpStatus, setRsvpStatus] = useState<('going'|'maybe'|'not-going'|null)>(() => {
    if (!post || !isEvent || !currentUser) return null
    const mine = getUserEventRSVP(post.id, currentUser.id)
    return (mine?.status as any) || null
  })
  const [rsvpCounts, setRsvpCounts] = useState<{going:number; maybe:number; notGoing:number}>(() => {
    if (!post || !isEvent) return { going: 0, maybe: 0, notGoing: 0 }
    const list = getEventRSVPsByEventId(post.id)
    return {
      going: list.filter(r => r.status === 'going').length,
      maybe: list.filter(r => r.status === 'maybe').length,
      notGoing: list.filter(r => r.status === 'not-going').length,
    }
  })
  const refreshRsvps = () => {
    if (!post || !isEvent) return
    const list = getEventRSVPsByEventId(post.id)
    setRsvpCounts({
      going: list.filter(r => r.status === 'going').length,
      maybe: list.filter(r => r.status === 'maybe').length,
      notGoing: list.filter(r => r.status === 'not-going').length,
    })
    if (currentUser) {
      const mine = getUserEventRSVP(post.id, currentUser.id)
      setRsvpStatus((mine?.status as any) || null)
    }
  }
  const setRSVP = (status: 'going'|'maybe'|'not-going') => {
    if (!post || !currentUser) return
    const existing = getUserEventRSVP(post.id, currentUser.id)
    const now = new Date().toISOString()
    if (existing) {
      updateEventRSVP(existing.eventId, existing.userId, { status, respondedAt: now })
    } else {
      addEventRSVP({ id: generateStorageId('event_rsvp'), eventId: post.id, userId: currentUser.id, status, respondedAt: now })
    }
    refreshRsvps()
  }
  const inviteMutuals = () => {
    if (!post || !currentUser) return
    const following = new Set(currentUser.following || [])
    const mutuals = (currentUser.followers || []).filter(uid => following.has(uid))
    for (const uid of mutuals) {
      createNotification({
        userId: uid,
        type: 'message',
        actorId: currentUser.id,
        targetId: post.id,
        targetType: 'post',
        message: `${currentUser.fullName} invited you to: ${post.title}`,
        category: 'reminders',
      })
    }
  }
  const canCheckIn = (() => {
    if (!post || !isEvent) return false
    const start = post.eventStartAt ? new Date(post.eventStartAt) : null
    const end = (start && post.eventDurationMinutes) ? new Date(start.getTime() + post.eventDurationMinutes * 60000) : null
    const now = new Date()
    if (!start) return false
    const windowStart = new Date(start.getTime() - 30*60000)
    const windowEnd = new Date((end ?? new Date(start.getTime() + 2*60*60000)).getTime() + 60*60000)
    return now >= windowStart && now <= windowEnd
  })()
  const hasCheckedIn = Boolean(post?.eventCheckedInUserIds?.includes(currentUser?.id || ''))
  const checkIn = () => {
    if (!post || !currentUser) return
    const ids = new Set(post.eventCheckedInUserIds || [])
    ids.add(currentUser.id)
    updateBlogPost({ ...post, eventCheckedInUserIds: Array.from(ids) })
    setPost(getBlogPostById(post.id))
  }
  const addAlbumPhotoUrl = () => {
    if (!post || !currentUser) return
    const url = window.prompt('Paste image URL to add to event album:')
    if (!url) return
    const list = Array.isArray(post.eventAlbumImages) ? [...post.eventAlbumImages] : []
    list.push(url)
    updateBlogPost({ ...post, eventAlbumImages: list })
    setPost(getBlogPostById(post.id))
  }
  const messageSeller = () => {
    if (!post || !currentUser) return
    try {
      const conv = createConversation([currentUser.id, post.authorId])
      window.alert('Conversation created. Check your Messages to continue.')
    } catch {}
  }
  const markAsSold = () => {
    if (!post || !currentUser || post.authorId !== currentUser.id) return
    updateBlogPost({ ...post, listingSoldAt: new Date().toISOString() })
    setPost(getBlogPostById(post.id))
  }

  useEffect(() => {
    async function loadPost() {
      // Try to load from cache first if offline
      let loadedPost = null
      
      if (!isOnline) {
        const cached = await getCachedArticle(id, "blog")
        if (cached && "petId" in cached) {
          loadedPost = cached
        }
      }
      
      // If not cached, load from storage
      if (!loadedPost) {
        loadedPost = getBlogPostById(id)
        
        // Cache the post for offline access
        if (loadedPost && isOnline) {
          await cacheArticle(loadedPost, "blog")
        }
      }
      
      if (loadedPost) {
        setPost(loadedPost)
        setPet(getPetById(loadedPost.petId))
        setAuthor(getUserById(loadedPost.authorId))
        setCommentCount(getCommentsByPostId(loadedPost.id).length)
        
        // Track offline read
        await trackOfflineRead(loadedPost.id, "blog")
      }
      setIsLoading(false)
    }
    
    loadPost()
  }, [id, isOnline])
  useEffect(() => {
    if (post && currentUser) {
      setHasLiked(post.likes.includes(currentUser.id))
      setIsWatchingPost(isWatching(currentUser.id, post.id, "post"))
      // Find related wiki articles
      const related = findRelatedWikiArticles(post.content, post.tags || [], post.categories || [])
      setRelatedWikiArticles(related)
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
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={getPetUrlFromPet(pet, author.username)} className="font-semibold hover:underline">
                  {pet.name}
                </Link>
                <BadgeDisplay user={author} size="sm" variant="icon" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <AuthorBadge author={author} showContact={true} size="sm" />
                <span className="text-sm text-muted-foreground">
                  • {formatDate(post.createdAt)}
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span className="text-xs italic ml-2">(edited)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
          {post.postType === 'question' && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Question</Badge>
              {post.questionCategory && (
                <Badge variant="secondary">{post.questionCategory}</Badge>
              )}
            </div>
          )}
          {post.postType === 'event' && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Event</Badge>
              {(() => {
                const start = post.eventStartAt ? new Date(post.eventStartAt) : null
                const when = start ? `${start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}${post.eventTimezone ? ` (${post.eventTimezone})` : ''}` : ''
                const placeName = post.placeId ? getPlaceById(post.placeId)?.name : undefined
                return (
                  <>
                    {when && <span>{when}</span>}
                    {placeName && (<span>• at {placeName}</span>)}
                  </>
                )
              })()}
            </div>
          )}
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
              <>
                <WatchButton targetId={post.id} targetType="post" initialWatching={isWatchingPost} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      const key = `pet_social_hidden_topics_${currentUser.id}`
                      const prev: string[] = JSON.parse(localStorage.getItem(key) || '[]')
                      const baseTopics = new Set<string>([
                        ...((post.hashtags || []) as string[]),
                        ...((post.tags || []) as string[]),
                      ].filter(Boolean).map((s) => String(s).toLowerCase()))
                      if (baseTopics.size === 0) {
                        const title = `${post.title || ''}`.toLowerCase()
                        title.split(/[^a-z0-9]+/g).filter((w) => w && w.length >= 4).slice(0, 3).forEach((w) => baseTopics.add(w))
                      }
                      const next = Array.from(new Set<string>([...prev, ...Array.from(baseTopics)]))
                      localStorage.setItem(key, JSON.stringify(next))
                      toast.message('You will see fewer similar posts')
                    } catch {}
                  }}
                >
                  Hide similar
                </Button>
                <PostReportMenu postId={post.id} postTitle={post.title} />
              </>
            )}
            <PinButton
              type="post"
              itemId={post.id}
              metadata={{
                title: post.title,
                description: post.content.substring(0, 200),
                image: post.coverImage || post.media?.images?.[0],
              }}
              variant="outline"
              size="sm"
            />
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
                {/* Promote section buttons - show for each promoteable section */}
                {(() => {
                  const sections = extractPromoteableSections(post.content || "")
                  return sections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {sections.slice(0, 3).map((section) => (
                        <PromoteToWikiButton
                          key={section.blockId}
                          postId={post.id}
                          blockId={section.blockId}
                          sectionContent={section.content}
                          onSuccess={() => {
                            // Refresh page or show success message
                            window.location.reload()
                          }}
                        />
                      ))}
                    </div>
                  ) : null
                })()}
              </>
            )}
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href={`/blog/${post.id}/talk`}>
                <MessageCircle className="h-4 w-4" />
                Talk
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-6">
          {post.postType === 'event' && (
            <div className="rounded-md border p-4 bg-accent/20">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {(() => {
                  const start = post.eventStartAt ? new Date(post.eventStartAt) : null
                  const end = (start && post.eventDurationMinutes) ? new Date(start.getTime() + post.eventDurationMinutes*60000) : null
                  return (
                    <>
                      {start && (<span>{start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}{post.eventTimezone ? ` (${post.eventTimezone})` : ''}</span>)}
                      {end && (<span>• Ends {end.toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>)}
                      {post.placeId && (<span>• at {getPlaceById(post.placeId)?.name}</span>)}
                    </>
                  )
                })()}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant={rsvpStatus === 'going' ? 'default' : 'outline'} onClick={() => setRSVP('going')}>Going ({rsvpCounts.going})</Button>
                <Button size="sm" variant={rsvpStatus === 'maybe' ? 'default' : 'outline'} onClick={() => setRSVP('maybe')}>Interested ({rsvpCounts.maybe})</Button>
                <Button size="sm" variant={rsvpStatus === 'not-going' ? 'default' : 'outline'} onClick={() => setRSVP('not-going')}>Can't Go ({rsvpCounts.notGoing})</Button>
                <Button size="sm" variant="ghost" onClick={inviteMutuals}>Invite Friends</Button>
                {currentUser && canCheckIn && !hasCheckedIn && (
                  <Button size="sm" onClick={checkIn}>Check In</Button>
                )}
              </div>
              <div className="mt-3 flex -space-x-2">
                {(() => {
                  const list = getEventRSVPsByEventId(post.id).filter(r => r.status === 'going').slice(0, 14)
                  return list.map((r) => {
                    const u = getUsers().find(x => x.id === r.userId)
                    return (
                      <Avatar key={r.userId} className="h-8 w-8 ring-2 ring-background">
                        <AvatarImage src={u?.avatar || '/placeholder.svg'} />
                        <AvatarFallback>{u?.fullName?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                    )
                  })
                })()}
              </div>
              {hasCheckedIn && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={addAlbumPhotoUrl}>Add Photo to Event Album</Button>
                </div>
              )}
            </div>
          )}
          {post.postType === 'listing' && (
            <div className={"rounded-md border p-4 " + (listingArchived ? 'opacity-60 ' : '') + (listingSold ? 'opacity-70 ' : '')}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline">Listing</Badge>
                {post.listingCategory && <Badge variant="secondary">{post.listingCategory}</Badge>}
                {typeof post.listingPrice === 'number' && (
                  <span className="font-medium">{post.listingCurrency || 'USD'} {post.listingPrice.toFixed(2)}</span>
                )}
                {post.listingCondition && (
                  <span className="text-xs text-muted-foreground">• {post.listingCondition}</span>
                )}
                {post.placeId && (
                  <span className="text-xs text-muted-foreground">• {getPlaceById(post.placeId)?.name}</span>
                )}
                {listingSold && <Badge variant="destructive">SOLD</Badge>}
                {listingArchived && <Badge variant="outline">Archived</Badge>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="text-xs text-muted-foreground">
                  {post.listingShipping?.localPickup ? 'Local pickup' : ''}{post.listingShipping?.localPickup && post.listingShipping?.shippingAvailable ? ' • ' : ''}{post.listingShipping?.shippingAvailable ? 'Shipping available' : ''}
                </div>
                {post.listingPaymentMethods && post.listingPaymentMethods.length > 0 && (
                  <div className="text-xs text-muted-foreground">• Accepts: {post.listingPaymentMethods.join(', ')}</div>
                )}
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" onClick={messageSeller}>Message Seller</Button>
                  {currentUser && currentUser.id === post.authorId && !listingSold && (
                    <Button size="sm" onClick={markAsSold}>Mark as Sold</Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="prose prose-lg max-w-none">
            <PostContent content={post.content} post={post} className="text-foreground leading-relaxed" />
          </div>

          {post.postType === 'event' && post.eventAlbumImages && post.eventAlbumImages.length > 0 && (
            <div className="not-prose">
              <h3 className="text-lg font-semibold mb-2">Event Album</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {post.eventAlbumImages.map((url, idx) => (
                  <div key={idx} className="aspect-square overflow-hidden rounded-md border bg-background">
                    <img src={url} alt={`Event photo ${idx+1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Series Card - Show if post is part of a series */}
      {post.seriesId && (() => {
        const allSeries = getAllSeries()
        const series = allSeries.find((s) => s.id === post.seriesId)
        if (!series) return null
        
        // Get all posts in the series
        const posts = getBlogPosts()
        const seriesPosts = series.posts
          .map((postId) => {
            const p = posts.find((post) => post.id === postId)
            return p
              ? {
                  postId: p.id,
                  title: p.title,
                  slug: p.slug || p.id,
                  order: p.seriesOrder || 0,
                  publishedAt: p.createdAt,
                  isPublished: !p.isDraft,
                }
              : null
          })
          .filter((p): p is NonNullable<typeof p> => p !== null)
        
        const seriesData: Series = {
          id: series.id,
          title: series.title,
          description: series.description,
          posts: seriesPosts,
          authorId: series.authorId,
          createdAt: series.createdAt,
          updatedAt: series.updatedAt,
        }
        
        return (
          <div className="mt-6">
            <SeriesCard series={seriesData} currentPostId={post.id} />
          </div>
        )
      })()}

      {/* Related Wiki Articles */}
      {relatedWikiArticles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Related Wiki Articles</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relatedWikiArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/wiki/${article.type}/${article.slug}`}
                  className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold mb-1">{article.title}</h3>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                    )}
                    {article.category && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {article.category}
                      </Badge>
                    )}
                  </div>
                  <ExternalLink className="mt-1 h-4 w-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments/Answers Section */}
      <Card className="mt-6 border-2">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{post.postType === 'question' ? 'Answers' : 'Comments'}</h2>
            <Badge variant="secondary" className="text-sm">
              {totalCommentsCount} {totalCommentsCount === 1 ? (post.postType === 'question' ? 'Answer' : 'Comment') : (post.postType === 'question' ? 'Answers' : 'Comments')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AdvancedComments
            context={{ type: "post", id: post.id }}
            header={null}
            emptyStateMessage="No comments yet. Be the first to comment!"
            onCountChange={setCommentCount}
            reactionsMode="simple"
            maxDepth={3}
          />
        </CardContent>
      </Card>
      <PostShareDialog post={post} open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} />
    </div>
  )
}
