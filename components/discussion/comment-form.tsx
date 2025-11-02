"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseMentions, extractUsernames } from "@/lib/utils/mentions"
import { MentionAutocomplete } from "./mention-autocomplete"

interface CommentFormProps {
  onSubmit: (content: string, title?: string) => void
  onCancel?: () => void
  placeholder?: string
  allowTitle?: boolean
  initialContent?: string
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  allowTitle = false,
  initialContent = "",
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState("")
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    onSubmit(content.trim(), allowTitle ? title.trim() : undefined)
    setContent("")
    setTitle("")
  }

  const handleContentChange = (value: string) => {
    setContent(value)

    // Check for @mention trigger
    const cursorPos = value.length
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      const spaceIndex = textAfterAt.indexOf(" ")

      if (spaceIndex === -1 || spaceIndex > 0) {
        const query = spaceIndex === -1 ? textAfterAt : textAfterAt.substring(0, spaceIndex)
        setMentionQuery(query)
        setShowMentionAutocomplete(true)
      } else {
        setShowMentionAutocomplete(false)
      }
    } else {
      setShowMentionAutocomplete(false)
    }
  }

  const handleMentionSelect = (username: string) => {
    const cursorPos = content.length
    const textBeforeCursor = content.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")

    if (lastAtIndex !== -1) {
      const beforeMention = content.substring(0, lastAtIndex)
      const afterMention = content.substring(cursorPos)
      setContent(`${beforeMention}@${username} ${afterMention}`)
    }

    setShowMentionAutocomplete(false)
    setMentionQuery("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allowTitle && (
        <div>
          <Label htmlFor="thread-title">Thread Title (optional)</Label>
          <Input
            id="thread-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your thread a title..."
            className="mt-1"
          />
        </div>
      )}

      <div className="relative">
        <Label htmlFor="comment-content">Comment</Label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 min-h-[100px]"
          rows={5}
        />
        {showMentionAutocomplete && (
          <MentionAutocomplete
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentionAutocomplete(false)}
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!content.trim()}>
          Post
        </Button>
      </div>
    </form>
  )
}

