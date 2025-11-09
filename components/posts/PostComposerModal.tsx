"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PostComposer } from "@/components/posts/PostComposer"

interface PostComposerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDraftId?: string
}

export function PostComposerModal({ open, onOpenChange, initialDraftId }: PostComposerModalProps) {
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <>
      {/* Desktop modal */}
      <div className="hidden md:block">
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
            </DialogHeader>
            <PostComposer onSubmitted={handleClose} onCancel={handleClose} initialDraftId={initialDraftId} />
          </DialogContent>
        </Dialog>
      </div>
      {/* Mobile bottom sheet */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="rounded-t-xl p-4">
            <SheetHeader>
              <SheetTitle>Create Post</SheetTitle>
            </SheetHeader>
            <div className="p-2">
              <PostComposer onSubmitted={handleClose} onCancel={handleClose} initialDraftId={initialDraftId} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

export default PostComposerModal
