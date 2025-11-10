"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Heart, MessageCircle, Share2, Bookmark, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostInteractionBarProps {
  postId: string
  likesCount: number
  commentsCount: number
  sharesCount: number
  savesCount: number
  viewsCount: number
  isLiked?: boolean
  isSaved?: boolean
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onSave?: (postId: string) => void
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

export function PostInteractionBar({
  postId,
  likesCount,
  commentsCount,
  sharesCount,
  savesCount,
  viewsCount,
  isLiked = false,
  isSaved = false,
  onLike,
  onComment,
  onShare,
  onSave,
}: PostInteractionBarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-1">
          {/* Like Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLike?.(postId)}
                className={cn(
                  "gap-1.5",
                  isLiked && "text-red-500 hover:text-red-600"
                )}
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    isLiked && "fill-current"
                  )}
                />
                {likesCount > 0 && (
                  <span className="text-sm">{formatCount(likesCount)}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{likesCount} {likesCount === 1 ? "like" : "likes"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Comment Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onComment?.(postId)}
                className="gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                {commentsCount > 0 && (
                  <span className="text-sm">{formatCount(commentsCount)}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{commentsCount} {commentsCount === 1 ? "comment" : "comments"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Share Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare?.(postId)}
                className="gap-1.5"
              >
                <Share2 className="h-4 w-4" />
                {sharesCount > 0 && (
                  <span className="text-sm">{formatCount(sharesCount)}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{sharesCount} {sharesCount === 1 ? "share" : "shares"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          {/* Views */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{formatCount(viewsCount)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{viewsCount} {viewsCount === 1 ? "view" : "views"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Bookmark Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSave?.(postId)}
                className={cn(
                  isSaved && "text-primary"
                )}
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4",
                    isSaved && "fill-current"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSaved ? "Saved" : "Save post"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
