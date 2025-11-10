"use client"

import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { PostMediaDisplay } from "./PostMediaDisplay"
import { Repeat2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SharedPostData {
  id: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  authorAvatar?: string
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
}

interface SharedPostProps {
  originalPost: SharedPostData
  shareComment?: string
  className?: string
}

export function SharedPost({
  originalPost,
  shareComment,
  className,
}: SharedPostProps) {
  const timeAgo = formatDistanceToNow(new Date(originalPost.createdAt), {
    addSuffix: true,
  })

  const initials = originalPost.authorDisplayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn("space-y-3", className)}>
      {/* Share Comment (if any) */}
      {shareComment && (
        <div className="text-sm">
          <p className="whitespace-pre-wrap break-words">{shareComment}</p>
        </div>
      )}

      {/* Original Post (Embedded) */}
      <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
        {/* Shared Post Indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Repeat2 className="h-3 w-3" />
          <span>Shared post</span>
        </div>

        {/* Original Author Header */}
        <div className="flex items-start gap-3">
          <Link href={`/user/${originalPost.authorUsername}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={originalPost.authorAvatar}
                alt={originalPost.authorDisplayName}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/user/${originalPost.authorUsername}`}
                className="font-semibold hover:underline truncate text-sm"
              >
                {originalPost.authorDisplayName}
              </Link>
              <span className="text-muted-foreground text-xs">
                @{originalPost.authorUsername}
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <time
                className="text-muted-foreground text-xs"
                dateTime={originalPost.createdAt}
              >
                {timeAgo}
              </time>
            </div>

            {/* Pet Tags */}
            {originalPost.petTags && originalPost.petTags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {originalPost.petTags.map((pet) => (
                  <Badge key={pet.id} variant="secondary" className="text-xs">
                    {pet.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Original Content */}
        <div className="text-sm">
          <p className="whitespace-pre-wrap break-words line-clamp-4">
            {originalPost.content}
          </p>
        </div>

        {/* Original Media (if any) */}
        {originalPost.media && originalPost.media.length > 0 && (
          <PostMediaDisplay media={originalPost.media} compact />
        )}

        {/* Original Engagement Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span>{originalPost.likesCount} likes</span>
          <span>{originalPost.commentsCount} comments</span>
          <span>{originalPost.sharesCount} shares</span>
        </div>
      </div>
    </div>
  )
}
