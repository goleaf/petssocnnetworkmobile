/**
 * Discussion & Collaboration Storage Functions
 * 
 * Storage functions for talk pages, comments, polls, RFCs, and watchlists
 */

import type {
  TalkPage,
  CommentThread,
  DiscussionPoll,
  PollVote,
  RFC,
  RFCComment,
  WatchEntry,
  DiffNotification,
  Mention,
} from "./types/discussion"
import { generateStorageId, storageAdapter } from "./storage"

const STORAGE_KEYS = {
  TALK_PAGES: "pet_social_talk_pages",
  COMMENT_THREADS: "pet_social_comment_threads",
  DISCUSSION_POLLS: "pet_social_discussion_polls",
  POLL_VOTES: "pet_social_poll_votes",
  RFCS: "pet_social_rfcs",
  RFC_COMMENTS: "pet_social_rfc_comments",
  WATCH_ENTRIES: "pet_social_watch_entries",
  DIFF_NOTIFICATIONS: "pet_social_diff_notifications",
}

// Talk Pages
export function getTalkPages(): TalkPage[] {
  return storageAdapter.read<TalkPage[]>(STORAGE_KEYS.TALK_PAGES, [])
}

export function getTalkPageByArticleId(articleId: string): TalkPage | null {
  const pages = getTalkPages()
  return pages.find((p) => p.articleId === articleId) || null
}

export function getTalkPageById(id: string): TalkPage | null {
  const pages = getTalkPages()
  return pages.find((p) => p.id === id) || null
}

export function createTalkPage(params: {
  articleId: string
  articleType: string
  articleSlug: string
  title: string
}): TalkPage {
  const talkPage: TalkPage = {
    id: generateStorageId("talk"),
    articleId: params.articleId,
    articleType: params.articleType,
    articleSlug: params.articleSlug,
    title: params.title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    threadCount: 0,
    commentCount: 0,
  }

  const pages = getTalkPages()
  pages.push(talkPage)
  storageAdapter.write(STORAGE_KEYS.TALK_PAGES, pages)

  return talkPage
}

