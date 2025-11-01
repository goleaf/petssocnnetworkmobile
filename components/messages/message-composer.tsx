"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface MessageComposerProps {
  onSend: (content: string) => void
  onTyping?: () => void
  disabled?: boolean
}

export function MessageComposer({ onSend, onTyping, disabled }: MessageComposerProps) {
  const [value, setValue] = useState("")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue("")
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value)
    onTyping?.()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const trimmed = value.trim()
      if (!trimmed) return
      onSend(trimmed)
      setValue("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t bg-card/95 px-5 py-4">
      <div className="flex items-end gap-3">
        <Textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          rows={1}
          className="min-h-[48px] flex-1 resize-none text-sm"
          disabled={disabled}
        />
        <Button type="submit" size="icon" disabled={disabled || !value.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
