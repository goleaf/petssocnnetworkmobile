"use client"

import { use, useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  getWikiArticleBySlug,
  getUserById,
  updateWikiArticle,
  getCommentsByWikiArticleId,
  getStableRevision,
  getLatestRevision,
  isStaleContent,
  rollbackToStableRevision,
  markRevisionAsStable,
  canPublishStableHealthRevision,
  getLatestRevision as getLatestRevisionForArticle,
} from "@/lib/storage"
import { cacheArticle, getCachedArticle, trackOfflineRead } from "@/lib/offline-cache"
import { useOfflineSync } from "@/lib/hooks/use-offline-sync"
import { useAuth } from "@/lib/auth"
import { generateJsonLd } from "@/lib/wiki-server"
import { canUserModerate } from "@/lib/utils/comments"
import {
  Eye,
  Heart,
  Calendar,
  MessageCircle,
  Edit2,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import { AdvancedComments } from "@/components/comments/advanced-comments"
import { MarkdownWithCitations } from "@/components/markdown-with-citations"
import { cn } from "@/lib/utils"
import type { WikiArticle } from "@/lib/types"
import { UrgencyBanner } from "@/components/wiki/urgency-banner"
import { WikiFooter } from "@/components/wiki/wiki-footer"
import { BrandAffiliationLabel } from "@/components/brand-affiliation-label"
import { getTranslatedContent, getBaseLanguage, isRTL } from "@/lib/utils/translations"
import { Languages } from "lucide-react"
import { PinButton } from "@/components/ui/pin-button"

export default function WikiArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const searchParams = useSearchParams()
  const { user: currentUser } = useAuth()
  const { isOnline } = useOfflineSync()
  const [article, setArticle] = useState<WikiArticle | null>(null)
  const [author, setAuthor] = useState<any | null>(null)
  const [hasLiked, setHasLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [highlightComments, setHighlightComments] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [viewingStable, setViewingStable] = useState(true)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [rollbackError, setRollbackError] = useState<string | null>(null)
  const [isPublishingStable, setIsPublishingStable] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  
  // Translation support
  const languageCode = searchParams.get("lang") || null
  const [translatedContent, setTranslatedContent] = useState<{
    title: string
    content: string
    isTranslated: boolean
    isRTL: boolean
  } | null>(null)

  useEffect(() => {
    async function loadArticle() {
      // Try to load from cache first if offline
      let loadedArticle: WikiArticle | null = null
      
      if (!isOnline) {
        // First get article by slug to get ID, then check cache
        const tempArticle = getWikiArticleBySlug(slug)
        if (tempArticle) {
          const cached = await getCachedArticle(tempArticle.id, "wiki")
          if (cached && "category" in cached) {
            loadedArticle = cached as WikiArticle
          }
        }
      }
      
      // If not cached, load from storage
      if (!loadedArticle) {
        loadedArticle = getWikiArticleBySlug(slug) || null
        
        // Cache the article for offline access
        if (loadedArticle && isOnline) {
          await cacheArticle(loadedArticle, "wiki")
        }
      }
      
      if (loadedArticle) {
        // For health pages, default to stable version
        const isHealthPage = loadedArticle.category === "health"
        if (isHealthPage && loadedArticle.stableRevisionId) {
          const stableRev = getStableRevision(loadedArticle.id)
          if (stableRev) {
            // Use stable revision content
            const articleWithStableContent = {
              ...loadedArticle,
              content: stableRev.content,
            }
            setArticle(articleWithStableContent)
            setViewingStable(true)
          } else {
            setArticle(loadedArticle)
            setViewingStable(false)
          }
        } else {
          setArticle(loadedArticle)
          setViewingStable(false)
        }
        // Load translated content if language is specified
        if (languageCode) {
          const translated = getTranslatedContent(loadedArticle, languageCode)
          setTranslatedContent(translated)
        } else {
          setTranslatedContent(null)
        }
        
        setAuthor(getUserById(loadedArticle.authorId))
        setCommentCount(getCommentsByWikiArticleId(loadedArticle.id).length)
        if (currentUser) {
          setHasLiked(loadedArticle.likes.includes(currentUser.id))
        }
        
        // Track offline read
        await trackOfflineRead(loadedArticle.id, "wiki")
      }
      setIsLoading(false)
    }
    
    loadArticle()
  }, [slug, currentUser, languageCode, isOnline])

  // Inject JSON-LD structured data
  useEffect(() => {
    if (!article) return

    // Generate JSON-LD
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pawsocial.com'
    const jsonLd = generateJsonLd(article, baseUrl)

    // Remove existing script if any
    const existingScript = document.querySelector('script[type="application/ld+json"][data-wiki-article]')
    if (existingScript) {
      existingScript.remove()
    }

    // Create and inject script tag
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-wiki-article', 'true')
    script.text = JSON.stringify(jsonLd).replace(/</g, '\u003c')
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      const scriptToRemove = document.querySelector('script[type="application/ld+json"][data-wiki-article]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [article])

  useEffect(() => {
    // Increment view count
    if (article) {
      const updatedArticle = { ...article, views: article.views + 1 }
      updateWikiArticle(updatedArticle)
      setArticle(updatedArticle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLike = async () => {
    if (!currentUser || !article || isLiking) return

    setIsLiking(true)

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 300))

    const updatedArticle = { ...article }

    if (hasLiked) {
      updatedArticle.likes = updatedArticle.likes.filter((id: string) => id !== currentUser.id)
    } else {
      updatedArticle.likes.push(currentUser.id)
    }

    updateWikiArticle(updatedArticle)
    setArticle(updatedArticle)
    setHasLiked(!hasLiked)
    setIsLiking(false)
  }

  const handleToggleVersion = () => {
    if (!article) return

    if (viewingStable) {
      // Switch to latest
      const latestRev = getLatestRevision(article.id)
      if (latestRev) {
        setArticle({ ...article, content: latestRev.content })
      }
      setViewingStable(false)
    } else {
      // Switch to stable
      const stableRev = getStableRevision(article.id)
      if (stableRev) {
        setArticle({ ...article, content: stableRev.content })
      }
      setViewingStable(true)
    }
  }

  const handleScrollToComments = () => {
    const commentsSection = document.getElementById("comments-section")
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: "smooth", block: "start" })
      setHighlightComments(true)
      setTimeout(() => setHighlightComments(false), 2000)
    }
  }

  const handleRollback = async () => {
    if (!article || !currentUser) return
    setIsRollingBack(true)
    setRollbackError(null)

    const result = rollbackToStableRevision(article.id, currentUser.id)
    
    if (result.success) {
      // Refresh article data
      const refreshedArticle = getWikiArticleBySlug(slug)
      if (refreshedArticle) {
        const stableRev = getStableRevision(refreshedArticle.id)
        if (stableRev) {
          setArticle({ ...refreshedArticle, content: stableRev.content })
          setViewingStable(true)
        } else {
          setArticle(refreshedArticle)
        }
      }
    } else {
      setRollbackError(result.error || "Failed to rollback")
    }
    
    setIsRollingBack(false)
  }

  const handlePublishStable = async () => {
    if (!article || !currentUser) return
    
    const latestRev = getLatestRevisionForArticle(article.id)
    if (!latestRev) {
      setPublishError("No revision to publish")
      return
    }

    setIsPublishingStable(true)
    setPublishError(null)

    const result = markRevisionAsStable(article.id, latestRev.id, currentUser.id)
    
    if (result.success) {
      // Refresh article data
      const refreshedArticle = getWikiArticleBySlug(slug)
      if (refreshedArticle) {
        const stableRev = getStableRevision(refreshedArticle.id)
        if (stableRev) {
          setArticle({ ...refreshedArticle, content: stableRev.content })
          setViewingStable(true)
        } else {
          setArticle(refreshedArticle)
        }
      }
    } else {
      setPublishError(result.error || "Failed to publish stable")
    }
    
    setIsPublishingStable(false)
  }

  const totalCommentsCount = commentCount

  // Check if content is stale
  const isStale = article?.approvedAt ? isStaleContent(article.approvedAt) : false
  const canModerate = canUserModerate(currentUser)
  const hasStableRevision = article?.stableRevisionId !== undefined
  const hasLatestRevision = getLatestRevision(article?.id || "") !== undefined
  const isHealthPage = article?.category === "health"
  const canPublishStable = currentUser && isHealthPage ? canPublishStableHealthRevision(currentUser.id) : false
  const latestRevision = article ? getLatestRevisionForArticle(article.id) : undefined
  const hasUnpublishedChanges = isHealthPage && latestRevision && latestRevision.status === "draft" && (!hasStableRevision || latestRevision.id !== article.stableRevisionId)


  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!article || !author) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Article not found</p>
      </div>
    )
  }

  // Generate JSON-LD for SEO (inject early)
  const jsonLdScript = article ? (() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pawsocial.com'
    const jsonLd = generateJsonLd(article, baseUrl)
    return JSON.stringify(jsonLd).replace(/</g, '\u003c')
  })() : null

  return (
    <>
      {/* JSON-LD Structured Data - Injected in head via useEffect, also here for immediate visibility */}
      {jsonLdScript && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript }}
        />
      )}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <BackButton href="/wiki" label="Back to Wiki" />

      {/* Stale content banner */}
      {isStale && (
        <Alert variant="default" className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            {isHealthPage ? "Stale Review Warning" : "Stale Content Warning"}
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {isHealthPage
              ? "This article was last approved more than 12 months ago. The information may be outdated. Please consult a veterinarian for current guidance."
              : "This article was last approved more than 12 months ago. The information may be outdated. Please verify with current sources."}
          </AlertDescription>
        </Alert>
      )}

      {/* Rollback error */}
      {rollbackError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Rollback Failed</AlertTitle>
          <AlertDescription>{rollbackError}</AlertDescription>
        </Alert>
      )}

      {/* Urgency Banner for Health Articles */}
      {isHealthPage && article.healthData?.urgency && (
        <UrgencyBanner urgency={article.healthData.urgency} />
      )}

      <Card className={article.coverImage ? "p-0 overflow-hidden" : ""}>
        {article.coverImage && (
          <div className="w-full overflow-hidden">
            <img
              src={article.coverImage || "/placeholder.svg"}
              alt={article.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        <CardHeader className={`space-y-5 ${article.coverImage ? "pt-8" : ""}`}>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {article.category}
            </Badge>
            {article.species?.map((species: string) => (
              <Badge key={species} variant="outline" className="capitalize">
                {species}
              </Badge>
            ))}
            <Badge variant="default" className="capitalize">
              Author
            </Badge>
          </div>
          <h1 
            className={cn(
              "text-4xl md:text-5xl font-bold leading-tight tracking-tight",
              translatedContent?.isRTL && "rtl"
            )}
            dir={translatedContent?.isRTL ? "rtl" : "ltr"}
          >
            {translatedContent?.title || article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
            <Link href={`/profile/${author.username}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.fullName} />
                <AvatarFallback>{author.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{author.fullName}</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(article.createdAt).toLocaleDateString("en-GB", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {article.views} views
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleLike}
                variant={hasLiked ? "default" : "outline"}
                size="sm"
                loading={isLiking}
                loadingText={hasLiked ? "Unliking..." : "Liking..."}
                className="gap-2"
              >
                {!isLiking && <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />}
                {article.likes.length} {article.likes.length === 1 ? "Like" : "Likes"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const commentsSection = document.getElementById("comments-section")
                  commentsSection?.scrollIntoView({ behavior: "smooth" })
                  setHighlightComments(true)
                  setTimeout(() => setHighlightComments(false), 2000)
                }} 
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
              </Button>
              <Link href={`/wiki/${slug}/translate${languageCode ? `?lang=${languageCode}` : ""}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Languages className="h-4 w-4" />
                  Translate
                </Button>
              </Link>
              {article && (
                <PinButton
                  type="wiki"
                  itemId={article.slug}
                  metadata={{
                    title: article.title,
                    description: article.content.substring(0, 200),
                    image: article.coverImage,
                  }}
                  variant="outline"
                  size="sm"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentUser && currentUser.id === article.authorId && (
                <Link href={`/wiki/${article.slug}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Article
                  </Button>
                </Link>
              )}
              {/* Publish Stable button for verified experts on health pages */}
              {isHealthPage && canPublishStable && hasUnpublishedChanges && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePublishStable}
                  disabled={isPublishingStable}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isPublishingStable ? "Publishing..." : "Publish Stable"}
                </Button>
              )}
              {/* Toggle between stable and latest for health pages */}
              {isHealthPage && hasStableRevision && hasLatestRevision && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleVersion}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  View {viewingStable ? "Latest" : "Stable"}
                </Button>
              )}
              {/* Rollback button for moderators */}
              {canModerate && hasStableRevision && !viewingStable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isRollingBack ? "Rolling back..." : "Rollback to Stable"}
                </Button>
              )}
            </div>
          </div>
          {/* Version indicator */}
          {isHealthPage && (
            <div className="pt-2">
              <Badge variant={viewingStable ? "default" : "secondary"}>
                {viewingStable ? "Stable (Approved)" : "Latest (Unapproved)"}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent 
          className={cn(
            "prose prose-lg prose-slate max-w-none dark:prose-invert",
            translatedContent?.isRTL && "rtl"
          )}
          dir={translatedContent?.isRTL ? "rtl" : "ltr"}
        >
          <div className="prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
            <MarkdownWithCitations content={translatedContent?.content || article.content} />
          </div>
        </CardContent>
      </Card>

      {/* Related Pages Footer */}
      {article && <WikiFooter article={article} maxRelated={5} />}

      {/* Comments Section */}
      <Card
        id="comments-section"
        className={cn(
          "mt-6 border-2 transition-shadow",
          highlightComments ? "ring-2 ring-primary/40 shadow-lg" : "",
        )}
      >
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Discussion</h2>
            <Badge variant="secondary" className="text-sm">
              {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AdvancedComments
            context={{ type: "wiki", id: article.id }}
            header={null}
            emptyStateMessage="No comments yet. Share your insights!"
            onCountChange={setCommentCount}
          />
        </CardContent>
      </Card>
      </div>
    </>
  )
}
