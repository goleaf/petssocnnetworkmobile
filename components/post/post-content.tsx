"use client"

import * as React from "react"
import { processWikiLinks } from "@/lib/utils/wiki-linking"
import { WikiLink } from "@/components/wiki/wiki-link"
import { MarkdownWithCitations } from "@/components/markdown-with-citations"
import { MDXCalloutsRenderer } from "@/components/blog/mdx-callouts"
import type { BlogPost } from "@/lib/types"
import { useAuth } from "@/lib/auth"
import { detectPostLanguage, isPreferredLanguage } from "@/lib/utils/language"
import { Button } from "@/components/ui/button"
import { translateText } from "@/lib/translation"

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
  const { user } = useAuth()
  const prefs = user?.displayPreferences
  const postLang = detectPostLanguage(post)
  const targetLang = prefs?.primaryLanguage || prefs?.preferredContentLanguages?.[0] || 'en'
  const showTranslateControls = Boolean(prefs?.showTranslations) && (!isPreferredLanguage(postLang, prefs?.preferredContentLanguages) || (prefs?.autoTranslate && postLang && postLang !== targetLang))
  const [isTranslating, setIsTranslating] = React.useState(false)
  const [translated, setTranslated] = React.useState<string | null>(null)
  const [showOriginal, setShowOriginal] = React.useState<boolean>(true)

  React.useEffect(() => {
    if (prefs?.autoTranslate && showTranslateControls && !translated) {
      // Auto-translate on mount
      void handleTranslate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs?.autoTranslate, showTranslateControls, postLang, targetLang])

  async function handleTranslate() {
    if (isTranslating) return
    setIsTranslating(true)
    try {
      const result = await translateText(content, postLang, targetLang)
      setTranslated(result.text)
      setShowOriginal(false)
    } finally {
      setIsTranslating(false)
    }
  }

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

  // Render segments (with optional translation controls)
  return (
    <div className={className}>
      {showTranslateControls && (
        <div className="mb-2 flex items-center gap-2">
          {translated && !showOriginal ? (
            <Button variant="ghost" size="sm" onClick={() => setShowOriginal(true)}>See original</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={handleTranslate} disabled={isTranslating}>
              {isTranslating ? 'Translating…' : 'Translate'}
            </Button>
          )}
          {translated && showOriginal && (
            <Button variant="ghost" size="sm" onClick={() => setShowOriginal(false)}>Show translation</Button>
          )}
        </div>
      )}
      {translated && !showOriginal && (
        <div className="whitespace-pre-wrap">
          {translated}
        </div>
      )}
      {(!translated || showOriginal) && (
        <>
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
        </>
      )}
      {callouts.length > 0 && <MDXCalloutsRenderer callouts={callouts} />}
    </div>
  )
}
