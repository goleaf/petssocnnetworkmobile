"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { PostMediaDisplay } from "./PostMediaDisplay"
import { PostInteractionBar } from "./PostInteractionBar"
import { PostActionsMenu } from "./PostActionsMenu"
import { PollPost, PollData } from "./PollPost"
import { QuestionPost, QuestionData } from "./QuestionPost"
import { EventPost, EventData } from "./EventPost"
import { MarketplacePost, MarketplaceData } from "./MarketplacePost"
import { SharedPost, SharedPostData } from "./SharedPost"
import { cn } from "@/lib/utils"

export interface PostCardData {
  id: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  authorAvatar?: string
  postType?: "standard" | "poll" | "question" | "event" | "marketplace" | "shared"
  content: string
  media?: Array<{
    id: string
    type: "photo" | "video"
    url: string
    thumbnail?: string
  }>
  petTags?: Array<{
    id: string
    name: string
  }>
  createdAt: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  savesCount: number
  viewsCount: number
  isLiked?: boolean
  isSaved?: boolean
  // Special post type data
  pollData?: PollData
  questionData?: QuestionData
  eventData?: EventData
  marketplaceData?: MarketplaceData
  sharedPost?: SharedPostData
  shareComment?: string
}

interface PostCardProps {
  post: PostCardData
  currentUserId?: string
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onSave?: (postId: string) => void
  onReport?: (postId: string) => void
  onHide?: (postId: string) => void
  onPollVote?: (postId: string, optionIds: string[]) => Promise<void>
  onEventRsvp?: (postId: string, status: "going" | "interested" | "cant_go") => Promise<void>
  onMarkAsSold?: (postId: string) => Promise<void>
  onContactSeller?: (postId: string) => void
  onViewAnswers?: (postId: string) => void
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onReport,
  onHide,
  onPollVote,
  onEventRsvp,
  onMarkAsSold,
  onContactSeller,
  onViewAnswers,
}: PostCardProps) {
  const [showFullContent, setShowFullContent] = useState(false)

  // Check if content needs truncation (280 chars or 4 lines)
  const needsTruncation = post.content.length > 280 || post.content.split("\n").length > 4
  const displayContent = needsTruncation && !showFullContent
    ? post.content.slice(0, 280) + "..."
    : post.content

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })

  // Get initials for avatar fallback
  const initials = post.authorDisplayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isOwner = currentUserId === post.authorId

  return (
    <article className="border-b bg-card p-4 hover:bg-accent/5 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/user/${post.authorUsername}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.authorAvatar} alt={post.authorDisplayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/user/${post.authorUsername}`}
              className="font-semibold hover:underline truncate"
            >
              {post.authorDisplayName}
            </Link>
            <span className="text-muted-foreground text-sm">@{post.authorUsername}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <time className="text-muted-foreground text-sm" dateTime={post.createdAt}>
              {timeAgo}
            </time>
          </div>

          {/* Pet Tags */}
          {post.petTags && post.petTags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {post.petTags.map((pet) => (
                <Badge key={pet.id} variant="secondary" className="text-xs">
                  {pet.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <PostActionsMenu
          postId={post.id}
          onReport={onReport}
          onHide={onHide}
          onSave={onSave}
          isSaved={post.isSaved}
        />
      </div>

      {/* Content */}
      {post.postType === "shared" && post.sharedPost ? (
        <SharedPost
          originalPost={post.sharedPost}
          shareComment={post.shareComment}
          className="mb-3"
        />
      ) : (
        <>
          <div className="mb-3">
            <p className="whitespace-pre-wrap break-words">
              {displayContent}
            </p>
            {needsTruncation && !showFullContent && (
              <button
                onClick={() => setShowFullContent(true)}
                className="text-primary text-sm font-medium hover:underline mt-1"
              >
                Read more
              </button>
            )}
          </div>

          {/* Media */}
          {post.media && post.media.length > 0 && (
            <PostMediaDisplay media={post.media} />
          )}
        </>
      )}

      {/* Special Post Types */}
      {post.postType === "poll" && post.pollData && (
        <div className="mb-3">
          <PollPost
            postId={post.id}
            poll={post.pollData}
            onVote={onPollVote}
          />
        </div>
      )}

      {post.postType === "question" && post.questionData && (
        <div className="mb-3">
          <QuestionPost
            postId={post.id}
            question={post.questionData}
            commentsCount={post.commentsCount}
            onViewAnswers={onViewAnswers}
          />
        </div>
      )}

      {post.postType === "event" && post.eventData && (
        <div className="mb-3">
          <EventPost
            postId={post.id}
            event={post.eventData}
            onRsvp={onEventRsvp}
          />
        </div>
      )}

      {post.postType === "marketplace" && post.marketplaceData && (
        <div className="mb-3">
          <MarketplacePost
            postId={post.id}
            marketplace={post.marketplaceData}
            onMarkAsSold={onMarkAsSold}
            onContact={onContactSeller}
            isOwner={isOwner}
          />
        </div>
      )}

      {/* Interaction Bar */}
      <PostInteractionBar
        postId={post.id}
        likesCount={post.likesCount}
        commentsCount={post.commentsCount}
        sharesCount={post.sharesCount}
        savesCount={post.savesCount}
        viewsCount={post.viewsCount}
        isLiked={post.isLiked}
        isSaved={post.isSaved}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onSave={onSave}
      />
    </article>
  )
}
