"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import {
  addComment,
  areUsersBlocked,
  deleteComment,
  flagComment,
  getBlogPostById,
  updateBlogPost,
  getCommentsByPetPhotoId,
  getCommentsByPostId,
  getCommentsByWikiArticleId,
  getPetById,
  getUsers,
  getWikiArticles,
  moderateComment,
  toggleCommentReaction,
  updateComment,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { Comment, CommentFlagReason, CommentStatus, ReactionType, User } from "@/lib/types"
import {
  COMMENT_FLAG_LABELS,
  COMMENT_STATUS_LABELS,
  buildCommentTree,
  canUserDeleteComment,
  canUserEditComment,
  canUserModerate,
  hasActiveFlags,
  isCommentHidden,
  isCommentPending,
  type CommentNode,
} from "@/lib/utils/comments"
import { formatCommentDate } from "@/lib/utils/date"
import { replaceEmoticons } from "@/lib/utils/emoticon-replacer"
import { cn } from "@/lib/utils"
import { CommentEditor } from "./comment-editor"
import { BrandAffiliationLabel } from "@/components/brand-affiliation-label"
import { BrandAffiliationDisclosure } from "@/components/brand-affiliation-disclosure"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Flag,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Reply,
  ShieldAlert,
  ShieldCheck,
  SmilePlus,
  Trash2,
} from "lucide-react"

type CommentContext =
  | { type: "post"; id: string }
  | { type: "wiki"; id: string }
  | { type: "photo"; id: string }

interface AdvancedCommentsProps {
  context: CommentContext
  className?: string
  header?: string | null
  emptyStateMessage?: string
  onCountChange?: (count: number) => void
  maxDepth?: number
  reactionsMode?: 'simple' | 'full'
}

interface FlagDialogState {
  open: boolean
  target: Comment | null
  reason: CommentFlagReason
  message: string
}

interface ModerationDialogState {
  open: boolean
  target: Comment | null
  status: CommentStatus
  note: string
}

interface DeleteState {
  open: boolean
  target: Comment | null
}

const DEFAULT_REACTIONS: Record<ReactionType, string[]> = {
  like: [],
  love: [],
  laugh: [],
  wow: [],
  sad: [],
  angry: [],
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  laugh: "😄",
  wow: "😮",
  sad: "😢",
  angry: "😡",
  paw: "🐾",
}

function generateCommentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return String(Date.now())
}

function getContextComments(context: CommentContext): Comment[] {
  switch (context.type) {
    case "post":
      return getCommentsByPostId(context.id)
    case "wiki":
      return getCommentsByWikiArticleId(context.id)
    case "photo":
      return getCommentsByPetPhotoId(context.id)
    default:
      return []
  }
}

function applyContext(comment: Comment, context: CommentContext): Comment {
  if (context.type === "post") {
    return { ...comment, postId: context.id, wikiArticleId: undefined, petPhotoId: undefined }
  }
  if (context.type === "wiki") {
    return { ...comment, wikiArticleId: context.id, postId: undefined, petPhotoId: undefined }
  }
  if (context.type === "photo") {
    return { ...comment, petPhotoId: context.id, postId: undefined, wikiArticleId: undefined }
  }
  return comment
}

