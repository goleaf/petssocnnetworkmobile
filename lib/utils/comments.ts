import type { Comment, CommentFlagReason, CommentStatus, User } from "@/lib/types"

export interface CommentNode extends Comment {
  children: CommentNode[]
  depth: number
}

type SortDirection = "asc" | "desc"

interface BuildTreeOptions {
  sortDirection?: SortDirection
}

export function buildCommentTree(comments: Comment[], options?: BuildTreeOptions): CommentNode[] {
  const sortDirection = options?.sortDirection ?? "asc"
  const nodes = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  comments.forEach((comment) => {
    nodes.set(comment.id, {
      ...comment,
      children: [],
      depth: 0,
    })
  })

  nodes.forEach((node) => {
    if (node.parentCommentId && nodes.has(node.parentCommentId)) {
      const parent = nodes.get(node.parentCommentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortFn = (a: CommentNode, b: CommentNode) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return sortDirection === "asc" ? diff : -diff
  }

  const sortTree = (branch: CommentNode[]) => {
    branch.sort(sortFn)
    branch.forEach((child) => sortTree(child.children))
  }

  sortTree(roots)
  return roots
}

export function canUserModerate(user: User | null | undefined): boolean {
  if (!user) return false
  return user.role === "admin" || user.role === "moderator"
}

export function canUserEditComment(comment: Comment, user: User | null | undefined): boolean {
  if (!user) return false
  return comment.userId === user.id || canUserModerate(user)
}

export function canUserDeleteComment(comment: Comment, user: User | null | undefined): boolean {
  if (!user) return false
  if (comment.userId === user.id) return true
  return canUserModerate(user)
}

export function isCommentHidden(comment: Comment): boolean {
  return comment.status === "hidden"
}

export function isCommentPending(comment: Comment): boolean {
  return comment.status === "pending"
}

export function hasActiveFlags(comment: Comment): boolean {
  return Boolean(comment.flags?.length)
}

export const COMMENT_FLAG_LABELS: Record<CommentFlagReason, string> = {
  spam: "Spam",
  abuse: "Abusive",
  "off-topic": "Off-topic",
  other: "Other",
}

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  published: "Published",
  pending: "Pending review",
  hidden: "Hidden",
}
