"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import type { QuestionStickerData } from "./types"

interface QuestionStickerProps {
  onSave: (data: QuestionStickerData) => void
  onCancel: () => void
}

export function QuestionSticker({ onSave, onCancel }: QuestionStickerProps) {
  const [prompt, setPrompt] = useState("")

  const handleSave = () => {
    if (!prompt.trim()) {
      alert("Please enter a question")
      return
    }

    const questionData: QuestionStickerData = {
      prompt: prompt.trim(),
      responses: [],
    }

    onSave(questionData)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Ask a Question</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Your question
          </label>
          <Input
            placeholder="Ask me anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {prompt.length}/100
          </div>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          Viewers can tap the sticker to send you a response
        </div>
      </div>

      <div className="p-3 border-t">
        <Button onClick={handleSave} className="w-full">
          Add Question
        </Button>
      </div>
    </div>
  )
}
