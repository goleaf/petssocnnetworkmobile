"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Flag, EyeOff, Bookmark, Link as LinkIcon, Share } from "lucide-react"

interface PostActionsMenuProps {
  postId: string
  isSaved?: boolean
  onReport?: (postId: string) => void
  onHide?: (postId: string) => void
  onSave?: (postId: string) => void
}

export function PostActionsMenu({
  postId,
  isSaved = false,
  onReport,
  onHide,
  onSave,
}: PostActionsMenuProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/posts/${postId}`
    navigator.clipboard.writeText(url)
    // TODO: Show toast notification
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8"
          aria-label="Post actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onSave?.(postId)}>
          <Bookmark className="h-4 w-4" />
          {isSaved ? "Unsave post" : "Save post"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <LinkIcon className="h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onHide?.(postId)}>
          <EyeOff className="h-4 w-4" />
          Hide post
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReport?.(postId)}>
          <Flag className="h-4 w-4" />
          Report post
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
