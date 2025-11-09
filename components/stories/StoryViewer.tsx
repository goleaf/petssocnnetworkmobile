"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { getUsers, getActiveStoriesByUserId, markStoryViewed } from "@/lib/storage"
import type { Story } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useAuth } from "@/lib/auth"

interface StoryViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startUserId: string | null
}

export function StoryViewer({ open, onOpenChange, startUserId }: StoryViewerProps) {
  const { user } = useAuth()
  const [userIds, setUserIds] = useState<string[]>([])
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const timerRef = useRef<number | null>(null)

  const users = getUsers().filter((u) => userIds.includes(u.id))
  const stories = users[currentUserIndex]
    ? getActiveStoriesByUserId(users[currentUserIndex].id)
    : []

  useEffect(() => {
    if (!open) return
    // Build story user order starting with startUserId
    const all = getUsers()
    const ids = all.map((u) => u.id).filter((id) => getActiveStoriesByUserId(id).length > 0)
    const startIdx = startUserId ? ids.indexOf(startUserId) : 0
    const ordered = startIdx >= 0 ? [...ids.slice(startIdx), ...ids.slice(0, startIdx)] : ids
    setUserIds(ordered)
    setCurrentUserIndex(0)
    setCurrentStoryIndex(0)
  }, [open, startUserId])

  useEffect(() => {
    if (!open) return
    const s: Story | undefined = stories[currentStoryIndex]
    if (!s) return
    if (user) markStoryViewed(s.id, user.id)
    const duration = s.media[0]?.duration ? s.media[0]!.duration! * 1000 : 5000
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => next(), duration)
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [open, currentUserIndex, currentStoryIndex])

  const close = () => onOpenChange(false)
  const next = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1)
    } else if (currentUserIndex < userIds.length - 1) {
      setCurrentUserIndex((i) => i + 1)
      setCurrentStoryIndex(0)
    } else {
      close()
    }
  }
  const prev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => Math.max(0, i - 1))
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex((i) => Math.max(0, i - 1))
      const prevStories = getActiveStoriesByUserId(userIds[Math.max(0, currentUserIndex - 1)])
      setCurrentStoryIndex(Math.max(0, prevStories.length - 1))
    } else {
      // At beginning
      close()
    }
  }

  if (!open || users.length === 0 || stories.length === 0) return null
  const currentUser = users[currentUserIndex]
  const currentStory = stories[currentStoryIndex]
  const media = currentStory.media[0]

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={next}>
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" className="text-white" onClick={(e) => { e.stopPropagation(); close() }}>
          <X className="h-6 w-6" />
        </Button>
      </div>
      <div className="absolute top-0 left-0 right-0 p-2 flex gap-1">
        {stories.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 rounded bg-white/30 overflow-hidden">
            <div className="h-full bg-white transition-all" style={{ width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? '50%' : '0%' }} />
          </div>
        ))}
      </div>
      <div className="w-full max-w-[420px] aspect-[9/16] bg-black relative" onClick={(e) => e.stopPropagation()}>
        {media?.type === 'video' ? (
          <video src={media.url} className="w-full h-full object-contain" autoPlay muted playsInline />
        ) : (
          <img src={media?.url} alt="Story" className="w-full h-full object-contain" />
        )}
        {/* Text overlays */}
        {(currentStory.overlays || []).filter(o => o.type === 'text' && o.text).map((o) => (
          <div key={o.id} style={{ position:'absolute', left: `${(o.x ?? 0.1)*100}%`, top: `${(o.y ?? 0.1)*100}%`, transform:'translate(-50%,-50%)', color: o.color || '#fff', fontSize: (o.fontSize || 20)+'px', fontFamily: o.fontFamily || 'inherit' }}>
            {o.text}
          </div>
        ))}
        {/* Tap zones */}
        <button className="absolute left-0 top-0 bottom-0 w-1/3" onClick={prev} />
        <button className="absolute right-0 top-0 bottom-0 w-1/3" onClick={next} />
      </div>
    </div>
  )
}

export default StoryViewer

