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
  const [expanded, setExpanded] = React.useState<boolean>(false)

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

  // Tokenization utilities for links/mentions/hashtags with linebreaks preserved
  type Token =
    | { t: "text"; v: string }
    | { t: "br" }
    | { t: "url"; v: string }
    | { t: "mention"; v: string }
    | { t: "hashtag"; v: string }

  const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+)(?![^<]*>)/gi
  const MENTION_RE = /@([A-Za-z0-9_.-]+)/g
  const HASHTAG_RE = /#([A-Za-z0-9_]+)/g

  function tokenizeText(input: string): Token[] {
    if (!input) return []
    const tokens: Token[] = []
    const parts = input.split(/\n/)
    parts.forEach((line, lineIndex) => {
      if (line.length === 0) {
        // Empty line still creates a break
        if (lineIndex > 0) tokens.push({ t: "br" })
        return
      }
      let cursor = 0
      const combined = new RegExp(`${URL_RE.source}|${MENTION_RE.source}|${HASHTAG_RE.source}`, "gi")
      let match: RegExpExecArray | null
      while ((match = combined.exec(line)) !== null) {
        const start = match.index
        if (start > cursor) {
          tokens.push({ t: "text", v: line.slice(cursor, start) })
        }
        const full = match[0]
        const urlCandidate = match[1]
        const mention = match[2]
        const hashtag = match[3]
        if (urlCandidate) {
          tokens.push({ t: "url", v: urlCandidate })
        } else if (mention) {
          tokens.push({ t: "mention", v: mention })
        } else if (hashtag) {
          tokens.push({ t: "hashtag", v: hashtag })
        } else {
          tokens.push({ t: "text", v: full })
        }
        cursor = start + full.length
      }
      if (cursor < line.length) {
        tokens.push({ t: "text", v: line.slice(cursor) })
      }
      if (lineIndex < parts.length - 1) tokens.push({ t: "br" })
    })
    return tokens
  }

  function truncateTokens(tokens: Token[], charLimit = 280, maxLineBreaks = 4): { tokens: Token[]; truncated: boolean } {
    let chars = 0
    let lineBreaks = 0
    const out: Token[] = []
    let truncated = false
    for (const tok of tokens) {
      if (tok.t === "br") {
        lineBreaks += 1
        if (lineBreaks >= maxLineBreaks) {
          truncated = true
          break
        }
        out.push(tok)
        continue
      }
      const textLen = tok.t === "text" || tok.t === "url" || tok.t === "mention" || tok.t === "hashtag" ? tok.v.length : 0
      if (chars + textLen > charLimit) {
        // Slice only plain text; for special tokens, stop before adding
        if (tok.t === "text") {
          const remain = Math.max(0, charLimit - chars)
          if (remain > 0) out.push({ t: "text", v: tok.v.slice(0, remain) })
        }
        truncated = true
        break
      }
      out.push(tok)
      chars += textLen
    }
    return { tokens: out, truncated }
  }

  function renderTokens(tokens: Token[]): React.ReactNode {
    return tokens.map((tok, i) => {
      switch (tok.t) {
        case "br":
          return <br key={`br-${i}`} />
        case "text":
          return <React.Fragment key={`t-${i}`}>{tok.v}</React.Fragment>
        case "url": {
          const href = tok.v.startsWith("http") ? tok.v : `https://${tok.v}`
          return (
            <a key={`u-${i}`} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-words">
              {tok.v}
            </a>
          )
        }
        case "mention":
          return (
            <a key={`m-${i}`} href={`/profile/${encodeURIComponent(tok.v)}`} className="text-primary hover:underline">
              @{tok.v}
            </a>
          )
        case "hashtag":
          return (
            <a
              key={`h-${i}`}
              href={`/search?q=${encodeURIComponent(`#${tok.v}`)}&tab=blogs`}
              className="text-primary hover:underline"
            >
              #{tok.v}
            </a>
          )
      }
    })
  }

  // Render segments with optional translation and expandable truncation
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
      {(() => {
        const active = translated && !showOriginal ? translated : content
        // For originals, apply wiki-link processing before tokenization; translations skip wiki linking.
        const baseSegments = (!translated || showOriginal)
          ? (isWikiLinkingEnabled && active
              ? processWikiLinks(active)
              : [{ type: "text" as const, content: active }])
          : [{ type: "text" as const, content: active }]

        // Flatten segments into tokens
        const tokens: Token[] = []
        baseSegments.forEach((seg, idx) => {
          if ((seg as any).type === "link" && (seg as any).article) {
            // Keep wiki links intact as a single text token; we'll render as WikiLink later
            tokens.push({ t: "text", v: `[[${(seg as any).content}]]` })
          } else {
            tokens.push(...tokenizeText((seg as any).content))
          }
          // Preserve segment boundaries without forcing breaks
        })

        // Determine truncation
        const { tokens: clipped, truncated } = truncateTokens(tokens)
        const shouldTruncate = !expanded && truncated

        // Render function that re-inserts wiki links if present
        function renderWithWiki(ts: Token[]): React.ReactNode {
          // Replace the placeholder wiki tokens back to <WikiLink/>
          const out: React.ReactNode[] = []
          ts.forEach((t, i) => {
            if (t.t === "text" && /\[\[[^\]]+\]\]/.test(t.v)) {
              const parts = t.v.split(/(\[\[[^\]]+\]\])/)
              parts.forEach((p, j) => {
                const m = p.match(/^\[\[([^\]]+)\]\]$/)
                if (m) {
                  const label = m[1]
                  out.push(
                    <WikiLink key={`wk-${i}-${j}`} article={label}>
                      {label}
                    </WikiLink>
                  )
                } else if (p) {
                  out.push(<React.Fragment key={`wkf-${i}-${j}`}>{p}</React.Fragment>)
                }
              })
            } else {
              out.push(renderTokens([t]) as any)
            }
          })
          return out
        }

        return (
          <div className="whitespace-pre-wrap">
            {shouldTruncate ? (
              <>
                {renderWithWiki(clipped)}
                <span>… </span>
                <button type="button" className="text-primary hover:underline" onClick={() => setExpanded(true)}>
                  Read more
                </button>
              </>
            ) : (
              renderWithWiki(tokens)
            )}
          </div>
        )
      })()}
      {callouts.length > 0 && <MDXCalloutsRenderer callouts={callouts} />}
    </div>
  )
}
