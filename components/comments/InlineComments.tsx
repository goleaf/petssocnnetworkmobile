"use client"

import { useMemo, useState } from "react"
import { getCommentsByPostId } from "@/lib/storage"
import type { Comment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { AdvancedComments } from "@/components/comments/advanced-comments"
import { formatDate } from "@/lib/utils/date"

export function InlineComments({ postId }: { postId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [sortMode, setSortMode] = useState<'top'|'newest'>('top')
  const comments = useMemo(() => getCommentsByPostId(postId), [postId])
  const total = comments.length
  const sorted = useMemo(() => {
    const list = [...comments]
    if (sortMode === 'newest') {
      return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list.sort((a,b) => ((b.reactions?.like?.length || 0) - (a.reactions?.like?.length || 0)) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }, [comments, sortMode])

  if (expanded) {
    return (
      <div className="mt-3">
        <AdvancedComments context={{ type: 'post', id: postId }} header={null} reactionsMode="simple" maxDepth={3} />
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      {sorted.slice(0, 3).map((c) => (
        <div key={c.id} className="text-sm">
          <div className="text-muted-foreground text-xs">{formatDate(c.createdAt)}</div>
          <div>{c.content}</div>
        </div>
      ))}
      {total > 3 && (
        <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>View all {total} comments</Button>
      )}
    </div>
  )
}

export default InlineComments

