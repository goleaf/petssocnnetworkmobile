"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuestionStickerData } from "./stickers/types"

interface InteractiveQuestionStickerProps {
  storyId: string
  userId: string
  questionData: QuestionStickerData
  onRespond: (text: string) => void
  position: { x: number; y: number }
  scale?: number
}

export function InteractiveQuestionSticker({
  storyId,
  userId,
  questionData,
  onRespond,
  position,
  scale = 1,
}: InteractiveQuestionStickerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [response, setResponse] = useState("")
  const [hasResponded, setHasResponded] = useState(false)

  const handleSubmit = () => {
    if (!response.trim()) return

    setHasResponded(true)
    onRespond(response.trim())
    setResponse("")
    
    // Close after a brief delay
    setTimeout(() => {
      setIsExpanded(false)
    }, 1000)
  }

  if (!isExpanded) {
    return (
      <button
        className="absolute bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-6 py-3 shadow-lg hover:scale-105 transition-transform"
        style={{
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
        onClick={() => setIsExpanded(true)}
      >
        <div className="text-sm font-semibold">{questionData.prompt}</div>
        <div className="text-xs opacity-90 mt-1">Tap to respond</div>
      </button>
    )
  }

  return (
    <div
      className="absolute bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg min-w-[280px] max-w-[320px]"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <div className="text-sm font-semibold mb-3 text-gray-900">
        {questionData.prompt}
      </div>

      {hasResponded ? (
        <div className="text-center py-4">
          <div className="text-green-600 font-semibold mb-1">Response sent!</div>
          <div className="text-xs text-gray-500">
            The creator will see your response
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Type your response..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            maxLength={200}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!response.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(false)}
        className="w-full mt-2 text-xs"
      >
        Cancel
      </Button>
    </div>
  )
}
