"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Heart, MessageCircle, Share2, Bookmark, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BlogPost, ReactionType, User } from "@/lib/types"
import { getCommentsByPostId, isPostSaved, togglePostReaction, toggleSavedPost, ensureDefaultSavedCollection, addPostToSavedCollection } from "@/lib/storage"
import { getPostAnalytics } from "@/lib/utils/post-analytics"
import { hapticImpact } from "@/lib/utils/haptics"
import { PostShareDialog } from "@/components/post-share-dialog"
import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PostInteractionBarProps {
  post: BlogPost
  currentUser: User
  className?: string
  onRefresh?: () => void
  onOpenComments?: () => void
}

export function PostInteractionBar({ post, currentUser, className, onRefresh, onOpenComments }: PostInteractionBarProps) {
  const baseLikeCount = useMemo(() => (post.reactions?.like?.length ?? post.likes?.length ?? 0), [post.reactions, post.likes])
  const baseUserLiked = useMemo(() => Boolean(post.reactions?.like?.includes(currentUser.id) || post.likes?.includes(currentUser.id)), [post.reactions, post.likes, currentUser.id])
  const commentCount = useMemo(() => getCommentsByPostId(post.id).length, [post.id])
  const [shareOpen, setShareOpen] = useState(false)
  const [saved, setSaved] = useState<boolean>(() => isPostSaved(currentUser.id, post.id))
  const views = useMemo(() => {
    const analytics = getPostAnalytics(post.id, 30)
    return analytics?.totalViews ?? 0
  }, [post.id])

  const [liking, setLiking] = useState(false)
  const [saving, setSaving] = useState(false)
  // Reaction state
  const allReactions = post.reactions || { like: post.likes || [], love: [], laugh: [], wow: [], sad: [], angry: [], paw: [] }
  const reactionOrder: ReactionType[] = ["love", "laugh", "wow", "sad", "angry", "paw"]
  const reactionEmoji: Record<ReactionType, string> = {
    like: "❤️",
    love: "❤️",
    laugh: "😄",
    wow: "😮",
    sad: "😢",
    angry: "😠",
    paw: "🐾",
  }
  const getUserReaction = (): ReactionType | null => {
    const keys: ReactionType[] = ["like", "love", "laugh", "wow", "sad", "angry", "paw"]
    for (const k of keys) {
      if ((allReactions as any)[k]?.includes(currentUser.id)) return k
    }
    return null
  }
  const reactionCounts = {
    like: allReactions.like?.length || 0,
    love: allReactions.love?.length || 0,
    laugh: allReactions.laugh?.length || 0,
    wow: allReactions.wow?.length || 0,
    sad: allReactions.sad?.length || 0,
    angry: allReactions.angry?.length || 0,
    paw: allReactions.paw?.length || 0,
  }
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0)
  const userReaction = getUserReaction()
  const liked = Boolean(userReaction)
  const [likes, setLikes] = useState<number>(totalReactions)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pressTimer, setPressTimer] = useState<number | null>(null)
  const [longPressActivated, setLongPressActivated] = useState(false)

  const toggleLike = async () => {
    if (liking) return
    setLiking(true)
    try {
      if (!userReaction) {
        setLikes((prev) => prev + 1)
        // Default reaction on tap is "love"
        togglePostReaction(post.id, currentUser.id, "love")
      } else {
        // Remove current reaction regardless of type
        togglePostReaction(post.id, currentUser.id, userReaction)
        setLikes((prev) => Math.max(0, prev - 1))
      }
      onRefresh?.()
      await hapticImpact("medium")
    } finally {
      setTimeout(() => setLiking(false), 160)
    }
  }

  const setReaction = async (type: ReactionType) => {
    if (liking) return
    setLiking(true)
    try {
      // If selecting same reaction, toggle off
      if (userReaction === type) {
        togglePostReaction(post.id, currentUser.id, type)
        setLikes((prev) => Math.max(0, prev - 1))
      } else {
        const adding = !userReaction
        togglePostReaction(post.id, currentUser.id, type)
        setLikes((prev) => (adding ? prev + 1 : prev))
      }
      setPickerOpen(false)
      onRefresh?.()
      await hapticImpact("light")
    } finally {
      setTimeout(() => setLiking(false), 120)
    }
  }

  const startLongPress = () => {
    if (pressTimer) return
    const id = window.setTimeout(() => {
      setLongPressActivated(true)
      setPickerOpen(true)
    }, 350)
    setPressTimer(id as unknown as number)
  }
  const clearLongPress = () => {
    if (pressTimer) {
      clearTimeout(pressTimer as unknown as number)
      setPressTimer(null)
    }
  }

  const toggleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const result = toggleSavedPost(currentUser.id, post.id)
      setSaved(result.isSaved)
      if (result.isSaved) {
        try {
          const col = ensureDefaultSavedCollection(currentUser.id)
          addPostToSavedCollection(currentUser.id, col.id, post.id)
        } catch {}
      }
      onRefresh?.()
      await hapticImpact("light")
    } finally {
      setTimeout(() => setSaving(false), 120)
    }
  }

  return (
    <div className={cn("flex items-center justify-between pt-3 border-t", className)}>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-9 transition-all active:scale-95",
                  liked && "text-red-500 bg-red-500/10 hover:bg-red-500/20",
                )}
                onClick={() => {
                  if (longPressActivated) return
                  void toggleLike()
                }}
                onMouseDown={startLongPress}
                onMouseUp={clearLongPress}
                onMouseLeave={clearLongPress}
                onTouchStart={startLongPress}
                onTouchEnd={clearLongPress}
                aria-pressed={liked}
              >
                <span className="relative mr-2 inline-flex">
                  {userReaction ? (
                    <span className="h-4 w-4 text-lg leading-4">
                      {reactionEmoji[userReaction] || "❤️"}
                    </span>
                  ) : (
                    <>
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-all",
                          liked ? "text-red-500" : "text-foreground/70",
                        )}
                      />
                      <Heart
                        className={cn(
                          "h-4 w-4 absolute inset-0 transition-all duration-200",
                          liked ? "fill-red-500 text-red-500 scale-110" : "fill-transparent scale-100",
                        )}
                      />
                    </>
                  )}
                </span>
                <span className={cn("text-sm", liked ? "font-semibold" : "text-muted-foreground")}>{liked ? (likes > 1 ? `You and ${likes - 1} others` : 'You') : "Like"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="mb-1 font-medium">{userReaction ? (likes > 1 ? `You and ${likes - 1} others` : 'You') : `${likes} reactions`}</div>
                {(["love","laugh","wow","sad","angry","paw","like"] as ReactionType[]).map((rt) => {
                  const count = reactionCounts[rt] as number
                  if (!count) return null
                  const label = rt === 'laugh' ? 'Haha' : rt === 'like' ? 'Like' : rt.charAt(0).toUpperCase() + rt.slice(1)
                  return <div key={rt}>{reactionEmoji[rt] ?? ''} {label}: {count}</div>
                })}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover
          open={pickerOpen}
          onOpenChange={(v) => {
            setPickerOpen(v)
            if (!v) setLongPressActivated(false)
          }}
        >
          <PopoverTrigger asChild>
            <span className="sr-only" />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="px-2 py-1">
            <div className="flex gap-2">
              {reactionOrder.map((rt) => (
                <button
                  key={rt}
                  type="button"
                  className={cn("text-xl", userReaction === rt ? "scale-110" : "")}
                  onClick={() => setReaction(rt)}
                  aria-label={`React with ${rt}`}
                >
                  {reactionEmoji[rt]}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {onOpenComments ? (
          <Button variant="ghost" size="sm" className="h-9 transition-all active:scale-95" onClick={onOpenComments}>
            <MessageCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{commentCount > 0 ? commentCount : "Comment"}</span>
          </Button>
        ) : (
          <Link href={`/blog/${post.id}`}>
            <Button variant="ghost" size="sm" className="h-9 transition-all active:scale-95">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{commentCount > 0 ? commentCount : "Comment"}</span>
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-9 transition-all active:scale-95"
          onClick={async () => {
            setShareOpen(true)
            await hapticImpact("light")
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 transition-all active:scale-95",
            saved && "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20",
          )}
          onClick={toggleSave}
          aria-pressed={saved}
        >
          <Bookmark className={cn("h-4 w-4 mr-2", saved && "fill-current")}/>
          <span className="text-sm">{saved ? "Saved" : "Save"}</span>
        </Button>

        <div className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{views}</span>
        </div>
      </div>

      <PostShareDialog post={post} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  )
}
