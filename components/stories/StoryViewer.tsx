"use client"

import { useEffect, useRef, useState } from "react"
import { getUsers, getActiveStoriesByUserId, markStoryViewed } from "@/lib/storage"
import type { Story } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { X, Heart, MessageCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { StoryReactions } from "./StoryReactions"
import { StoryReplyInput } from "./StoryReplyInput"
import { InteractivePollSticker } from "./InteractivePollSticker"
import { InteractiveQuestionSticker } from "./InteractiveQuestionSticker"
import { InteractiveQuizSticker } from "./InteractiveQuizSticker"
import { InteractiveCountdownSticker } from "./InteractiveCountdownSticker"

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
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set())
  const [showReactions, setShowReactions] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  
  const timerRef = useRef<number | null>(null)
  const progressIntervalRef = useRef<number | null>(null)
  const holdTimeoutRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const users = getUsers().filter((u) => userIds.includes(u.id))
  const stories = users[currentUserIndex]
    ? getActiveStoriesByUserId(users[currentUserIndex].id)
    : []

  // Check if current user is in close friends list
  const isCloseFriend = users[currentUserIndex]?.closeFriends?.includes(user?.id || "") || false

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
    setViewedStories(new Set())
  }, [open, startUserId])

  useEffect(() => {
    if (!open || isPaused) return
    
    const s: Story | undefined = stories[currentStoryIndex]
    if (!s) return
    
    // Mark story as viewed
    if (user) {
      markStoryViewed(s.id, user.id)
      setViewedStories(prev => new Set([...prev, s.id]))
    }
    
    const duration = s.media[0]?.duration ? s.media[0]!.duration! * 1000 : 5000
    const startTime = Date.now()
    
    // Clear existing timers
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current)
    
    // Reset progress
    setProgress(0)
    
    // Update progress bar
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      setProgress(newProgress)
    }, 50)
    
    // Auto-advance timer
    timerRef.current = window.setTimeout(() => next(), duration)
    
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current)
    }
  }, [open, currentUserIndex, currentStoryIndex, isPaused])

  // Pause/resume on hold
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pause on middle area (not tap zones)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    
    if (x > width * 0.33 && x < width * 0.67) {
      holdTimeoutRef.current = window.setTimeout(() => {
        setIsPaused(true)
        if (videoRef.current) {
          videoRef.current.pause()
        }
      }, 200) // 200ms hold to pause
    }
  }

  const handlePointerUp = () => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (isPaused) {
      setIsPaused(false)
      if (videoRef.current) {
        videoRef.current.play()
      }
    }
  }

  // Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    }

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y

    // Swipe up to open reply (vertical swipe with minimal horizontal movement)
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -100) {
      setShowReplyInput(true)
    }

    setTouchStart(null)
  }

  // Handle story interactions
  const handleReaction = async (reactionType: string) => {
    if (!user || !currentStory) return

    try {
      await fetch(`/api/stories/${currentStory.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType: 'reaction',
          data: { reactionType },
        }),
      })
    } catch (error) {
      console.error('Error recording reaction:', error)
    }
  }

  const handleReply = async (text: string) => {
    if (!user || !currentStory) return

    try {
      await fetch(`/api/stories/${currentStory.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType: 'reply',
          data: { text },
        }),
      })
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  const handlePollVote = async (optionId: string) => {
    if (!user || !currentStory) return

    try {
      await fetch(`/api/stories/${currentStory.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType: 'poll_vote',
          data: { optionId },
        }),
      })
    } catch (error) {
      console.error('Error recording poll vote:', error)
    }
  }

  const handleQuestionResponse = async (text: string) => {
    if (!user || !currentStory) return

    try {
      await fetch(`/api/stories/${currentStory.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType: 'question_response',
          data: { text },
        }),
      })
    } catch (error) {
      console.error('Error recording question response:', error)
    }
  }

  const handleQuizAnswer = async (optionId: string, isCorrect: boolean) => {
    if (!user || !currentStory) return

    try {
      await fetch(`/api/stories/${currentStory.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType: 'quiz_answer',
          data: { optionId, isCorrect },
        }),
      })
    } catch (error) {
      console.error('Error recording quiz answer:', error)
    }
  }

  const handleCountdownSubscribe = async () => {
    if (!user || !currentStory) return

    try {
      await fetch(`/api/stories/${currentStory.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          interactionType: 'countdown_subscription',
          data: {},
        }),
      })
    } catch (error) {
      console.error('Error subscribing to countdown:', error)
    }
  }

  const close = () => {
    onOpenChange(false)
    setIsPaused(false)
    setProgress(0)
  }

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
    }
  }

  if (!open || users.length === 0 || stories.length === 0) return null
  
  const currentUser = users[currentUserIndex]
  const currentStory = stories[currentStoryIndex]
  const media = currentStory.media[0]

  // Check if all stories for current user have been viewed
  const allStoriesViewed = stories.every(s => viewedStories.has(s.id) || s.viewers?.includes(user?.id || ""))

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/20" 
          onClick={close}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-10">
        {stories.map((story, idx) => {
          const isViewed = viewedStories.has(story.id) || story.viewers?.includes(user?.id || "")
          const isCurrent = idx === currentStoryIndex
          const progressWidth = isCurrent ? progress : (idx < currentStoryIndex || isViewed ? 100 : 0)
          
          return (
            <div key={idx} className="h-1 flex-1 rounded bg-white/30 overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-white transition-all",
                  isCurrent && !isPaused && "duration-50"
                )}
                style={{ width: `${progressWidth}%` }} 
              />
            </div>
          )
        })}
      </div>

      {/* User info header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {/* Story ring indicator */}
        <div className={cn(
          "w-10 h-10 rounded-full p-0.5",
          allStoriesViewed ? "bg-gray-400" : "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
        )}>
          <div className="w-full h-full rounded-full bg-black p-0.5">
            <img 
              src={currentUser?.avatar || "/placeholder-user.jpg"} 
              alt={currentUser?.username}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">
              {currentUser?.username}
            </span>
            {isCloseFriend && (
              <div className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                <Heart className="h-3 w-3 fill-current" />
                <span>Close Friends</span>
              </div>
            )}
          </div>
          <span className="text-white/70 text-xs">
            {new Date(currentStory.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>

      {/* Story content */}
      <div 
        className="w-full max-w-[420px] aspect-9/16 bg-black relative"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {media?.type === 'video' ? (
          <video 
            ref={videoRef}
            src={media.url} 
            className="w-full h-full object-contain" 
            autoPlay 
            muted 
            playsInline 
          />
        ) : (
          <img 
            src={media?.url} 
            alt="Story" 
            className="w-full h-full object-contain" 
          />
        )}

        {/* Pause indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 rounded-full p-4">
              <div className="flex gap-2">
                <div className="w-1 h-8 bg-white rounded" />
                <div className="w-1 h-8 bg-white rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Text overlays */}
        {(currentStory.overlays || [])
          .filter(o => o.type === 'text' && o.text)
          .map((o) => (
            <div 
              key={o.id} 
              style={{ 
                position: 'absolute', 
                left: `${(o.x ?? 0.5) * 100}%`, 
                top: `${(o.y ?? 0.5) * 100}%`, 
                transform: 'translate(-50%, -50%)', 
                color: o.color || '#fff', 
                fontSize: (o.fontSize || 24) + 'px', 
                fontFamily: o.fontFamily || 'inherit',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
              }}
            >
              {o.text}
            </div>
          ))}

        {/* Interactive stickers */}
        {user && (currentStory.overlays || [])
          .filter(o => o.type === 'poll')
          .map((o) => (
            <InteractivePollSticker
              key={o.id}
              storyId={currentStory.id}
              userId={user.id}
              pollData={o.data}
              onVote={handlePollVote}
              position={{ x: o.x ?? 0.5, y: o.y ?? 0.5 }}
              scale={o.scale ?? 1}
            />
          ))}

        {user && (currentStory.overlays || [])
          .filter(o => o.type === 'question')
          .map((o) => (
            <InteractiveQuestionSticker
              key={o.id}
              storyId={currentStory.id}
              userId={user.id}
              questionData={o.data}
              onRespond={handleQuestionResponse}
              position={{ x: o.x ?? 0.5, y: o.y ?? 0.5 }}
              scale={o.scale ?? 1}
            />
          ))}

        {user && (currentStory.overlays || [])
          .filter(o => o.type === 'quiz')
          .map((o) => (
            <InteractiveQuizSticker
              key={o.id}
              storyId={currentStory.id}
              userId={user.id}
              quizData={o.data}
              onAnswer={handleQuizAnswer}
              position={{ x: o.x ?? 0.5, y: o.y ?? 0.5 }}
              scale={o.scale ?? 1}
            />
          ))}

        {user && (currentStory.overlays || [])
          .filter(o => o.type === 'countdown')
          .map((o) => (
            <InteractiveCountdownSticker
              key={o.id}
              storyId={currentStory.id}
              userId={user.id}
              countdownData={o.data}
              onSubscribe={handleCountdownSubscribe}
              position={{ x: o.x ?? 0.5, y: o.y ?? 0.5 }}
              scale={o.scale ?? 1}
            />
          ))}

        {/* Tap zones for navigation */}
        <button 
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={prev}
          aria-label="Previous story"
        />
        <button 
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={next}
          aria-label="Next story"
        />
      </div>

      {/* Bottom interaction bar */}
      {user && (
        <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between gap-2 z-10">
          {/* Quick reactions */}
          {showReactions ? (
            <StoryReactions
              storyId={currentStory.id}
              userId={user.id}
              onReact={(type) => {
                handleReaction(type)
                setShowReactions(false)
              }}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setShowReactions(true)}
            >
              <Heart className="h-5 w-5" />
            </Button>
          )}

          {/* Reply button */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => setShowReplyInput(true)}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Reply input modal */}
      {user && (
        <StoryReplyInput
          storyId={currentStory.id}
          userId={user.id}
          creatorUsername={currentUser?.username || ''}
          onSend={handleReply}
          onClose={() => setShowReplyInput(false)}
          isOpen={showReplyInput}
        />
      )}
    </div>
  )
}

export default StoryViewer

