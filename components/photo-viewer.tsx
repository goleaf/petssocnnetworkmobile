"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { X, ChevronLeft, ChevronRight, Smile, MessageCircle, Send, Reply, Edit2, Trash2, Check } from "lucide-react"
import { useAuth } from "@/lib/auth"
import {
  getCommentsByPetPhotoId,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentReaction,
  togglePhotoReaction,
  getPhotoReactions,
  getUsers,
  getPetById,
  areUsersBlocked,
} from "@/lib/storage"
import type { Comment, ReactionType } from "@/lib/types"
import { formatCommentDate } from "@/lib/utils/date"
import { replaceEmoticons } from "@/lib/utils/emoticon-replacer"
import Link from "next/link"

interface PhotoViewerProps {
  photos: string[]
  petId: string
  initialIndex?: number
  isOpen: boolean
  onClose: () => void
  petName?: string
}

export function PhotoViewer({ photos, petId, initialIndex = 0, isOpen, onClose, petName }: PhotoViewerProps) {
  const { user: currentUser } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [photoReactions, setPhotoReactions] = useState<Record<ReactionType, string[]>>({
    like: [],
    love: [],
    laugh: [],
    wow: [],
    sad: [],
    angry: [],
  })
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const pet = useMemo(() => getPetById(petId), [petId])
  const interactionBlocked = Boolean(currentUser && pet && areUsersBlocked(currentUser.id, pet.ownerId))
  const blockingMessage = interactionBlocked
    ? currentUser?.blockedUsers?.includes(pet?.ownerId ?? "")
      ? "You have blocked this pet's owner. Unblock them to interact with this photo."
      : "This pet's owner has blocked you. Interactions are disabled."
    : ""

  const reactionEmojis: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    laugh: "😄",
    wow: "😮",
    sad: "😢",
    angry: "😡",
  }

  const photoKey = `${petId}:${currentIndex}`

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    if (isOpen && petId !== undefined) {
      loadComments()
      loadPhotoReactions()
    }
  }, [isOpen, currentIndex, petId])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
      setShowComments(false)
      setNewComment("")
      setReplyingTo(null)
      setReplyContent("")
      setEditingCommentId(null)
      setEditContent("")
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        handlePrevious()
      } else if (e.key === "ArrowRight") {
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, photos.length, onClose])

  const loadComments = () => {
    const photoKey = `${petId}:${currentIndex}`
    const loadedComments = getCommentsByPetPhotoId(photoKey)
    const filteredComments = currentUser
      ? loadedComments.filter((comment) => !areUsersBlocked(currentUser.id, comment.userId))
      : loadedComments
    setComments(filteredComments)
  }

  const loadPhotoReactions = () => {
    const reactions = getPhotoReactions(petId, currentIndex)
    const photoKey = `${petId}:${currentIndex}`
    const photoReactions = reactions[photoKey] || {
      like: [],
      love: [],
      laugh: [],
      wow: [],
      sad: [],
      angry: [],
    }
    setPhotoReactions(photoReactions)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev === 0 ? photos.length - 1 : prev - 1
      return newIndex
    })
  }

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev === photos.length - 1 ? 0 : prev + 1
      return newIndex
    })
  }

  const handleAddComment = () => {
    if (!currentUser || !newComment.trim()) return
    if (interactionBlocked) {
      window.alert(blockingMessage)
      return
    }

    // Replace emoticons in comment
    const processedContent = replaceEmoticons(newComment.trim())

    const photoKey = `${petId}:${currentIndex}`
    const comment: Comment = {
      id: String(Date.now()),
      petPhotoId: photoKey,
      userId: currentUser.id,
      content: processedContent,
      createdAt: new Date().toISOString(),
    }

    addComment(comment)
    setNewComment("")
    loadComments()
  }

  const handleReply = (parentCommentId: string) => {
    if (!currentUser || !replyContent.trim()) return
    if (interactionBlocked) {
      window.alert(blockingMessage)
      return
    }

    // Replace emoticons in reply
    const processedContent = replaceEmoticons(replyContent.trim())

    const photoKey = `${petId}:${currentIndex}`
    const comment: Comment = {
      id: String(Date.now()),
      petPhotoId: photoKey,
      userId: currentUser.id,
      content: processedContent,
      createdAt: new Date().toISOString(),
      parentCommentId,
    }

    addComment(comment)
    setReplyContent("")
    setReplyingTo(null)
    loadComments()
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return
    // Replace emoticons in edited comment
    const processedContent = replaceEmoticons(editContent.trim())
    updateComment(commentId, processedContent)
    setEditingCommentId(null)
    setEditContent("")
    loadComments()
  }

  const handleDelete = (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return
    deleteComment(commentId)
    loadComments()
  }

  const handlePhotoReaction = (reactionType: ReactionType) => {
    if (!currentUser) return
    if (interactionBlocked) {
      window.alert(blockingMessage)
      return
    }
    togglePhotoReaction(petId, currentIndex, currentUser.id, reactionType)
    loadPhotoReactions()
  }

  const handleCommentReaction = (commentId: string, reactionType: ReactionType) => {
    if (!currentUser) return
    if (interactionBlocked) {
      window.alert(blockingMessage)
      return
    }
    const targetComment = comments.find((comment) => comment.id === commentId)
    if (targetComment && areUsersBlocked(currentUser.id, targetComment.userId)) {
      window.alert("You cannot react to this comment because of a blocking relationship.")
      return
    }
    toggleCommentReaction(commentId, currentUser.id, reactionType)
    loadComments()
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

  const getUserPhotoReaction = (): ReactionType | null => {
    if (!currentUser) return null
    for (const [type, userIds] of Object.entries(photoReactions)) {
      if (userIds.includes(currentUser.id)) {
        return type as ReactionType
      }
    }
    return null
  }

  const getTotalPhotoReactions = (): number => {
    return Object.values(photoReactions).reduce((sum, arr) => sum + arr.length, 0)
  }

  // Organize comments
  const topLevelComments = comments.filter((c) => !c.parentCommentId)
  const getReplies = (commentId: string) => comments.filter((c) => c.parentCommentId === commentId)

  const userPhotoReaction = getUserPhotoReaction()
  const totalPhotoReactions = getTotalPhotoReactions()

  if (!isOpen || photos.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Main Container */}
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Photo Section */}
        <div className="relative max-w-full max-h-full flex items-center justify-center flex-1">
          {/* Previous Button */}
          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Current Photo */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={photos[currentIndex] || "/placeholder.svg"}
              alt={petName ? `${petName} photo ${currentIndex + 1}` : `Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Photo Counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}

          {/* Photo Reactions */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            {currentUser && (
              <div className="flex items-center gap-1 bg-black/50 rounded-full px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-2 text-white hover:bg-white/20 ${
                        userPhotoReaction ? "bg-primary/30" : ""
                      }`}
                      disabled={interactionBlocked}
                    >
                      <Smile className="h-4 w-4 mr-1.5" />
                      {totalPhotoReactions > 0 ? (
                        <span className="font-medium">{totalPhotoReactions}</span>
                      ) : (
                        <span>React</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-40">
                    {Object.entries(reactionEmojis).map(([type, emoji]) => {
                      const reactionType = type as ReactionType
                      const isActive = userPhotoReaction === reactionType
                      const count = photoReactions[reactionType]?.length || 0
                      return (
                        <DropdownMenuItem
                          key={type}
                          disabled={interactionBlocked}
                          onClick={() => {
                            if (!interactionBlocked) {
                              handlePhotoReaction(reactionType)
                            }
                          }}
                          className={`cursor-pointer ${isActive ? "bg-primary/10 font-medium" : ""}`}
                        >
                          <span className="mr-2 text-lg">{emoji}</span>
                          <span className="capitalize flex-1">{type}</span>
                          {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {userPhotoReaction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-white bg-primary/30 hover:bg-primary/40"
                    onClick={() => handlePhotoReaction(userPhotoReaction)}
                    disabled={interactionBlocked}
                  >
                    <span className="text-base mr-1">{reactionEmojis[userPhotoReaction]}</span>
                    <span className="font-medium">{photoReactions[userPhotoReaction]?.length || 0}</span>
                  </Button>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-white hover:bg-white/20 bg-black/50 rounded-full"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {comments.length}
            </Button>
          </div>
        </div>

        {/* Comments Panel */}
        {showComments && (
          <Card className="w-96 max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Comments</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowComments(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {topLevelComments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {currentUser ? "No comments yet. Be the first to comment!" : "No comments yet."}
                  </div>
                ) : (
                  topLevelComments.map((comment) => {
                    const commentUser = getUsers().find((u) => u.id === comment.userId)
                    const isOwner = currentUser?.id === comment.userId
                    const isEditing = editingCommentId === comment.id
                    const userReaction = getUserReaction(comment)
                    const totalReactions = getTotalReactions(comment)
                    const replies = getReplies(comment.id)

                    return (
                      <div key={comment.id} className="group">
                        <div className="flex gap-3">
                          <Link href={`/profile/${commentUser?.username}`} className="flex-shrink-0">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={commentUser?.avatar || "/placeholder.svg"} alt={commentUser?.fullName} />
                              <AvatarFallback>{commentUser?.fullName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/profile/${commentUser?.username}`}
                                className="font-semibold text-sm hover:text-primary"
                              >
                                {commentUser?.fullName}
                              </Link>
                              <span className="text-xs text-muted-foreground">{formatCommentDate(comment.createdAt)}</span>
                              {comment.updatedAt && <span className="text-xs text-muted-foreground italic">(edited)</span>}
                            </div>
                            {isEditing ? (
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
                                  className="text-sm min-h-[60px]"
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
                                  <Button size="sm" onClick={() => handleSaveEdit(comment.id)}>
                                    <Check className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            )}
                            {!isEditing && (
                              <div className="flex items-center gap-2 mt-2">
                                {currentUser && !interactionBlocked && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setReplyingTo(replyingTo === comment.id ? null : comment.id)
                                      setReplyContent("")
                                    }}
                                  >
                                    <Reply className="h-3.5 w-3.5 mr-1.5" />
                                    Reply
                                  </Button>
                                )}
                                {currentUser && !interactionBlocked && (
                                  <div className="flex items-center gap-1">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                                          disabled={interactionBlocked}
                                        >
                                          <Smile className="h-3.5 w-3.5 mr-1.5" />
                                          {totalReactions > 0 ? <span className="font-medium">{totalReactions}</span> : <span>React</span>}
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
                                              disabled={interactionBlocked}
                                              onClick={() => {
                                                if (!interactionBlocked) {
                                                  handleCommentReaction(comment.id, reactionType)
                                                }
                                              }}
                                              className={`cursor-pointer ${isActive ? "bg-primary/10 font-medium" : ""}`}
                                            >
                                              <span className="mr-2 text-lg">{emoji}</span>
                                              <span className="capitalize flex-1">{type}</span>
                                              {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                                            </DropdownMenuItem>
                                          )
                                        })}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {userReaction && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                                        onClick={() => handleCommentReaction(comment.id, userReaction)}
                                        disabled={interactionBlocked}
                                      >
                                        <span className="text-sm mr-1">{reactionEmojis[userReaction]}</span>
                                        <span className="font-medium">{comment.reactions?.[userReaction]?.length || 0}</span>
                                      </Button>
                                    )}
                                  </div>
                                )}
                                {isOwner && !isEditing && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                        <MessageCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleStartEdit(comment)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDelete(comment.id)} variant="destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingTo === comment.id && currentUser && !interactionBlocked && (
                              <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/30 space-y-2">
                                <div className="flex gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.fullName} />
                                    <AvatarFallback>{currentUser.fullName.charAt(0)}</AvatarFallback>
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
                                      rows={2}
                                      className="text-sm min-h-[60px]"
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
                                      <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyContent.trim()}>
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
                              <div className="mt-3 ml-4 pl-4 space-y-3 border-l-2 border-primary/20">
                                {replies.map((reply) => {
                                  const replyUser = getUsers().find((u) => u.id === reply.userId)
                                  const isReplyOwner = currentUser?.id === reply.userId
                                  const isEditingReply = editingCommentId === reply.id
                                  const replyUserReaction = getUserReaction(reply)
                                  const replyTotalReactions = getTotalReactions(reply)

                                  return (
                                    <div key={reply.id} className="group/reply">
                                      <div className="flex gap-2">
                                        <Link href={`/profile/${replyUser?.username}`} className="flex-shrink-0">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={replyUser?.avatar || "/placeholder.svg"} alt={replyUser?.fullName} />
                                            <AvatarFallback>{replyUser?.fullName?.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                          <div className="bg-muted/40 rounded-lg p-2.5 border border-border/50">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                              <Link href={`/profile/${replyUser?.username}`} className="font-semibold text-xs hover:text-primary">
                                                {replyUser?.fullName}
                                              </Link>
                                              <span className="text-[10px] text-muted-foreground">replied to</span>
                                              <Link href={`/profile/${commentUser?.username}`} className="text-xs font-medium hover:text-primary">
                                                {commentUser?.fullName}
                                              </Link>
                                              <span className="text-[10px] text-muted-foreground">{formatCommentDate(reply.createdAt)}</span>
                                              {reply.updatedAt && <span className="text-[10px] text-muted-foreground italic">(edited)</span>}
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
                                                  rows={2}
                                                  className="text-sm min-h-[50px]"
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
                                              <p className="text-xs leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                            )}
                                          </div>
                                          {!isEditingReply && currentUser && (
                                            <div className="flex items-center gap-2 mt-2">
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] hover:bg-primary/10 hover:text-primary">
                                                    <Smile className="h-3 w-3 mr-1" />
                                                    {replyTotalReactions > 0 ? <span className="font-medium">{replyTotalReactions}</span> : <span>React</span>}
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
                                                        onClick={() => handleCommentReaction(reply.id, reactionType)}
                                                        className={`cursor-pointer ${isActive ? "bg-primary/10 font-medium" : ""}`}
                                                      >
                                                        <span className="mr-2 text-lg">{emoji}</span>
                                                        <span className="capitalize flex-1">{type}</span>
                                                        {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                                                      </DropdownMenuItem>
                                                    )
                                                  })}
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                              {replyUserReaction && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20"
                                                  onClick={() => handleCommentReaction(reply.id, replyUserReaction)}
                                                >
                                                  <span className="text-xs mr-1">{reactionEmojis[replyUserReaction]}</span>
                                                  <span className="font-medium">{reply.reactions?.[replyUserReaction]?.length || 0}</span>
                                                </Button>
                                              )}
                                              {isReplyOwner && !isEditingReply && (
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/reply:opacity-100">
                                                      <MessageCircle className="h-3 w-3" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleStartEdit(reply)}>
                                                      <Edit2 className="h-4 w-4 mr-2" />
                                                      Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(reply.id)} variant="destructive">
                                                      <Trash2 className="h-4 w-4 mr-2" />
                                                      Delete
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
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
                  })
                )}
              </div>

              {/* Add Comment */}
              {currentUser ? (
                interactionBlocked ? (
                  <div className="border-t pt-4">
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                      {blockingMessage}
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.fullName} />
                        <AvatarFallback>{currentUser.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => {
                            const value = e.target.value
                            setNewComment(value)
                            const lastChar = value[value.length - 1]
                            if (lastChar === ' ' || lastChar === '\n' || /[.,!?;:]/.test(lastChar)) {
                              const replaced = replaceEmoticons(value)
                              if (replaced !== value) {
                                setNewComment(replaced)
                              }
                            }
                          }}
                          rows={2}
                          className="text-sm min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end">
                          <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
