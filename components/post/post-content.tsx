"use client"

import * as React from "react"
import { processWikiLinks } from "@/lib/utils/wiki-linking"
import { WikiLink } from "@/components/wiki/wiki-link"
import { MarkdownWithCitations } from "@/components/markdown-with-citations"
import { MDXCalloutsRenderer } from "@/components/blog/mdx-callouts"
import type { BlogPost } from "@/lib/types"

interface PostContentProps {
  content: string
  post: BlogPost
  className?: string
}

/**
 * Component that renders post content with auto-linked wiki terms, citations, and MDX callouts
 * Respects the per-post opt-out setting (disableWikiLinks)
 */
export function PostContent({ content, post, className }: PostContentProps) {
  // Check if wiki linking is disabled for this post
  const isWikiLinkingEnabled = !post.disableWikiLinks

  // Check if content has citations (markdown citation syntax)
  const hasCitations = /\[\^(\d+|citation-needed)\]/g.test(content)

  // Render MDX callouts if present
  const callouts = post.mdxCallouts || []

  // If content has citations, use MarkdownWithCitations which handles both markdown and citations
  if (hasCitations) {
    return (
      <div className={className}>
        <MarkdownWithCitations content={content} />
        {callouts.length > 0 && <MDXCalloutsRenderer callouts={callouts} />}
      </div>
    )
  }

  // Otherwise, process wiki links for plain text content
  const segments = React.useMemo(() => {
    if (!isWikiLinkingEnabled || !content) {
      return [{ type: "text" as const, content }]
    }
    return processWikiLinks(content)
  }, [content, isWikiLinkingEnabled])

  // Render segments
  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "link" && segment.article) {
          return (
            <WikiLink key={index} article={segment.article}>
              {segment.content}
            </WikiLink>
          )
        }
        return <React.Fragment key={index}>{segment.content}</React.Fragment>
      })}
      {callouts.length > 0 && <MDXCalloutsRenderer callouts={callouts} />}
    </div>
  )
}
