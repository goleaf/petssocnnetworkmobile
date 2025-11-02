"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import {
  addEditorialDiscussion,
  deleteEditorialDiscussion,
  getBlogPostById,
  getEditorialDiscussionsByArticleId,
  getUsers,
  toggleEditorialDiscussionReaction,
  updateEditorialDiscussion,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import type { EditorialDiscussion, ReactionType, User } from "@/lib/types"
import { formatCommentDate } from "@/lib/utils/date"
import { replaceEmoticons } from "@/lib/utils/emoticon-replacer"
import { cn } from "@/lib/utils"
import { CommentEditor } from "@/components/comments/comment-editor"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Reply, SmilePlus, Trash2, MoreHorizontal } from "lucide-react"

interface EditorialDiscussionsProps {
  articleId: string
  className?: string
  emptyStateMessage?: string
  onCountChange?: (count: number) => void
}

interface DeleteState {
  open: boolean
  target: EditorialDiscussion | null
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
}

function generateDiscussionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return String(Date.now())
}

interface DiscussionNode {
  id: string
  discussion: EditorialDiscussion
  depth: number
  children: DiscussionNode[]
}

function buildDiscussionTree(discussions: EditorialDiscussion[]): DiscussionNode[] {
  const map = new Map<string, DiscussionNode>()
  const roots: DiscussionNode[] = []

  // First pass: create all nodes
  discussions.forEach((discussion) => {
    const node: DiscussionNode = {
      id: discussion.id,
      discussion,
      depth: 0,
      children: [],
    }
    map.set(discussion.id, node)
  })

  // Second pass: build tree structure
  discussions.forEach((discussion) => {
    const node = map.get(discussion.id)!
    if (discussion.parentDiscussionId) {
      const parent = map.get(discussion.parentDiscussionId)
      if (parent) {
        node.depth = parent.depth + 1
        parent.children.push(node)
        return
      }
    }
    roots.push(node)
  })

  // Sort roots by creation time
  roots.sort((a, b) => 
    new Date(a.discussion.createdAt).getTime() - new Date(b.discussion.createdAt).getTime()
  )

  // Recursively sort children
  function sortChildren(node: DiscussionNode) {
    node.children.sort((a, b) => 
      new Date(a.discussion.createdAt).getTime() - new Date(b.discussion.createdAt).getTime()
    )
    node.children.forEach(sortChildren)
  }
  roots.forEach(sortChildren)

  return roots
}

