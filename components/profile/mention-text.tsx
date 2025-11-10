"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MentionTextProps {
  text: string
  className?: string
}

/**
 * Component that renders text with @mentions as clickable links
 * Mentions are highlighted in blue and link to user profiles
 */
export function MentionText({ text, className }: MentionTextProps) {
  if (!text) return null

  // Regex to match @username (alphanumeric, underscore, hyphen)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      )
    }

    // Add mention as link
    const username = match[1]
    parts.push(
      <Link
        key={`mention-${key++}`}
        href={`/user/${username}`}
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        @{username}
      </Link>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${key++}`}>
        {text.substring(lastIndex)}
      </span>
    )
  }

  return (
    <span className={cn("whitespace-pre-wrap break-word", className)}>
      {parts.length > 0 ? parts : text}
    </span>
  )
}
