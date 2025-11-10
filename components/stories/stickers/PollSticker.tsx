"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus } from "lucide-react"
import type { PollStickerData } from "./types"

interface PollStickerProps {
  onSave: (data: PollStickerData) => void
  onCancel: () => void
}

export function PollSticker({ onSave, onCancel }: PollStickerProps) {
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSave = () => {
    if (!question.trim()) {
      alert("Please enter a question")
      return
    }

    const filledOptions = options.filter((opt) => opt.trim())
    if (filledOptions.length < 2) {
      alert("Please enter at least 2 options")
      return
    }

    const pollData: PollStickerData = {
      question: question.trim(),
      options: filledOptions.map((text, index) => ({
        id: `option-${index}`,
        text: text.trim(),
        votes: 0,
      })),
      totalVotes: 0,
    }

    onSave(pollData)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Create Poll</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Question */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Ask a question
          </label>
          <Input
            placeholder="What's your question?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={100}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {question.length}/100
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Answer options
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  maxLength={50}
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {options.length < 4 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="mt-2 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add option
            </Button>
          )}
        </div>
      </div>

      <div className="p-3 border-t">
        <Button onClick={handleSave} className="w-full">
          Add Poll
        </Button>
      </div>
    </div>
  )
}