export function EditorialDiscussions({
  articleId,
  className,
  emptyStateMessage = "No editorial discussions yet. Start a discussion about this article.",
  onCountChange,
}: EditorialDiscussionsProps) {
  const { user: currentUser } = useAuth()
  const [discussions, setDiscussions] = useState<EditorialDiscussion[]>(() =>
    getEditorialDiscussionsByArticleId(articleId)
  )
  const [users, setUsers] = useState<User[]>(() => getUsers())
  const [discussionDraft, setDiscussionDraft] = useState("")
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState("")
  const [editTargetId, setEditTargetId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [deleteState, setDeleteState] = useState<DeleteState>({ open: false, target: null })

  const loadDiscussions = useCallback(() => {
    setDiscussions(getEditorialDiscussionsByArticleId(articleId))
  }, [articleId])

  const refreshUsers = useCallback(() => {
    setUsers(getUsers())
  }, [])

  useEffect(() => {
    loadDiscussions()
    refreshUsers()
  }, [loadDiscussions, refreshUsers])

  const usersById = useMemo(() => {
    const map = new Map<string, User>()
    users.forEach((user) => map.set(user.id, user))
    return map
  }, [users])

  const discussionTree = useMemo(() => buildDiscussionTree(discussions), [discussions])
  const totalDiscussions = discussions.length

  useEffect(() => {
    onCountChange?.(totalDiscussions)
  }, [onCountChange, totalDiscussions])

  const getUserReaction = useCallback(
    (discussion: EditorialDiscussion): ReactionType | null => {
      if (!currentUser || !discussion.reactions) return null
      for (const [type, userIds] of Object.entries(discussion.reactions)) {
        if (userIds.includes(currentUser.id)) {
          return type as ReactionType
        }
      }
      return null
    },
    [currentUser],
  )

  const getTotalReactions = useCallback((discussion: EditorialDiscussion): number => {
    if (!discussion.reactions) return 0
    return Object.values(discussion.reactions).reduce((sum, arr) => sum + arr.length, 0)
  }, [])

  const ensureAuthenticated = (action: string) => {
    if (!currentUser) {
      window.alert(`You need to be logged in to ${action}.`)
      return false
    }
    return true
  }

  const handleCreateDiscussion = () => {
    if (!ensureAuthenticated("start a discussion")) return
    if (!discussionDraft.trim()) return
    const processedContent = replaceEmoticons(discussionDraft.trim())
    const now = new Date().toISOString()
    const newDiscussion: EditorialDiscussion = {
      id: generateDiscussionId(),
      articleId,
      articleType: "blog",
      userId: currentUser!.id,
      content: processedContent,
      createdAt: now,
      format: "markdown",
      reactions: DEFAULT_REACTIONS,
    }

    addEditorialDiscussion(newDiscussion)
    setDiscussionDraft("")
    loadDiscussions()
  }

  const handleStartReply = (discussion: EditorialDiscussion) => {
    if (!ensureAuthenticated("reply")) return
    setEditTargetId(null)
    setReplyTargetId(discussion.id)
    const author = usersById.get(discussion.userId)
    if (author?.username) {
      setReplyDraft(`@${author.username} `)
    } else {
      setReplyDraft("")
    }
  }

  const handleSubmitReply = () => {
    if (!ensureAuthenticated("reply")) return
    if (!replyTargetId || !replyDraft.trim()) return
    const processedContent = replaceEmoticons(replyDraft.trim())
    const now = new Date().toISOString()
    const replyDiscussion: EditorialDiscussion = {
      id: generateDiscussionId(),
      articleId,
      articleType: "blog",
      userId: currentUser!.id,
      content: processedContent,
      createdAt: now,
      parentDiscussionId: replyTargetId,
      format: "markdown",
      reactions: DEFAULT_REACTIONS,
    }

    addEditorialDiscussion(replyDiscussion)
    setReplyTargetId(null)
    setReplyDraft("")
    loadDiscussions()
  }

  const handleCancelReply = () => {
    setReplyTargetId(null)
    setReplyDraft("")
  }

  const handleStartEdit = (discussion: EditorialDiscussion) => {
    if (!ensureAuthenticated("edit this discussion")) return
    if (discussion.userId !== currentUser!.id) return
    setReplyTargetId(null)
    setEditTargetId(discussion.id)
    setEditDraft(discussion.content)
  }

  const handleSaveEdit = () => {
    if (!editTargetId || !editDraft.trim()) return
    if (!ensureAuthenticated("save changes")) return
    const target = discussions.find((d) => d.id === editTargetId)
    if (!target || target.userId !== currentUser!.id) return

    const processedContent = replaceEmoticons(editDraft.trim())
    updateEditorialDiscussion(editTargetId, processedContent, {
      editorId: currentUser!.id,
      format: "markdown",
    })
    setEditTargetId(null)
    setEditDraft("")
    loadDiscussions()
  }

  const handleCancelEdit = () => {
    setEditTargetId(null)
    setEditDraft("")
  }

  const handleToggleReaction = (discussionId: string, reactionType: ReactionType) => {
    if (!ensureAuthenticated("react to discussions")) return
    toggleEditorialDiscussionReaction(discussionId, currentUser!.id, reactionType)
    loadDiscussions()
  }

  const handleDelete = (discussion: EditorialDiscussion) => {
    if (!ensureAuthenticated("delete discussions")) return
    if (discussion.userId !== currentUser!.id) return
    setDeleteState({ open: true, target: discussion })
  }

  const confirmDelete = () => {
    if (!deleteState.target || !currentUser) return
    if (deleteState.target.userId !== currentUser.id) return
    deleteEditorialDiscussion(deleteState.target.id)
    setDeleteState({ open: false, target: null })
    loadDiscussions()
  }

  const renderDiscussionNode = (node: DiscussionNode) => (
    <DiscussionCard
      key={node.id}
      node={node}
      depth={node.depth}
      usersById={usersById}
      currentUser={currentUser}
      onStartReply={() => handleStartReply(node.discussion)}
      onCancelReply={handleCancelReply}
      onSubmitReply={handleSubmitReply}
      replyDraft={replyTargetId === node.id ? replyDraft : ""}
      setReplyDraft={setReplyDraft}
      isReplying={replyTargetId === node.id}
      onStartEdit={() => handleStartEdit(node.discussion)}
      onCancelEdit={handleCancelEdit}
      onSaveEdit={handleSaveEdit}
      editDraft={editTargetId === node.id ? editDraft : ""}
      setEditDraft={setEditDraft}
      isEditing={editTargetId === node.id}
      onDelete={() => handleDelete(node.discussion)}
      onToggleReaction={(reaction) => handleToggleReaction(node.id, reaction)}
      getUserReaction={() => getUserReaction(node.discussion)}
      getTotalReactions={() => getTotalReactions(node.discussion)}
    >
      {node.children.map((child) => renderDiscussionNode(child))}
    </DiscussionCard>
  )

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Editorial Discussion</h3>
          <Badge variant="secondary">
            {totalDiscussions} {totalDiscussions === 1 ? "Discussion" : "Discussions"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SmilePlus className="h-4 w-4" />
          <span>Format with Markdown · Press ⌘/Ctrl + Enter to submit</span>
        </div>
      </div>

      {currentUser ? (
        <CommentEditor
          value={discussionDraft}
          onChange={setDiscussionDraft}
          onSubmit={handleCreateDiscussion}
          submitLabel="Start discussion"
          placeholder="Share your editorial thoughts about this article..."
          autoFocus={false}
        />
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <p>Sign in to participate in editorial discussions.</p>
        </div>
      )}

      <div className="space-y-4">
        {discussionTree.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            {emptyStateMessage}
          </div>
        ) : (
          discussionTree.map((node) => renderDiscussionNode(node))
        )}
      </div>

      <AlertDialog open={deleteState.open} onOpenChange={(open) => setDeleteState((state) => ({ ...state, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete discussion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the discussion and its entire reply thread. This action cannot be undone.
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

interface DiscussionCardProps {
  node: DiscussionNode
  depth: number
  usersById: Map<string, User>
  currentUser: User | null
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
  children: React.ReactNode
}

function DiscussionCard({
  node,
  depth,
  usersById,
  currentUser,
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
  onDelete,
  onToggleReaction,
  getUserReaction,
  getTotalReactions,
  children,
}: DiscussionCardProps) {
  const author = usersById.get(node.discussion.userId)
  const isOwner = currentUser?.id === node.discussion.userId
  const reaction = getUserReaction()
  const totalReactions = getTotalReactions()
  const canEdit = isOwner
  const canDelete = isOwner

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        depth > 0 ? "border-l-4 border-l-primary/30" : "",
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
                <span className="text-xs text-muted-foreground">{formatCommentDate(node.discussion.createdAt)}</span>
                {node.discussion.updatedAt && <span className="text-xs text-muted-foreground italic">(edited)</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {isOwner && <Badge variant="outline">You</Badge>}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="prose prose-sm max-w-none text-foreground">
            {isEditing ? (
              <CommentEditor
                value={editDraft}
                onChange={setEditDraft}
                onSubmit={onSaveEdit}
                onCancel={onCancelEdit}
                submitLabel="Save changes"
                autoFocus
                minRows={4}
              />
            ) : (
              <ReactMarkdown>{node.discussion.content}</ReactMarkdown>
            )}
          </div>

          {!isEditing && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {currentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                      <SmilePlus className="h-3.5 w-3.5" />
                      {totalReactions > 0 ? (
                        <span className="font-medium">{totalReactions}</span>
                      ) : (
                        <span>React</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((reactionType) => {
                      const count = node.discussion.reactions?.[reactionType]?.length ?? 0
                      const active = reaction === reactionType
                      return (
                        <DropdownMenuItem
                          key={reactionType}
                          onClick={() => onToggleReaction(reactionType)}
                          className={cn(active ? "bg-primary/10 font-medium" : "")}
                        >
                          <span className="mr-2 text-lg">{REACTION_EMOJIS[reactionType]}</span>
                          <span className="capitalize flex-1">{reactionType}</span>
                          {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onStartReply}>
                <Reply className="h-3.5 w-3.5" />
                Reply
              </Button>

              {reaction && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
                  {REACTION_EMOJIS[reaction]}
                  <span className="text-[11px] font-medium">You reacted</span>
                </span>
              )}
            </div>
          )}

          {isReplying && (
            <div className="border-l border-dashed pl-4">
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
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}