export function updateTalkPage(id: string, updates: Partial<TalkPage>): TalkPage | null {
  const pages = getTalkPages()
  const index = pages.findIndex((p) => p.id === id)
  if (index === -1) return null

  pages[index] = {
    ...pages[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  storageAdapter.write(STORAGE_KEYS.TALK_PAGES, pages)

  return pages[index]
}

// Comment Threads
export function getCommentThreads(): CommentThread[] {
  return storageAdapter.read<CommentThread[]>(STORAGE_KEYS.COMMENT_THREADS, [])
}

export function getCommentThreadsByTalkPageId(talkPageId: string): CommentThread[] {
  const threads = getCommentThreads()
  return threads.filter((t) => t.talkPageId === talkPageId && !t.parentThreadId)
}

export function getCommentThreadById(id: string): CommentThread | null {
  const threads = getCommentThreads()
  return threads.find((t) => t.id === id) || null
}

export function getRepliesToThread(threadId: string): CommentThread[] {
  const threads = getCommentThreads()
  return threads.filter((t) => t.parentThreadId === threadId)
}

export function createCommentThread(params: {
  talkPageId: string
  authorId: string
  content: string
  title?: string
  parentThreadId?: string
  mentions?: Mention[]
}): CommentThread {
  const thread: CommentThread = {
    id: generateStorageId("thread"),
    talkPageId: params.talkPageId,
    authorId: params.authorId,
    content: params.content,
    title: params.title,
    parentThreadId: params.parentThreadId,
    createdAt: new Date().toISOString(),
    replies: [],
    mentions: params.mentions || [],
  }

  const threads = getCommentThreads()
  threads.push(thread)
  storageAdapter.write(STORAGE_KEYS.COMMENT_THREADS, threads)

  // Update talk page counts
  const talkPage = getTalkPageById(params.talkPageId)
  if (talkPage) {
    if (!params.parentThreadId) {
      updateTalkPage(params.talkPageId, {
        threadCount: talkPage.threadCount + 1,
      })
    }
    updateTalkPage(params.talkPageId, {
      commentCount: talkPage.commentCount + 1,
    })
  }

  return thread
}

export function updateCommentThread(
  id: string,
  updates: Partial<CommentThread>
): CommentThread | null {
  const threads = getCommentThreads()
  const index = threads.findIndex((t) => t.id === id)
  if (index === -1) return null

  threads[index] = {
    ...threads[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  storageAdapter.write(STORAGE_KEYS.COMMENT_THREADS, threads)

  return threads[index]
}

export function deleteCommentThread(id: string): boolean {
  const threads = getCommentThreads()
  const index = threads.findIndex((t) => t.id === id)
  if (index === -1) return false

  threads.splice(index, 1)
  storageAdapter.write(STORAGE_KEYS.COMMENT_THREADS, threads)
  return true
}

// Discussion Polls
export function getDiscussionPolls(): DiscussionPoll[] {
  return storageAdapter.read<DiscussionPoll[]>(STORAGE_KEYS.DISCUSSION_POLLS, [])
}

export function getDiscussionPollById(id: string): DiscussionPoll | null {
  const polls = getDiscussionPolls()
  return polls.find((p) => p.id === id) || null
}

export function getPollsByTalkPageId(talkPageId: string): DiscussionPoll[] {
  const polls = getDiscussionPolls()
  return polls.filter((p) => p.talkPageId === talkPageId)
}

export function createDiscussionPoll(params: {
  talkPageId?: string
  threadId?: string
  title: string
  description?: string
  options: Omit<PollOption, "voteCount">[]
  authorId: string
  allowMultiple: boolean
  expiresAt?: string
}): DiscussionPoll {
  const poll: DiscussionPoll = {
    id: generateStorageId("poll"),
    talkPageId: params.talkPageId,
    threadId: params.threadId,
    title: params.title,
    description: params.description,
    options: params.options.map((opt) => ({
      ...opt,
      voteCount: 0,
    })),
    authorId: params.authorId,
    allowMultiple: params.allowMultiple,
    isClosed: false,
    createdAt: new Date().toISOString(),
    expiresAt: params.expiresAt,
    totalVotes: 0,
    votes: [],
  }

  const polls = getDiscussionPolls()
  polls.push(poll)
  storageAdapter.write(STORAGE_KEYS.DISCUSSION_POLLS, polls)

  return poll
}

export function voteOnPoll(
  pollId: string,
  userId: string,
  optionIds: string[]
): DiscussionPoll | null {
  const polls = getDiscussionPolls()
  const pollIndex = polls.findIndex((p) => p.id === pollId)
  if (pollIndex === -1) return null

  const poll = polls[pollIndex]

  // Check if user already voted
  const existingVote = poll.votes.find((v) => v.userId === userId)
  if (existingVote && !poll.allowMultiple) {
    return null // User already voted and multiple votes not allowed
  }

  // Remove existing vote if updating
  if (existingVote) {
    poll.votes = poll.votes.filter((v) => v.userId !== userId)
    // Decrement vote counts
    existingVote.optionIds.forEach((optId) => {
      const option = poll.options.find((o) => o.id === optId)
      if (option) option.voteCount--
    })
  }

  // Add new vote
  const vote: PollVote = {
    id: generateStorageId("vote"),
    pollId,
    userId,
    optionIds,
    votedAt: new Date().toISOString(),
  }
  poll.votes.push(vote)

  // Increment vote counts
  optionIds.forEach((optId) => {
    const option = poll.options.find((o) => o.id === optId)
    if (option) option.voteCount++
  })

  poll.totalVotes = poll.votes.length

  polls[pollIndex] = poll
  storageAdapter.write(STORAGE_KEYS.DISCUSSION_POLLS, polls)

  return poll
}

// RFCs
export function getRFCs(): RFC[] {
  return storageAdapter.read<RFC[]>(STORAGE_KEYS.RFCS, [])
}

export function getRFCById(id: string): RFC | null {
  const rfcs = getRFCs()
  return rfcs.find((r) => r.id === id) || null
}

export function createRFC(params: {
  title: string
  summary: string
  motivation: string
  detailedDesign: string
  alternatives?: string
  openQuestions?: string[]
  authorId: string
  relatedArticleIds?: string[]
  tags?: string[]
}): RFC {
  const rfc: RFC = {
    id: generateStorageId("rfc"),
    title: params.title,
    summary: params.summary,
    motivation: params.motivation,
    detailedDesign: params.detailedDesign,
    alternatives: params.alternatives,
    openQuestions: params.openQuestions || [],
    status: "draft",
    authorId: params.authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    relatedArticleIds: params.relatedArticleIds,
    tags: params.tags,
  }

  const rfcs = getRFCs()
  rfcs.push(rfc)
  storageAdapter.write(STORAGE_KEYS.RFCS, rfcs)

  return rfc
}

export function updateRFC(id: string, updates: Partial<RFC>): RFC | null {
  const rfcs = getRFCs()
  const index = rfcs.findIndex((r) => r.id === id)
  if (index === -1) return null

  rfcs[index] = {
    ...rfcs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  storageAdapter.write(STORAGE_KEYS.RFCS, rfcs)

  return rfcs[index]
}

export function addRFCComment(params: {
  rfcId: string
  authorId: string
  content: string
  parentCommentId?: string
  mentions?: Mention[]
}): RFCComment | null {
  const rfcs = getRFCs()
  const rfcIndex = rfcs.findIndex((r) => r.id === params.rfcId)
  if (rfcIndex === -1) return null

  const comment: RFCComment = {
    id: generateStorageId("rfc-comment"),
    rfcId: params.rfcId,
    authorId: params.authorId,
    content: params.content,
    createdAt: new Date().toISOString(),
    parentCommentId: params.parentCommentId,
    mentions: params.mentions || [],
  }

  rfcs[rfcIndex].comments.push(comment)
  storageAdapter.write(STORAGE_KEYS.RFCS, rfcs)

  return comment
}

// Watch Entries
export function getWatchEntries(): WatchEntry[] {
  return storageAdapter.read<WatchEntry[]>(STORAGE_KEYS.WATCH_ENTRIES, [])
}

export function getWatchEntriesByUserId(userId: string): WatchEntry[] {
  const entries = getWatchEntries()
  return entries.filter((e) => e.userId === userId)
}

export function getWatchEntryByUserAndArticle(
  userId: string,
  articleId: string
): WatchEntry | null {
  const entries = getWatchEntries()
  return entries.find((e) => e.userId === userId && e.articleId === articleId) || null
}

export function createWatchEntry(params: {
  userId: string
  articleId: string
  articleType: string
  notificationPreferences?: WatchEntry["notificationPreferences"]
}): WatchEntry {
  const entry: WatchEntry = {
    id: generateStorageId("watch"),
    userId: params.userId,
    articleId: params.articleId,
    articleType: params.articleType,
    watchedAt: new Date().toISOString(),
    notificationPreferences: params.notificationPreferences || {
      onEdit: true,
      onComment: true,
      onNewThread: true,
      digestFrequency: "real-time",
    },
  }

  const entries = getWatchEntries()
  entries.push(entry)
  storageAdapter.write(STORAGE_KEYS.WATCH_ENTRIES, entries)

  return entry
}

export function updateWatchEntry(
  id: string,
  updates: Partial<WatchEntry>
): WatchEntry | null {
  const entries = getWatchEntries()
  const index = entries.findIndex((e) => e.id === id)
  if (index === -1) return null

  entries[index] = { ...entries[index], ...updates }
  storageAdapter.write(STORAGE_KEYS.WATCH_ENTRIES, entries)

  return entries[index]
}

export function deleteWatchEntry(id: string): boolean {
  const entries = getWatchEntries()
  const index = entries.findIndex((e) => e.id === id)
  if (index === -1) return false

  entries.splice(index, 1)
  storageAdapter.write(STORAGE_KEYS.WATCH_ENTRIES, entries)
  return true
}

// Diff Notifications
export function getDiffNotifications(): DiffNotification[] {
  return storageAdapter.read<DiffNotification[]>(STORAGE_KEYS.DIFF_NOTIFICATIONS, [])
}

export function getDiffNotificationsByUserId(userId: string): DiffNotification[] {
  const notifications = getDiffNotifications()
  return notifications.filter((n) => n.userId === userId)
}

export function createDiffNotification(params: {
  watchEntryId: string
  userId: string
  articleId: string
  articleType: string
  changeType: DiffNotification["changeType"]
  title: string
  description: string
  diffData?: DiffNotification["diffData"]
  actionUrl?: string
}): DiffNotification {
  const notification: DiffNotification = {
    id: generateStorageId("diff-notif"),
    watchEntryId: params.watchEntryId,
    userId: params.userId,
    articleId: params.articleId,
    articleType: params.articleType,
    changeType: params.changeType,
    title: params.title,
    description: params.description,
    diffData: params.diffData,
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: params.actionUrl,
  }

  const notifications = getDiffNotifications()
  notifications.push(notification)
  storageAdapter.write(STORAGE_KEYS.DIFF_NOTIFICATIONS, notifications)

  // Update watch entry last notified time
  updateWatchEntry(params.watchEntryId, {
    lastNotifiedAt: notification.createdAt,
  })

  return notification
}

export function markDiffNotificationAsRead(id: string): DiffNotification | null {
  const notifications = getDiffNotifications()
  const index = notifications.findIndex((n) => n.id === id)
  if (index === -1) return null

  notifications[index].read = true
  storageAdapter.write(STORAGE_KEYS.DIFF_NOTIFICATIONS, notifications)

  return notifications[index]
}

