"use client"

import { Bell, ArrowUp } from "lucide-react"

interface NewPostsBannerProps {
  count: number
  onClick: () => void
}

export default function NewPostsBanner({ count, onClick }: NewPostsBannerProps) {
  if (count <= 0) return null
  return (
    <button
      onClick={onClick}
      className="sticky top-2 z-20 mx-auto mb-4 w-full max-w-[720px] rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary shadow-sm backdrop-blur supports-[backdrop-filter]:bg-primary/10 hover:bg-primary/15 focus:outline-none"
      aria-label="New posts available"
    >
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <Bell className="h-4 w-4" />
        <span>{count} New {count === 1 ? "Post" : "Posts"} Available</span>
        <ArrowUp className="h-4 w-4" />
      </div>
    </button>
  )
}

