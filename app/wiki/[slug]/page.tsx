"use client"

import { use, useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  getWikiArticleBySlug,
  getUserById,
  updateWikiArticle,
  getCommentsByWikiArticleId,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentReaction,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { replaceEmoticons } from "@/lib/utils/emoticon-replacer"
import {
  Eye,
  Heart,
  Calendar,
  ArrowLeft,
  Send,
  Reply,
  Edit2,
  Trash2,
  X,
  Check,
  Smile,
  ThumbsUp,
  MessageCircle,
  Loader2,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import type { Comment, ReactionType } from "@/lib/types"
import { formatCommentDate } from "@/lib/utils/date"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function WikiArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user: currentUser } = useAuth()
  const [article, setArticle] = useState<any | null>(null)
  const [author, setAuthor] = useState<any | null>(null)
  const [hasLiked, setHasLiked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [highlightComments, setHighlightComments] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isPostingComment, setIsPostingComment] = useState(false)
  const [isReplying, setIsReplying] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    // Load data only on client side
    const loadedArticle = getWikiArticleBySlug(slug)
    if (loadedArticle) {
      setArticle(loadedArticle)
      setAuthor(getUserById(loadedArticle.authorId))
      setComments(getCommentsByWikiArticleId(loadedArticle.id))
      if (currentUser) {
        setHasLiked(loadedArticle.likes.includes(currentUser.id))
      }
    }
    setIsLoading(false)
  }, [slug, currentUser])

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

  const handleAddComment = async () => {
    if (!currentUser || !article || !newComment.trim() || isPostingComment) return

    setIsPostingComment(true)

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Replace emoticons in comment
    const processedContent = replaceEmoticons(newComment.trim())

    const comment: Comment = {
      id: String(Date.now()),
      wikiArticleId: article.id,
      userId: currentUser.id,
      content: processedContent,
      createdAt: new Date().toISOString(),
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
    }

    addComment(comment)
    const updatedComments = getCommentsByWikiArticleId(article.id)
    setComments(updatedComments)
    setNewComment("")
    setIsPostingComment(false)
  }

  const handleReply = async (parentCommentId: string) => {
    if (!currentUser || !article || !replyContent.trim() || isReplying) return

    setIsReplying(parentCommentId)

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Replace emoticons in reply
    const processedContent = replaceEmoticons(replyContent.trim())

    const reply: Comment = {
      id: String(Date.now()),
      wikiArticleId: article.id,
      userId: currentUser.id,
      content: processedContent,
      createdAt: new Date().toISOString(),
      parentCommentId,
      reactions: {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: [],
      },
    }

    addComment(reply)
    const updatedComments = getCommentsByWikiArticleId(article.id)
    setComments(updatedComments)
    setReplyContent("")
    setReplyingTo(null)
    setIsReplying(null)
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim() || isSavingEdit) return

    setIsSavingEdit(commentId)

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Replace emoticons in edited comment
    const processedContent = replaceEmoticons(editContent.trim())
    updateComment(commentId, processedContent)
    const updatedComments = getCommentsByWikiArticleId(article.id)
    setComments(updatedComments)
    setEditingCommentId(null)
    setEditContent("")
    setIsSavingEdit(null)
  }

  const handleDelete = async (commentId: string) => {
    if (isDeleting) return
    
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsDeleting(commentId)
      
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      deleteComment(commentId)
      const updatedComments = getCommentsByWikiArticleId(article.id)
      setComments(updatedComments)
      setIsDeleting(null)
    }
  }

  const handleReaction = (commentId: string, reactionType: ReactionType) => {
    if (!currentUser) return
    toggleCommentReaction(commentId, currentUser.id, reactionType)
    const updatedComments = getCommentsByWikiArticleId(article.id)
    setComments(updatedComments)
  }

  const getUserReaction = (comment: Comment): ReactionType | null => {
    if (!currentUser || !comment.reactions) return null
    for (const [type, userIds] of Object.entries(comment.reactions)) {
      if (userIds.includes(currentUser.id)) {
        return type as ReactionType
      }
    }
    return null
  }

  const getTotalReactions = (comment: Comment): number => {
    if (!comment.reactions) return 0
    return Object.values(comment.reactions).reduce((sum, arr) => sum + arr.length, 0)
  }

  // Organize comments into parent and replies
  const topLevelComments = comments.filter((c) => !c.parentCommentId)
  const getReplies = (commentId: string) => {
    return comments.filter((c) => c.parentCommentId === commentId)
  }

  const totalCommentsCount = comments.length

  const handleScrollToComments = () => {
    const commentsSection = document.getElementById("comments-section")
    if (commentsSection) {
      // Calculate offset to account for any sticky headers (adjust if needed)
      const offset = 80
      const elementPosition = commentsSection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      // Trigger highlight effect immediately for visual feedback
      setHighlightComments(true)

      // Enhanced smooth scroll with easing
      const scrollStartPosition = window.pageYOffset
      const scrollDistance = offsetPosition - scrollStartPosition
      const scrollDuration = 800 // milliseconds
      let animationStartTime: number | null = null

      const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      }

      const animateScroll = (currentTime: number) => {
        if (animationStartTime === null) animationStartTime = currentTime
        const timeElapsed = currentTime - animationStartTime
        const progress = Math.min(timeElapsed / scrollDuration, 1)

        window.scrollTo(0, scrollStartPosition + scrollDistance * easeInOutCubic(progress))

        if (progress < 1) {
          requestAnimationFrame(animateScroll)
        } else {
          // Scroll complete - keep highlight for a bit longer
          setTimeout(() => {
            setHighlightComments(false)
          }, 1500)
        }
      }

      requestAnimationFrame(animateScroll)
    }
  }

  const reactionEmojis: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    laugh: "😄",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BackButton href="/wiki" label="Back to Wiki" />

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
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">{article.title}</h1>
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
              <Button variant="outline" size="sm" onClick={handleScrollToComments} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
              </Button>
            </div>
            {currentUser && currentUser.id === article.authorId && (
              <Link href={`/wiki/${article.slug}/edit`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit Article
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="prose prose-lg prose-slate max-w-none dark:prose-invert">
          <div className="prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card
        id="comments-section"
        className={`mt-6 border-2 transition-all duration-1000 ease-out ${
          highlightComments
            ? "ring-4 ring-primary/40 shadow-xl shadow-primary/20 scale-[1.005] bg-primary/[0.02]"
            : "ring-0 scale-100"
        }`}
      >
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Comments</h2>
            <Badge variant="secondary" className="text-sm">
              {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Add Comment */}
          {currentUser && (
            <div className="flex gap-4 pb-6 border-b">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.fullName} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {currentUser.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewComment(value)
                    // Auto-replace emoticons when user types space or punctuation
                    const lastChar = value[value.length - 1]
                    if (lastChar === ' ' || lastChar === '\n' || /[.,!?;:]/.test(lastChar)) {
                      const replaced = replaceEmoticons(value)
                      if (replaced !== value) {
                        setNewComment(replaced)
                      }
                    }
                  }}
                  rows={4}
                  className="min-h-[100px] resize-none text-base"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isPostingComment}
                    size="lg"
                    className="px-6"
                    loading={isPostingComment}
                    loadingText="Posting comment..."
                  >
                    {!isPostingComment && <Send className="h-4 w-4 mr-2" />}
                    {!isPostingComment && "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {topLevelComments.map((comment) => {
              const commentUser = getUserById(comment.userId)
              const replies = getReplies(comment.id)
              const isOwner = currentUser?.id === comment.userId
              const isEditing = editingCommentId === comment.id
              const userReaction = getUserReaction(comment)
              const totalReactions = getTotalReactions(comment)

              return (
                <div key={comment.id} className="group">
                  <div className="flex gap-4">
                    <Link href={`/profile/${commentUser?.username}`} className="flex-shrink-0">
                      <Avatar className="h-11 w-11 ring-2 ring-border hover:ring-primary/50 transition-all">
                        <AvatarImage src={commentUser?.avatar || "/placeholder.svg"} alt={commentUser?.fullName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {commentUser?.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-xl p-4 border border-border/50 hover:border-border transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/profile/${commentUser?.username}`}
                              className="font-semibold text-sm hover:text-primary transition-colors"
                            >
                              {commentUser?.fullName}
                            </Link>
                            {article.authorId === comment.userId && (
                              <Badge variant="default" className="text-xs font-medium">
                                Author
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatCommentDate(comment.createdAt)}
                              {comment.updatedAt && (
                                <span className="italic ml-1">(edited)</span>
                              )}
                            </span>
                          </div>
                          {isOwner && !isEditing && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStartEdit(comment)}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(comment.id)}
                                  variant="destructive"
                                  disabled={isDeleting === comment.id}
                                >
                                  {isDeleting === comment.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editContent}
                              onChange={(e) => {
                                const value = e.target.value
                                setEditContent(value)
                                // Auto-replace emoticons when user types space or punctuation
                                const lastChar = value[value.length - 1]
                                if (lastChar === ' ' || lastChar === '\n' || /[.,!?;:]/.test(lastChar)) {
                                  const replaced = replaceEmoticons(value)
                                  if (replaced !== value) {
                                    setEditContent(replaced)
                                  }
                                }
                              }}
                              rows={4}
                              className="bg-background text-base min-h-[100px]"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCommentId(null)
                                  setEditContent("")
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(comment.id)}
                                loading={isSavingEdit === comment.id}
                                loadingText="Saving..."
                              >
                                {isSavingEdit !== comment.id && <Check className="h-4 w-4 mr-1" />}
                                {isSavingEdit !== comment.id && "Save"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{comment.content}</p>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex items-center gap-4 mt-3">
                          {currentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setReplyingTo(replyingTo === comment.id ? null : comment.id)
                                setReplyContent("")
                              }}
                            >
                              <Reply className="h-3.5 w-3.5 mr-1.5" />
                              Reply
                            </Button>
                          )}

                          {/* Reactions */}
                          {currentUser && (
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Smile className="h-4 w-4 mr-1.5" />
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
                                    const count = comment.reactions?.[reactionType]?.length || 0
                                    return (
                                      <DropdownMenuItem
                                        key={type}
                                        onClick={() => handleReaction(comment.id, reactionType)}
                                        className={`cursor-pointer ${isActive ? "bg-primary/10 font-medium" : ""}`}
                                      >
                                        <span className="mr-2 text-lg">{emoji}</span>
                                        <span className="capitalize flex-1">{type}</span>
                                        {count > 0 && (
                                          <span className="text-xs text-muted-foreground">({count})</span>
                                        )}
                                      </DropdownMenuItem>
                                    )
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              {userReaction && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                                  onClick={() => handleReaction(comment.id, userReaction)}
                                >
                                  <span className="text-base mr-1">{reactionEmojis[userReaction]}</span>
                                  <span className="font-medium">{comment.reactions?.[userReaction]?.length || 0}</span>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reply Input */}
                      {replyingTo === comment.id && currentUser && (
                        <div className="mt-4 ml-4 pl-4 border-l-2 border-primary/30 space-y-3">
                          <div className="flex gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-border">
                              <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.fullName} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {currentUser.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                placeholder={`Reply to ${commentUser?.fullName}...`}
                                value={replyContent}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setReplyContent(value)
                                  // Auto-replace emoticons when user types space or punctuation
                                  const lastChar = value[value.length - 1]
                                  if (lastChar === ' ' || lastChar === '\n' || /[.,!?;:]/.test(lastChar)) {
                                    const replaced = replaceEmoticons(value)
                                    if (replaced !== value) {
                                      setReplyContent(replaced)
                                    }
                                  }
                                }}
                                rows={3}
                                className="bg-background text-sm min-h-[80px] resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyContent("")
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(comment.id)}
                                  disabled={!replyContent.trim() || isReplying === comment.id}
                                  loading={isReplying === comment.id}
                                  loadingText="Posting reply..."
                                >
                                  {isReplying !== comment.id && <Send className="h-3.5 w-3.5 mr-1.5" />}
                                  {isReplying !== comment.id && "Reply"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="mt-5 ml-4 pl-5 space-y-4 border-l-2 border-primary/20">
                          {replies.map((reply) => {
                            const replyUser = getUserById(reply.userId)
                            const isReplyOwner = currentUser?.id === reply.userId
                            const isEditingReply = editingCommentId === reply.id
                            const replyUserReaction = getUserReaction(reply)
                            const replyTotalReactions = getTotalReactions(reply)

                            return (
                              <div key={reply.id} className="group/reply">
                                <div className="flex gap-3">
                                  <Link href={`/profile/${replyUser?.username}`} className="flex-shrink-0">
                                    <Avatar className="h-9 w-9 ring-2 ring-border hover:ring-primary/50 transition-all">
                                      <AvatarImage
                                        src={replyUser?.avatar || "/placeholder.svg"}
                                        alt={replyUser?.fullName}
                                      />
                                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                                        {replyUser?.fullName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </Link>
                                  <div className="flex-1 min-w-0">
                                    <div className="bg-muted/40 rounded-lg p-3.5 border border-border/50 hover:border-border transition-all">
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Link
                                            href={`/profile/${replyUser?.username}`}
                                            className="font-semibold text-xs hover:text-primary transition-colors"
                                          >
                                            {replyUser?.fullName}
                                          </Link>
                                          {article.authorId === reply.userId && (
                                            <Badge variant="default" className="text-[10px] font-medium px-1.5 py-0">
                                              Author
                                            </Badge>
                                          )}
                                          <span className="text-[10px] text-muted-foreground">replied to</span>
                                          <Link
                                            href={`/profile/${commentUser?.username}`}
                                            className="text-xs font-medium hover:text-primary transition-colors"
                                          >
                                            {commentUser?.fullName}
                                          </Link>
                                          <span className="text-[10px] text-muted-foreground">
                                            {formatCommentDate(reply.createdAt)}
                                            {reply.updatedAt && <span className="italic ml-1">(edited)</span>}
                                          </span>
                                        </div>
                                        {isReplyOwner && !isEditingReply && (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                              >
                                                <MessageCircle className="h-3.5 w-3.5" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => handleStartEdit(reply)}>
                                                <Edit2 className="h-4 w-4 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem
                                                onClick={() => handleDelete(reply.id)}
                                                variant="destructive"
                                                disabled={isDeleting === reply.id}
                                              >
                                                {isDeleting === reply.id ? (
                                                  <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Deleting...
                                                  </>
                                                ) : (
                                                  <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                  </>
                                                )}
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </div>
                                      {isEditingReply ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editContent}
                                            onChange={(e) => {
                                              const value = e.target.value
                                              setEditContent(value)
                                              // Auto-replace emoticons when user types space or punctuation
                                              const lastChar = value[value.length - 1]
                                              if (lastChar === ' ' || lastChar === '\n' || /[.,!?;:]/.test(lastChar)) {
                                                const replaced = replaceEmoticons(value)
                                                if (replaced !== value) {
                                                  setEditContent(replaced)
                                                }
                                              }
                                            }}
                                            rows={3}
                                            className="bg-background text-sm min-h-[80px]"
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setEditingCommentId(null)
                                                setEditContent("")
                                              }}
                                            >
                                              <X className="h-3 w-3 mr-1" />
                                              Cancel
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSaveEdit(reply.id)}
                                              loading={isSavingEdit === reply.id}
                                              loadingText="Saving..."
                                            >
                                              {isSavingEdit !== reply.id && <Check className="h-3 w-3 mr-1" />}
                                              {isSavingEdit !== reply.id && "Save"}
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap mt-1">
                                          {reply.content}
                                        </p>
                                      )}
                                    </div>
                                    {!isEditingReply && currentUser && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 px-2 text-[10px] hover:bg-primary/10 hover:text-primary"
                                            >
                                              <Smile className="h-3.5 w-3.5 mr-1" />
                                              {replyTotalReactions > 0 ? (
                                                <span className="font-medium">{replyTotalReactions}</span>
                                              ) : (
                                                <span className="text-muted-foreground">React</span>
                                              )}
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="start" className="w-40">
                                            {Object.entries(reactionEmojis).map(([type, emoji]) => {
                                              const reactionType = type as ReactionType
                                              const isActive = replyUserReaction === reactionType
                                              const count = reply.reactions?.[reactionType]?.length || 0
                                              return (
                                                <DropdownMenuItem
                                                  key={type}
                                                  onClick={() => handleReaction(reply.id, reactionType)}
                                                  className={`cursor-pointer ${isActive ? "bg-primary/10 font-medium" : ""}`}
                                                >
                                                  <span className="mr-2 text-lg">{emoji}</span>
                                                  <span className="capitalize flex-1">{type}</span>
                                                  {count > 0 && (
                                                    <span className="text-xs text-muted-foreground">({count})</span>
                                                  )}
                                                </DropdownMenuItem>
                                              )
                                            })}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        {replyUserReaction && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20"
                                            onClick={() => handleReaction(reply.id, replyUserReaction)}
                                          >
                                            <span className="text-sm mr-1">{reactionEmojis[replyUserReaction]}</span>
                                            <span className="font-medium">{reply.reactions?.[replyUserReaction]?.length || 0}</span>
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {topLevelComments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">
                {currentUser ? "No comments yet. Be the first to comment!" : "No comments yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
