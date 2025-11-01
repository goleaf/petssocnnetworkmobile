"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { BlogPost } from "@/lib/types"
import { getPetById, getUserById } from "@/lib/storage"
import { formatDate } from "@/lib/utils/date"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Share2, CheckCheck, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

type CopyState = "idle" | "link" | "embed"

interface PostShareDialogProps {
  post: BlogPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function copyText(value: string, onSuccess: () => void, onError: (error: unknown) => void) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(onSuccess).catch(onError)
    return
  }

  try {
    const textArea = document.createElement("textarea")
    textArea.value = value
    textArea.style.position = "fixed"
    textArea.style.opacity = "0"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)
    if (successful) {
      onSuccess()
      return
    }
  } catch (error) {
    onError(error)
    return
  }

  onError(new Error("Copy command not supported"))
}

export function PostShareDialog({ post, open, onOpenChange }: PostShareDialogProps) {
  const [origin, setOrigin] = useState("")
  const [copyState, setCopyState] = useState<CopyState>("idle")
  const [copyError, setCopyError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setCopyState("idle")
      setCopyError(null)
      return
    }
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [open])

  const pet = useMemo(() => {
    if (!post) return null
    return getPetById(post.petId) ?? null
  }, [post])

  const author = useMemo(() => {
    if (!post) return null
    return getUserById(post.authorId) ?? null
  }, [post])

  const postUrl = post ? `${origin || ""}/blog/${post.id}` : ""
  const embedUrl = post ? `${origin || ""}/embed/post/${post.id}` : ""
  const embedCode =
    post && embedUrl
      ? `<iframe src="${embedUrl}" title="Pet Social Network Post" loading="lazy" style="border:0;max-width:100%;" width="400" height="480" allowfullscreen></iframe>`
      : ""

  const handleCopy = (value: string, type: CopyState) => {
    setCopyError(null)
    if (!value) {
      setCopyError("Nothing to copy yet. The page may still be loading.")
      return
    }
    copyText(
      value,
      () => {
        setCopyState(type)
        window.setTimeout(() => setCopyState("idle"), 2000)
      },
      (error) => {
        console.error("Failed to copy text", error)
        setCopyError("Unable to copy to clipboard. Please copy manually.")
      }
    )
  }

  const handleNativeShare = async () => {
    if (!post || !postUrl) return
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 120),
          url: postUrl,
        })
      } catch (error) {
        console.error("Native share failed", error)
      }
    } else {
      handleCopy(postUrl, "link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
          <DialogDescription>Copy the link or embed code to share this post anywhere.</DialogDescription>
        </DialogHeader>

        {!post ? (
          <p className="text-sm text-muted-foreground">No post selected.</p>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={pet?.avatar || "/placeholder.svg"} alt={pet?.name} />
                      <AvatarFallback>{pet?.name?.charAt(0) || "P"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{pet?.name || "Unknown pet"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {author?.fullName || "Unknown author"} · {formatDate(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleNativeShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Native share
                  </Button>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1 line-clamp-2">{post.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                </div>
                {(post.tags?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div>
                  <Link href={`/blog/${post.id}`} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                    Open full post
                  </Link>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">Shareable link</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(postUrl, "link")}
                  className="flex items-center gap-2"
                >
                  {copyState === "link" ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </>
                  )}
                </Button>
              </div>
              <Input value={postUrl} readOnly className="text-sm" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">Embed code</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(embedCode, "embed")}
                  className={cn("flex items-center gap-2", copyState === "embed" && "bg-primary/10 text-primary")}
                >
                  {copyState === "embed" ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy embed
                    </>
                  )}
                </Button>
              </div>
              <Textarea value={embedCode} readOnly rows={3} className="text-xs font-mono" />
              <p className="text-xs text-muted-foreground">Paste this iframe snippet into any HTML page to embed the post.</p>
            </div>

            {copyError && <p className="text-xs text-destructive">{copyError}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
