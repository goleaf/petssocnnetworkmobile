"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoryReplyInputProps {
  storyId: string
  userId: string
  creatorUsername: string
  onSend: (text: string) => void
  onClose: () => void
  isOpen: boolean
}

export function StoryReplyInput({
  storyId,
  userId,
  creatorUsername,
  onSend,
  onClose,
  isOpen,
}: StoryReplyInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || isSending) return

    setIsSending(true)
    try {
      await onSend(message.trim())
      setMessage("")
      
      // Show success briefly then close
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end">
      {/* Backdrop - click to close */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />

      {/* Reply input panel */}
      <div className="relative w-full bg-background rounded-t-3xl p-4 shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold">
              Reply to {creatorUsername}
            </div>
            <div className="text-xs text-muted-foreground">
              Your reply will be sent as a message
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Send a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            maxLength={500}
            className="flex-1"
            autoFocus
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-2 text-right">
          {message.length}/500
        </div>
      </div>
    </div>
  )
}