export function AdvancedComments({
  context,
  className,
  header = "Comments",
  emptyStateMessage = "No comments yet. Be the first to start the discussion!",
  onCountChange,
  maxDepth = 3,
  reactionsMode = 'simple',
}: AdvancedCommentsProps) {
  const { user: currentUser } = useAuth()
  const contextType = context.type
  const contextId = context.id
  const viewerId = currentUser?.id ?? null
  const viewerBlockKey = currentUser?.blockedUsers?.join("|") ?? ""
  const contextOwnerId = useMemo(() => {
    if (contextType === "post") {
      return getBlogPostById(contextId)?.authorId ?? null
    }
    if (contextType === "wiki") {
      const article = getWikiArticles().find((item) => item.id === contextId)
      return article?.authorId ?? null
    }
    if (contextType === "photo") {
      const [petId] = contextId.split(":")
      if (!petId) return null
      return getPetById(petId)?.ownerId ?? null
    }
    return null
  }, [contextType, contextId])

  const [comments, setComments] = useState<Comment[]>(() => getContextComments(context))
  const [users, setUsers] = useState<User[]>(() => getUsers())
  const [bestAnswerId, setBestAnswerId] = useState<string | null>(() => (contextType === 'post' ? (getBlogPostById(contextId)?.bestAnswerCommentId || null) : null))
  const [pinnedCommentId, setPinnedCommentId] = useState<string | null>(() => (contextType === 'post' ? (getBlogPostById(contextId)?.pinnedCommentId || null) : null))
  const [commentDraft, setCommentDraft] = useState("")
  const [commentAttachment, setCommentAttachment] = useState<string | null>(null)
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState("")
  const [replyAttachment, setReplyAttachment] = useState<string | null>(null)
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [editBrandAffiliation, setEditBrandAffiliation] = useState<{ disclosed: boolean; organizationName?: string; organizationType?: "brand" | "organization" | "sponsor" | "affiliate" }>({ disclosed: false })
  const [flagDialog, setFlagDialog] = useState<FlagDialogState>({
    open: false,
    target: null,
    reason: "spam",
    message: "",
  })
  const [moderationDialog, setModerationDialog] = useState<ModerationDialogState>({
    open: false,
    target: null,
    status: "pending",
    note: "",
  })
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false, target: null })
  const [flagDetails, setFlagDetails] = useState<Comment | null>(null)

  const loadComments = useCallback(() => {
    const allComments = getContextComments({ type: contextType, id: contextId })
    if (viewerId) {
      const blockedIds = viewerBlockKey ? viewerBlockKey.split("|").filter(Boolean) : null
      const isMod = currentUser?.role === "admin" || currentUser?.role === "moderator"
      setComments(
        allComments.filter((comment) => {
          if (blockedIds && blockedIds.includes(comment.userId)) return false
          if (areUsersBlocked(viewerId, comment.userId)) return false
          // Pending comments are only visible to their author, the content owner, or moderators
          if (comment.status === "pending") {
            if (comment.userId === viewerId) return true
            if (contextOwnerId && viewerId === contextOwnerId) return true
            if (isMod) return true
            return false
          }
          return true
        }),
      )
    } else {
      // Logged out: hide pending comments
      setComments(allComments.filter((c) => c.status !== "pending"))
    }
  }, [contextType, contextId, viewerId, viewerBlockKey, currentUser?.role, contextOwnerId])

  const refreshUsers = useCallback(() => {
    setUsers(getUsers())
  }, [])

  useEffect(() => {
    loadComments()
    refreshUsers()
    if (contextType === 'post') {
      setBestAnswerId(getBlogPostById(contextId)?.bestAnswerCommentId || null)
      setPinnedCommentId(getBlogPostById(contextId)?.pinnedCommentId || null)
    }
  }, [loadComments, refreshUsers])

  // Listen for storage updates to reflect best answer changes
  useEffect(() => {
    if (typeof window === 'undefined' || contextType !== 'post') return
    const handler = (e: StorageEvent) => {
      if (e.key && e.key !== 'pet_social_blog_posts') return
      setBestAnswerId(getBlogPostById(contextId)?.bestAnswerCommentId || null)
      setPinnedCommentId(getBlogPostById(contextId)?.pinnedCommentId || null)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [contextType, contextId])

  const usersById = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((user) => map.set(user.id, user))
    return map
  }, [users])
  const isInteractionBlocked = useMemo(() => {
    if (!currentUser?.id || !contextOwnerId) {
      return false
    }
    return areUsersBlocked(currentUser.id, contextOwnerId)
  }, [currentUser?.id, contextOwnerId])
  const ownerUser = contextOwnerId ? usersById.get(contextOwnerId) : undefined
  const viewerHasBlockedOwner = Boolean(
    contextOwnerId && currentUser?.blockedUsers?.includes(contextOwnerId),
  )
  const ownerHasBlockedViewer = Boolean(
    currentUser?.id && ownerUser?.blockedUsers?.includes(currentUser.id),
  )
  const blockingOwnerName = ownerUser?.fullName ?? "this user"
  const blockingMessage = viewerHasBlockedOwner
    ? `You have blocked ${blockingOwnerName}. Unblock them to resume interacting.`
    : ownerHasBlockedViewer
      ? `${blockingOwnerName} has blocked you. You can no longer interact with this content.`
      : "Interactions with this content are currently disabled."

  const [sortMode, setSortMode] = useState<'top'|'newest'>('top')
  const commentTree = useMemo(() => {
    const roots = buildCommentTree(comments, { sortDirection: "asc" })
    if (sortMode === 'newest') {
      return [...roots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    const likes = (n: Comment) => n.reactions?.like?.length || 0
    return [...roots].sort((a, b) => {
      const d = likes(b) - likes(a)
      return d !== 0 ? d : (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })
  }, [comments, sortMode])
  const totalComments = comments.length
  const viewerCanModerate = canUserModerate(currentUser) || (currentUser?.id && currentUser.id === contextOwnerId)

  const totalVisibleComments = useMemo(() => {
    if (viewerCanModerate) return totalComments
    // Hide comments marked as hidden when viewer is not moderator; replies remain accessible but displayed as removed
    return comments.filter((comment) => comment.status !== "hidden").length
  }, [comments, totalComments, viewerCanModerate])

  useEffect(() => {
    onCountChange?.(totalVisibleComments)
  }, [onCountChange, totalVisibleComments])

  const getUserReaction = useCallback(
    (comment: Comment): ReactionType | null => {
      if (!currentUser || !comment.reactions) return null
      for (const [type, userIds] of Object.entries(comment.reactions)) {
        if (userIds.includes(currentUser.id)) {
          return type as ReactionType
        }
      }
      return null
    },
    [currentUser],
  )

  const getTotalReactions = useCallback((comment: Comment): number => {
    if (!comment.reactions) return 0
    return Object.values(comment.reactions).reduce((sum, arr) => sum + arr.length, 0)
  }, [])

  const ensureAuthenticated = (action: string) => {
    if (!currentUser) {
      window.alert(`You need to be logged in to ${action}.`)
      return false
    }
    return true
  }

  const handleCreateComment = () => {
    if (!ensureAuthenticated("post a comment")) return
    if (isInteractionBlocked) {
      window.alert(blockingMessage)
      return
    }
    if (!commentDraft.trim()) return
    const processedContent = replaceEmoticons(commentDraft.trim())
    const now = new Date().toISOString()
    const authorIsRestricted = Boolean(ownerUser?.restrictedUsers?.includes(currentUser!.id))
    const baseComment: Comment = applyContext(
      {
        id: generateCommentId(),
        userId: currentUser!.id,
        content: processedContent,
        createdAt: now,
        format: "markdown",
        status: authorIsRestricted ? "pending" : "published",
        reactions: DEFAULT_REACTIONS,
        flags: [],
      },
      context,
    )

    addComment(baseComment)
    setCommentDraft("")
    setCommentAttachment(null)
    loadComments()
  }

  const handleStartReply = (comment: Comment) => {
    if (!ensureAuthenticated("reply")) return
    if (isInteractionBlocked) {
      window.alert(blockingMessage)
      return
    }
    setEditTargetId(null)
    setReplyTargetId(comment.id)
    const author = usersById.get(comment.userId)
    if (author?.username) {
      setReplyDraft(`@${author.username} `)
    } else {
      setReplyDraft("")
    }
    setReplyAttachment(null)
  }

  const handleSubmitReply = () => {
    if (!ensureAuthenticated("reply")) return
    if (isInteractionBlocked) {
      window.alert(blockingMessage)
      return
    }
    if (!replyTargetId || !replyDraft.trim()) return
    const processedContent = replaceEmoticons(replyDraft.trim())
    const now = new Date().toISOString()
    const authorIsRestricted = Boolean(ownerUser?.restrictedUsers?.includes(currentUser!.id))
    const replyComment: Comment = applyContext(
      {
        id: generateCommentId(),
        userId: currentUser!.id,
        content: processedContent,
        createdAt: now,
        parentCommentId: replyTargetId,
        format: "markdown",
        status: authorIsRestricted ? "pending" : "published",
        reactions: DEFAULT_REACTIONS,
        flags: [],
        attachmentImageUrl: replyAttachment || undefined,
      },
      context,
    )

    addComment(replyComment)
    setReplyTargetId(null)
    setReplyDraft("")
    setReplyAttachment(null)
    loadComments()
  }

  const handleCancelReply = () => {
    setReplyTargetId(null)
    setReplyDraft("")
  }

  const handleStartEdit = (comment: Comment) => {
    if (!ensureAuthenticated("edit this comment")) return
    if (!canUserEditComment(comment, currentUser)) return
    setReplyTargetId(null)
    setEditTargetId(comment.id)
    setEditDraft(comment.content)
    setEditBrandAffiliation(comment.brandAffiliation || { disclosed: false })
  }

  const handleSaveEdit = () => {
    if (!editTargetId || !editDraft.trim()) return
    if (!ensureAuthenticated("save changes")) return
    const target = comments.find((comment) => comment.id === editTargetId)
    if (!target) return
    if (!canUserEditComment(target, currentUser)) return

    const processedContent = replaceEmoticons(editDraft.trim())
    updateComment(editTargetId, processedContent, { 
      editorId: currentUser!.id, 
      format: "markdown",
      brandAffiliation: editBrandAffiliation.disclosed ? editBrandAffiliation : undefined,
    })
    setEditTargetId(null)
    setEditDraft("")
    setEditBrandAffiliation({ disclosed: false })
    loadComments()
  }

  const handleCancelEdit = () => {
    setEditTargetId(null)
    setEditDraft("")
    setEditBrandAffiliation({ disclosed: false })
  }

  const handleToggleReaction = (commentId: string, reactionType: ReactionType) => {
    if (!ensureAuthenticated("react to comments")) return
    if (isInteractionBlocked) {
      window.alert(blockingMessage)
      return
    }
    const targetComment = comments.find((comment) => comment.id === commentId)
    if (targetComment && areUsersBlocked(currentUser!.id, targetComment.userId)) {
      window.alert("You cannot interact with this comment because of a blocking relationship.")
      return
    }
    toggleCommentReaction(commentId, currentUser!.id, reactionType)
    loadComments()
  }

  const handleFlag = (comment: Comment) => {
    if (!ensureAuthenticated("flag comments")) return
    const existingFlag = comment.flags?.find((flag) => flag.userId === currentUser!.id)
    setFlagDialog({
      open: true,
      target: comment,
      reason: existingFlag?.reason ?? "spam",
      message: existingFlag?.message ?? "",
    })
  }

  const submitFlag = () => {
    if (!flagDialog.target || !ensureAuthenticated("flag comments")) return
    flagComment(flagDialog.target.id, currentUser!.id, flagDialog.reason, flagDialog.message.trim() || undefined)
    setFlagDialog({ open: false, target: null, reason: "spam", message: "" })
    loadComments()
  }

  const handleOpenFlagDetails = (comment: Comment) => {
    setFlagDetails(comment)
  }

  const handleModeration = (comment: Comment) => {
    if (!viewerCanModerate) return
    setModerationDialog({
      open: true,
      target: comment,
      status: comment.status ?? "published",
      note: comment.moderation?.note ?? "",
    })
  }

  const submitModeration = () => {
    if (!moderationDialog.target || !currentUser || !viewerCanModerate) return
    moderateComment(moderationDialog.target.id, moderationDialog.status, currentUser.id, moderationDialog.note.trim() || undefined, {
      clearFlags: moderationDialog.status === "published",
    })
    setModerationDialog({ open: false, target: null, status: "published", note: "" })
    loadComments()
  }

  const handleDelete = (comment: Comment) => {
    if (!ensureAuthenticated("delete comments")) return
    if (!(canUserDeleteComment(comment, currentUser) || viewerCanModerate)) return
    setDeleteState({ open: true, target: comment })
  }

  const confirmDelete = () => {
    if (!deleteState.target || !currentUser) return
    if (!(canUserDeleteComment(deleteState.target, currentUser) || viewerCanModerate)) return
    deleteComment(deleteState.target.id)
    setDeleteState({ open: false, target: null })
    loadComments()
  }

  const renderCommentNode = (node: CommentNode) => (
    <CommentCard
      key={node.id}
      node={node}
      depth={node.depth}
      usersById={usersById}
      currentUser={currentUser}
      viewerCanModerate={viewerCanModerate}
      interactionBlocked={isInteractionBlocked}
      canMarkBestAnswer={contextType === 'post' && currentUser?.id === contextOwnerId}
      isBestAnswer={bestAnswerId === node.id}
      onMarkBestAnswer={() => {
        if (contextType !== 'post' || !currentUser || currentUser.id !== contextOwnerId) return
        const post = getBlogPostById(contextId)
        if (!post) return
        const next = bestAnswerId === node.id ? undefined : node.id
        updateBlogPost({ ...post, bestAnswerCommentId: next })
        setBestAnswerId(next || null)
      }}
      onStartReply={() => handleStartReply(node)}
      onCancelReply={handleCancelReply}
      onSubmitReply={handleSubmitReply}
      replyDraft={replyTargetId === node.id ? replyDraft : ""}
      setReplyDraft={setReplyDraft}
      isReplying={replyTargetId === node.id}
      onStartEdit={() => handleStartEdit(node)}
      onCancelEdit={handleCancelEdit}
      onSaveEdit={handleSaveEdit}
      editDraft={editTargetId === node.id ? editDraft : ""}
      setEditDraft={setEditDraft}
      isEditing={editTargetId === node.id}
      editBrandAffiliation={editTargetId === node.id ? editBrandAffiliation : { disclosed: false }}
      setEditBrandAffiliation={setEditBrandAffiliation}
      onDelete={() => handleDelete(node)}
      onToggleReaction={(reaction) => handleToggleReaction(node.id, reaction)}
      getUserReaction={() => getUserReaction(node)}
      getTotalReactions={() => getTotalReactions(node)}
      onFlag={() => handleFlag(node)}
      onModerate={() => handleModeration(node)}
      onViewFlags={() => handleOpenFlagDetails(node)}
      onQuickApprove={() => {
        if (!currentUser) return
        if (!(currentUser.id === contextOwnerId || canUserModerate(currentUser))) return
        moderateComment(node.id, "published", currentUser.id)
        loadComments()
      }}
    >
      {node.children.map((child) => renderCommentNode(child))}
    </CommentCard>
  )

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {header && header.trim().length > 0 && <h3 className="text-lg font-semibold">{header}</h3>}
          <Badge variant="secondary">
            {totalVisibleComments} {totalVisibleComments === 1 ? "Comment" : "Comments"}
          </Badge>
        </div>
        {isInteractionBlocked ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <ShieldAlert className="h-4 w-4" />
            <span>Interactions disabled due to blocking</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <span className="text-xs">Sort:</span>
              <Button size="xs" variant={sortMode==='top' ? 'default' : 'outline'} onClick={() => setSortMode('top')}>Top</Button>
              <Button size="xs" variant={sortMode==='newest' ? 'default' : 'outline'} onClick={() => setSortMode('newest')}>Newest</Button>
            </div>
            <div className="inline-flex items-center gap-1">
              <SmilePlus className="h-4 w-4" />
              <span className="text-xs">Markdown · ⌘/Ctrl+Enter</span>
            </div>
          </div>
        )}
      </div>

      {currentUser ? (
        isInteractionBlocked ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {blockingMessage}
          </div>
        ) : (
          <div className="space-y-2">
            <CommentEditor
              value={commentDraft}
              onChange={setCommentDraft}
              onSubmit={handleCreateComment}
              submitLabel="Post comment"
              placeholder="Share your thoughts..."
              autoFocus={false}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <input type="file" accept="image/*,image/gif" onChange={(e) => {
                  const f = e.currentTarget.files?.[0]
                  if (!f) { setCommentAttachment(null); return }
                  const reader = new FileReader()
                  reader.onload = () => setCommentAttachment(String(reader.result))
                  reader.readAsDataURL(f)
                }} />
              </div>
              {commentAttachment && <span className="text-xs text-muted-foreground">1 attachment selected</span>}
            </div>
          </div>
        )
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <p>Sign in to join the conversation.</p>
        </div>
      )}

      <div className="space-y-4">
        {pinnedCommentId && context.type === 'post' && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 text-sm font-semibold">Pinned Comment</div>
            {(() => {
              const flatten = (nodes: CommentNode[]): CommentNode[] => nodes.flatMap(n => [n, ...flatten(n.children)])
              const node = flatten(commentTree).find((n) => n.id === pinnedCommentId)
              return node ? renderCommentNode(node) : null
            })()}
          </div>
        )}
        {bestAnswerId && contextType === 'post' && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 text-sm font-semibold flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-200">Best Answer</span>
            </div>
            {/* Render the best answer node at top as well */}
            {(() => {
              const flatten = (nodes: CommentNode[]): CommentNode[] => nodes.flatMap(n => [n, ...flatten(n.children)])
              const node = flatten(commentTree).find((n) => n.id === bestAnswerId)
              return node ? renderCommentNode(node) : null
            })()}
          </div>
        )}
        {commentTree.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            {emptyStateMessage}
          </div>
        ) : (
          commentTree.map((node) => renderCommentNode(node))
        )}
      </div>

      <Dialog open={flagDialog.open} onOpenChange={(open) => setFlagDialog((state) => ({ ...state, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Choose a reason for flagging this comment. Our moderators will review it shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Select
                value={flagDialog.reason}
                onValueChange={(value) => setFlagDialog((state) => ({ ...state, reason: value as CommentFlagReason }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMMENT_FLAG_LABELS) as CommentFlagReason[]).map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {COMMENT_FLAG_LABELS[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="flag-message">
                Optional message
              </label>
              <Textarea
                id="flag-message"
                value={flagDialog.message}
                onChange={(event) => setFlagDialog((state) => ({ ...state, message: event.target.value }))}
                placeholder="Add any additional information for our moderators…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialog({ open: false, target: null, reason: "spam", message: "" })}>
              Cancel
            </Button>
            <Button onClick={submitFlag} disabled={!flagDialog.target}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(flagDetails)} onOpenChange={(open) => setFlagDetails(open ? flagDetails : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag details</DialogTitle>
            <DialogDescription>Review user reports for this comment.</DialogDescription>
          </DialogHeader>
          {flagDetails ? (
            <div className="space-y-4">
              {flagDetails.flags && flagDetails.flags.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {flagDetails.flags.map((flag) => {
                    const flaggingUser = usersById.get(flag.userId)
                    return (
                      <li key={`${flag.userId}-${flag.flaggedAt}`} className="rounded border bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {flaggingUser?.fullName ?? "Unknown user"} · {COMMENT_FLAG_LABELS[flag.reason]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCommentDate(flag.flaggedAt)}
                          </span>
                        </div>
                        {flag.message && <p className="mt-1 text-muted-foreground">{flag.message}</p>}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No flags to display.</p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDetails(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={moderationDialog.open}
        onOpenChange={(open) =>
          setModerationDialog((state) => ({
            ...state,
            open,
          }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderate Comment</DialogTitle>
            <DialogDescription>Update the visibility of this comment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={moderationDialog.status}
                onValueChange={(value) => setModerationDialog((state) => ({ ...state, status: value as CommentStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMMENT_STATUS_LABELS) as CommentStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {COMMENT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="moderation-note">
                Moderator note
              </label>
              <Textarea
                id="moderation-note"
                value={moderationDialog.note}
                onChange={(event) => setModerationDialog((state) => ({ ...state, note: event.target.value }))}
                placeholder="Leave a note about this moderation action (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setModerationDialog({
                  open: false,
                  target: null,
                  status: "published",
                  note: "",
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={submitModeration} disabled={!moderationDialog.target}>
              Apply changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteState.open} onOpenChange={(open) => setDeleteState((state) => ({ ...state, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the comment and its entire reply thread. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteState({ open: false, target: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface CommentCardProps {
  node: CommentNode
  depth: number
  usersById: Map<string, User>
  currentUser: User | null
  viewerCanModerate: boolean
  interactionBlocked: boolean
  canMarkBestAnswer?: boolean
  isBestAnswer?: boolean
  onMarkBestAnswer?: () => void
  onStartReply: () => void
  onCancelReply: () => void
  onSubmitReply: () => void
  replyDraft: string
  setReplyDraft: (value: string) => void
  isReplying: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  editDraft: string
  setEditDraft: (value: string) => void
  isEditing: boolean
  onDelete: () => void
  onToggleReaction: (reaction: ReactionType) => void
  getUserReaction: () => ReactionType | null
  getTotalReactions: () => number
  onFlag: () => void
  onModerate: () => void
  onViewFlags: () => void
  onQuickApprove?: () => void
  children: React.ReactNode
}

function CommentCard({
  node,
  depth,
  usersById,
  currentUser,
  viewerCanModerate,
  interactionBlocked,
  canMarkBestAnswer,
  isBestAnswer,
  onMarkBestAnswer,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  replyDraft,
  setReplyDraft,
  isReplying,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  editDraft,
  setEditDraft,
  isEditing,
  editBrandAffiliation,
  setEditBrandAffiliation,
  onDelete,
  onToggleReaction,
  getUserReaction,
  getTotalReactions,
  onFlag,
  onModerate,
  onViewFlags,
  onQuickApprove,
  children,
}: CommentCardProps) {
  const author = usersById.get(node.userId)
  const isOwner = currentUser?.id === node.userId
  const reaction = getUserReaction()
  const totalReactions = getTotalReactions()
  const flaggedCount = node.flags?.length ?? 0
  const isHidden = isCommentHidden(node)
  const isPending = isCommentPending(node)
  const canEdit = canUserEditComment(node, currentUser)
  const canDelete = canUserDeleteComment(node, currentUser)
  const userHasFlagged = node.flags?.some((flag) => flag.userId === currentUser?.id) ?? false

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        depth > 0 ? "border-l-4 border-l-primary/30" : "",
        isHidden ? "bg-muted/40" : "",
      )}
      style={{
        marginLeft: depth > 0 ? `${depth * 16}px` : 0,
      }}
    >
      <div className="flex gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={author?.avatar || "/placeholder.svg"} alt={author?.fullName} />
          <AvatarFallback>{author?.fullName?.charAt(0) ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">{author?.fullName ?? "Deleted user"}</span>
                  {author?.badge && (
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {author.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatCommentDate(node.createdAt)}</span>
                {node.updatedAt && <span className="text-xs text-muted-foreground italic">(edited)</span>}
                {node.brandAffiliation && (
                  <BrandAffiliationLabel brandAffiliation={node.brandAffiliation} variant="compact" />
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {isOwner && <Badge variant="outline">You</Badge>}
                {isBestAnswer && (
                  <Badge className="bg-green-600 text-white hover:bg-green-600/90">Best Answer</Badge>
                )}
                {isPending && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-100"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    {COMMENT_STATUS_LABELS.pending}
                  </Badge>
                )}
                {isPending && viewerCanModerate && !isOwner && (
                  <Button size="xs" variant="outline" className="h-6"
                    onClick={onQuickApprove}
                  >
                    Approve
                  </Button>
                )}
                {isHidden && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    {COMMENT_STATUS_LABELS.hidden}
                  </Badge>
                )}
                {node.moderation && (
                  <Badge variant="secondary" className="text-[11px]">
                    Moderated · {formatCommentDate(node.moderation.updatedAt)}
                  </Badge>
                )}
                {flaggedCount > 0 && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={viewerCanModerate ? onViewFlags : onFlag}
                    className="h-6 gap-1 border-dashed"
                  >
                    <Flag className="h-3 w-3" />
                    <span className="text-xs font-medium">{flaggedCount}</span>
                  </Button>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {canEdit && (
                  <DropdownMenuItem onClick={onStartEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
                {canMarkBestAnswer && (
                  <DropdownMenuItem onClick={onMarkBestAnswer}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {isBestAnswer ? 'Unmark Best Answer' : 'Mark as Best Answer'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onFlag}>
                  <Flag className="mr-2 h-4 w-4" />
                  {userHasFlagged ? "Update flag" : "Report"}
                </DropdownMenuItem>
                {viewerCanModerate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onModerate}>
                      {isHidden ? (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      ) : (
                        <ShieldAlert className="mr-2 h-4 w-4" />
                      )}
                      Moderate
                    </DropdownMenuItem>
                  </>
                )}
                {context.type === 'post' && currentUser?.id === contextOwnerId && (
                  <DropdownMenuItem onClick={() => {
                    const post = getBlogPostById(contextId)
                    if (!post) return
                    const next = pinnedCommentId === node.id ? undefined : node.id
                    updateBlogPost({ ...post, pinnedCommentId: next })
                    setPinnedCommentId(next || null)
                  }}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {pinnedCommentId === node.id ? 'Unpin comment' : 'Pin comment'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className={cn("prose prose-sm max-w-none text-foreground", isHidden && !viewerCanModerate ? "italic text-muted-foreground" : "")}>
            {isHidden && !viewerCanModerate && !isOwner ? (
              <p>This comment has been hidden by moderators.</p>
            ) : isEditing ? (
              <div className="space-y-3">
                <CommentEditor
                  value={editDraft}
                  onChange={setEditDraft}
                  onSubmit={onSaveEdit}
                  onCancel={onCancelEdit}
                  submitLabel="Save changes"
                  autoFocus
                  minRows={4}
                />
                <BrandAffiliationDisclosure
                  value={editBrandAffiliation}
                  onChange={setEditBrandAffiliation}
                  showReminder={true}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <ReactMarkdown>{node.content}</ReactMarkdown>
                {node.attachmentImageUrl && (
                  <img src={node.attachmentImageUrl} alt="attachment" className="max-h-64 rounded-md border" />
                )}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {currentUser && !interactionBlocked && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => onToggleReaction('like')}>
                  <span className="text-red-500">❤</span>
                  <span>{node.reactions?.like?.length || 0}</span>
                </Button>
              )}

              {!interactionBlocked && (depth < 2) && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onStartReply}>
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </Button>
              )}
            </div>
          )}

          {isReplying && !interactionBlocked && (
            <div className="border-l border-dashed pl-4 space-y-2">
              <CommentEditor
                value={replyDraft}
                onChange={setReplyDraft}
                onSubmit={onSubmitReply}
                onCancel={onCancelReply}
                submitLabel="Reply"
                autoFocus
                minRows={3}
                placeholder="Write your reply..."
              />
              <div className="flex items-center gap-2 text-xs">
                <input type="file" accept="image/*,image/gif" onChange={(e) => {
                  const f = e.currentTarget.files?.[0]
                  if (!f) { return }
                  const reader = new FileReader()
                  reader.onload = () => setReplyAttachment(String(reader.result))
                  reader.readAsDataURL(f)
                }} />
                {replyAttachment && <span className="text-muted-foreground">1 attachment selected</span>}
              </div>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}
