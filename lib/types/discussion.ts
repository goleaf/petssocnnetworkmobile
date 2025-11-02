/**
 * Discussion & Collaboration Types
 * 
 * Types for talk pages, threaded comments, mentions, polls, RFCs, and watchlists
 */

export interface TalkPage {
  id: string
  articleId: string
  articleType: string // "breed", "health", "place", "product", etc.
  articleSlug: string
  title: string
  createdAt: string
  updatedAt: string
  threadCount: number
  commentCount: number
}

export interface CommentThread {
  id: string
  talkPageId: string
  title?: string
  authorId: string
  content: string
  createdAt: string
  updatedAt?: string
  parentThreadId?: string // For nested threads
  replies: CommentThread[]
  reactions?: Record<string, string[]> // User IDs by reaction type
  mentions?: Mention[]
  isLocked?: boolean
  isPinned?: boolean
  isResolved?: boolean
  resolvedBy?: string
  resolvedAt?: string
}

export interface Mention {
  id: string
  userId: string
  username: string
  startIndex: number
  endIndex: number
  notified: boolean
  notifiedAt?: string
}

export interface DiscussionPoll {
  id: string
  talkPageId?: string
  threadId?: string
  title: string
  description?: string
  options: PollOption[]
  authorId: string
  allowMultiple: boolean
  isClosed: boolean
  createdAt: string
  expiresAt?: string
  totalVotes: number
  votes: PollVote[]
}

export interface PollOption {
  id: string
  text: string
  voteCount: number
}

export interface PollVote {
  id: string
  pollId: string
  userId: string
  optionIds: string[]
  votedAt: string
}

export type RFCStatus = "draft" | "open" | "closed" | "implemented" | "rejected"

export interface RFC {
  id: string
  title: string
  summary: string
  motivation: string
  detailedDesign: string
  alternatives?: string
  openQuestions?: string[]
  status: RFCStatus
  authorId: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  implementedAt?: string
  comments: RFCComment[]
  votes?: Record<string, "support" | "oppose" | "abstain">
  relatedArticleIds?: string[]
  tags?: string[]
}

export interface RFCComment {
  id: string
  rfcId: string
  authorId: string
  content: string
  createdAt: string
  updatedAt?: string
  parentCommentId?: string
  mentions?: Mention[]
}

export interface WatchEntry {
  id: string
  userId: string
  articleId: string
  articleType: string
  watchedAt: string
  lastNotifiedAt?: string
  notificationPreferences: {
    onEdit: boolean
    onComment: boolean
    onNewThread: boolean
    digestFrequency: "real-time" | "daily" | "weekly"
  }
}

export interface DiffNotification {
  id: string
  watchEntryId: string
  userId: string
  articleId: string
  articleType: string
  changeType: "edit" | "comment" | "new_thread" | "poll_created" | "rfc_created"
  title: string
  description: string
  diffData?: {
    oldContent?: string
    newContent?: string
    changesSummary?: string
  }
  read: boolean
  createdAt: string
  actionUrl?: string
}

