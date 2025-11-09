"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  // Optional list of suggestions for caller UI; not used internally
  suggestions?: string[]
}

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [tags, setTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value) {
      const tagArray = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      setTags(tagArray)
    } else {
      setTags([])
    }
  }, [value])

  const updateValue = (newTags: string[]) => {
    setTags(newTags)
    onChange(newTags.join(", "))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      updateValue(tags.slice(0, -1))
    }
  }

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !tags.includes(trimmed)) {
      updateValue([...tags, trimmed])
      setInputValue("")
    } else if (trimmed && tags.includes(trimmed)) {
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateValue(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleBlur = () => {
    addTag()
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 px-3 py-2 min-h-[36px] border border-input rounded-md bg-white dark:bg-input/30 shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[1.5px] transition-[color,box-shadow] outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(tag)
            }}
            className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-base md:text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}
