"use client"

import { useEffect, useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { PostComposerModal } from "@/components/posts/PostComposerModal"

interface CreatePostButtonProps extends Omit<ButtonProps, "onClick"> {
  iconOnly?: boolean
  label?: string
}

export function CreatePostButton({ iconOnly, className, label = "Post", ...props }: CreatePostButtonProps) {
  const [open, setOpen] = useState(false)
  const [draftId, setDraftId] = useState<string | undefined>(undefined)

  // Open composer for a requested draft id via localStorage handoff
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = 'compose_draft_id'
    const pending = localStorage.getItem(key)
    if (pending) {
      setDraftId(pending)
      setOpen(true)
      localStorage.removeItem(key)
    }
  }, [])

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(className)}
        aria-label="Create post"
        {...props}
      >
        <Plus className={cn(iconOnly ? "h-5 w-5" : "h-4 w-4 mr-2")} />
        {!iconOnly && label}
      </Button>
      <PostComposerModal open={open} onOpenChange={setOpen} initialDraftId={draftId} />
    </>
  )
}

export default CreatePostButton
