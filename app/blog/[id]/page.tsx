"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  getBlogPostById,
  getPetById,
  getUserById,
  getCommentsByPostId,
  addComment,
  updateComment,
  deleteComment,
  updateBlogPost,
  toggleCommentReaction,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Heart, MessageCircle, ArrowLeft, Send, Reply, Edit2, Trash2, X, Check, Smile, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Comment, ReactionType } from "@/lib/types"
import { formatCommentDate, formatDate } from "@/lib/utils/date"
import { getPetUrlFromPet } from "@/lib/utils/pet-url"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user: currentUser } = useAuth()
  const [post, setPost] = useState(() => getBlogPostById(id))
  const [pet, setPet] = useState(() => (post ? getPetById(post.petId) : null))
  const [author, setAuthor] = useState(() => (post ? getUserById(post.authorId) : null))
  const [comments, setComments] = useState<Comment[]>(() => (post ? getCommentsByPostId(post.id) : []))
  const [hasLiked, setHasLiked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load data only on client side
    const loadedPost = getBlogPostById(id)
    if (loadedPost) {
      setPost(loadedPost)
      setPet(getPetById(loadedPost.petId))
      setAuthor(getUserById(loadedPost.authorId))
      setComments(getCommentsByPostId(loadedPost.id))
    }
    setIsLoading(false)
  }, [id])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    if (post && currentUser) {
      setHasLiked(post.likes.includes(currentUser.id))
    }
  }, [post, currentUser])

  const handleLike = () => {
    if (!currentUser || !post) return

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

  const handleAddComment = () => {
    if (!currentUser || !post || !newComment.trim()) return

    const comment: Comment = {
      id: String(Date.now()),
      postId: post.id,
      userId: currentUser.id,
      content: newComment.trim(),
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
    const updatedComments = getCommentsByPostId(post.id)
    setComments(updatedComments)
    setNewComment("")
  }

  const handleReply = (parentCommentId: string) => {
    if (!currentUser || !post || !replyContent.trim()) return

    const reply: Comment = {
      id: String(Date.now()),
      postId: post.id,
      userId: currentUser.id,
      content: replyContent.trim(),
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
    const updatedComments = getCommentsByPostId(post.id)
    setComments(updatedComments)
    setReplyContent("")
    setReplyingTo(null)
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim() || !post) return
    updateComment(commentId, editContent.trim())
    const updatedComments = getCommentsByPostId(post.id)
    setComments(updatedComments)
    setEditingCommentId(null)
    setEditContent("")
  }

  const handleDelete = (commentId: string) => {
    if (!post) return
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment(commentId)
      const updatedComments = getCommentsByPostId(post.id)
      setComments(updatedComments)
    }
  }

  const handleReaction = (commentId: string, reactionType: ReactionType) => {
    if (!currentUser || !post) return
    toggleCommentReaction(commentId, currentUser.id, reactionType)
    const updatedComments = getCommentsByPostId(post.id)
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

  const reactionEmojis: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    laugh: "😄",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
      <Link href="/blog">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blogs
        </Button>
      </Link>

      <Card className="overflow-hidden p-0">
        {post.coverImage && (
          <div className="aspect-video w-full overflow-hidden">
            <img src={post.coverImage || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
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
              </p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleLike} variant={hasLiked ? "default" : "outline"} size="sm">
              <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
              {post.likes.length} {post.likes.length === 1 ? "Like" : "Likes"}
            </Button>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              {totalCommentsCount} {totalCommentsCount === 1 ? "Comment" : "Comments"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none px-6 pb-6">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
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
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="min-h-[100px] resize-none text-base"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    size="lg"
                    className="px-6"
                  >
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
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
                            {post.authorId === comment.userId && (
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
                                <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
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
                              <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                                <Check className="h-4 w-4 mr-1" />
                                Save
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
                                onChange={(e) => setReplyContent(e.target.value)}
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
                                  disabled={!replyContent.trim()}
                                >
                                  <Send className="h-3.5 w-3.5 mr-1.5" />
                                  Reply
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
                                          {post.authorId === reply.userId && (
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
                                                className="text-destructive"
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </div>
                                      {isEditingReply ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
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
                                            <Button size="sm" onClick={() => handleSaveEdit(reply.id)}>
                                              <Check className="h-3 w-3 mr-1" />
                                              Save
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
