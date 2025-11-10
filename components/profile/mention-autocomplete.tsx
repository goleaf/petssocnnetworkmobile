"use client"

import * as React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export interface MentionUser {
  id: string
  username: string
  fullName: string
  avatar?: string
}

interface MentionAutocompleteProps {
  /** The textarea or input element to attach to */
  textareaRef: React.RefObject<HTMLTextAreaElement>
  /** Current value of the textarea */
  value: string
  /** Callback when value changes (with mention inserted) */
  onChange: (value: string) => void
  /** Function to fetch users for mentions (followers/friends) */
  onSearchUsers: (query: string) => Promise<MentionUser[]>
  /** Optional className for the dropdown */
  className?: string
}

interface MentionState {
  isOpen: boolean
  query: string
  position: { top: number; left: number }
  cursorPosition: number
  mentionStartIndex: number
}

// Constants
const SEARCH_DEBOUNCE_MS = 150
const DROPDOWN_OFFSET_PX = 24

export function MentionAutocomplete({
  textareaRef,
  value,
  onChange,
  onSearchUsers,
  className,
}: MentionAutocompleteProps) {
  const [mentionState, setMentionState] = useState<MentionState>({
    isOpen: false,
    query: "",
    position: { top: 0, left: 0 },
    cursorPosition: 0,
    mentionStartIndex: -1,
  })
  const [users, setUsers] = useState<MentionUser[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Insert mention into textarea
  const insertMention = useCallback((user: MentionUser) => {
    const { mentionStartIndex, cursorPosition } = mentionState
    
    // Build the mention text
    const mentionText = `@${user.username}`
    
    // Replace from @ to cursor with the mention
    const before = value.substring(0, mentionStartIndex)
    const after = value.substring(cursorPosition)
    const newValue = before + mentionText + " " + after
    
    // Update the value
    onChange(newValue)
    
    // Close dropdown
    setMentionState((prev) => ({ ...prev, isOpen: false }))
    
    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + mentionText.length + 1
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        textareaRef.current.focus()
      }
    }, 0)
  }, [mentionState, value, onChange, textareaRef])

  // Detect @ symbol and trigger dropdown
  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart || 0
    const textBeforeCursor = value.substring(0, cursorPos)
    
    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@")
    
    // Check if we're in a mention context
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      
      // Only trigger if:
      // 1. @ is at start or preceded by whitespace
      // 2. No whitespace after @
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " "
      const isValidContext = /\s/.test(charBeforeAt) || lastAtIndex === 0
      const hasNoWhitespace = !/\s/.test(textAfterAt)
      
      if (isValidContext && hasNoWhitespace) {
        // Calculate dropdown position
        const coords = getCaretCoordinates(textarea, cursorPos)
        
        setMentionState({
          isOpen: true,
          query: textAfterAt,
          position: coords,
          cursorPosition: cursorPos,
          mentionStartIndex: lastAtIndex,
        })
        return
      }
    }
    
    // Close dropdown if not in mention context
    setMentionState((prev) => ({ ...prev, isOpen: false }))
  }, [textareaRef, value])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.addEventListener("input", handleInput)
    textarea.addEventListener("click", handleInput)
    textarea.addEventListener("keyup", handleInput)

    return () => {
      textarea.removeEventListener("input", handleInput)
      textarea.removeEventListener("click", handleInput)
      textarea.removeEventListener("keyup", handleInput)
    }
  }, [textareaRef, handleInput])

  // Fetch users when query changes
  useEffect(() => {
    if (!mentionState.isOpen) {
      setUsers([])
      return
    }

    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const results = await onSearchUsers(mentionState.query)
        setUsers(results)
        setHighlightedIndex(0)
        setError(null)
      } catch (error) {
        console.error("Failed to fetch users for mentions:", error)
        setUsers([])
        setError("Failed to load users. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce the search
    const timeoutId = setTimeout(fetchUsers, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [mentionState.isOpen, mentionState.query, onSearchUsers])

  // Handle keyboard navigation
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !mentionState.isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mentionState.isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < users.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (e.key === "Enter" || e.key === "Tab") {
        if (users.length > 0 && highlightedIndex >= 0) {
          e.preventDefault()
          insertMention(users[highlightedIndex])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setMentionState((prev) => ({ ...prev, isOpen: false }))
      }
    }

    textarea.addEventListener("keydown", handleKeyDown)
    return () => textarea.removeEventListener("keydown", handleKeyDown)
  }, [mentionState.isOpen, users, highlightedIndex, textareaRef, insertMention])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setMentionState((prev) => ({ ...prev, isOpen: false }))
      }
    }

    if (mentionState.isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [mentionState.isOpen, textareaRef])

  if (!mentionState.isOpen) return null

  return (
    <Card
      ref={dropdownRef}
      role="listbox"
      aria-label="User mentions"
      className={cn(
        "absolute z-50 w-80 max-h-64 overflow-hidden border shadow-xl bg-popover animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-200",
        className
      )}
      style={{
        top: `${mentionState.position.top}px`,
        left: `${mentionState.position.left}px`,
      }}
    >
      <div className="max-h-64 overflow-y-auto overscroll-contain custom-scrollbar">
        {isLoading ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : error ? (
          <div className="px-4 py-3 text-center text-sm text-destructive">
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {mentionState.query ? "No users found" : "Start typing to search users"}
          </div>
        ) : (
          <div className="p-1">
            {users.map((user, index) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground outline-none",
                  highlightedIndex === index && "bg-accent text-accent-foreground"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                  <AvatarFallback className="text-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="font-medium truncate w-full">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    @{user.username}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

/**
 * Copy textarea styles to mirror element for accurate positioning
 */
function copyTextareaStyles(source: HTMLTextAreaElement, target: HTMLDivElement): void {
  const style = window.getComputedStyle(source)
  const properties = [
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "whiteSpace",
    "wordBreak",
    "overflowWrap",
  ] as const
  
  properties.forEach((prop) => {
    const key = prop as keyof CSSStyleDeclaration
    const value = style[prop]
    if (typeof value === "string") {
      (target.style as any)[key] = value
    }
  })
}

/**
 * Create a mirror element to calculate caret position
 */
function createMirrorElement(element: HTMLTextAreaElement, position: number): HTMLDivElement {
  const div = document.createElement("div")
  copyTextareaStyles(element, div)
  
  div.style.position = "absolute"
  div.style.visibility = "hidden"
  div.style.whiteSpace = "pre-wrap"
  div.style.overflowWrap = "break-word"
  
  div.textContent = element.value.substring(0, position)
  
  const span = document.createElement("span")
  span.textContent = element.value.substring(position) || "."
  div.appendChild(span)
  
  return div
}

/**
 * Get caret coordinates relative to the viewport
 * Based on the textarea cursor position
 */
function getCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number
): { top: number; left: number } {
  const div = createMirrorElement(element, position)
  const span = div.querySelector("span")!
  
  document.body.appendChild(div)
  
  const rect = element.getBoundingClientRect()
  const spanRect = span.getBoundingClientRect()
  const divRect = div.getBoundingClientRect()
  
  const coordinates = {
    top: rect.top + spanRect.top - divRect.top + element.scrollTop + DROPDOWN_OFFSET_PX,
    left: rect.left + spanRect.left - divRect.left + element.scrollLeft,
  }
  
  document.body.removeChild(div)
  
  return coordinates
}
