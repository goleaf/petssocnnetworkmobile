"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import ReactMarkdown from "react-markdown"
import { Bold, Code, Eye, Italic, Link, List, ListOrdered, Quote, Edit, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const TOOLBAR_ACTIONS = [
  { icon: Bold, label: "Bold", wrapper: ["**", "**"] },
  { icon: Italic, label: "Italic", wrapper: ["*", "*"] },
  { icon: Link, label: "Link", wrapper: ["[", "](https://)"] },
  { icon: Quote, label: "Quote", linePrefix: "> " },
  { icon: List, label: "Bullet list", linePrefix: "- " },
  { icon: ListOrdered, label: "Numbered list", linePrefix: "1. " },
  { icon: Code, label: "Inline code", wrapper: ["`", "`"] },
  { icon: AtSign, label: "Mention", wrapper: ["@", ""] },
]

interface CommentEditorProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  submitting?: boolean
  submitLabel?: string
  placeholder?: string
  onCancel?: () => void
  autoFocus?: boolean
  minRows?: number
  className?: string
}

export function CommentEditor({
  value,
  onChange,
  onSubmit,
  submitting,
  submitLabel = "Post",
  placeholder = "Write a comment...",
  onCancel,
  autoFocus,
  minRows = 3,
  className,
}: CommentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  const wrapSelection = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd } = textarea
    const selected = value.slice(selectionStart, selectionEnd)
    const updated = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
    onChange(updated)

    requestAnimationFrame(() => {
      textarea.focus()
      const caretPosition = selectionStart + before.length + selected.length
      textarea.setSelectionRange(caretPosition, caretPosition)
    })
  }

  const addLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd } = textarea
    const before = value.slice(0, selectionStart)
    const selected = value.slice(selectionStart, selectionEnd)
    const after = value.slice(selectionEnd)

    const selectedLines = selected || value.slice(selectionStart, selectionStart)
    const lines = selectedLines.split("\n")
    const prefixed = lines.map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`)).join("\n")
    const updated = before + prefixed + after

    onChange(updated)

    requestAnimationFrame(() => {
      textarea.focus()
      const caretPosition = selectionStart + prefix.length
      textarea.setSelectionRange(caretPosition, caretPosition)
    })
  }

  const handleToolbarAction = (action: (typeof TOOLBAR_ACTIONS)[number]) => {
    if ("wrapper" in action && action.wrapper) {
      wrapSelection(action.wrapper[0], action.wrapper[1])
    } else if ("linePrefix" in action && action.linePrefix) {
      addLinePrefix(action.linePrefix)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault()
      if (!submitting) {
        onSubmit()
      }
    }
  }

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1">
            {TOOLBAR_ACTIONS.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleToolbarAction(action)}
              >
                <action.icon className="h-4 w-4" />
                <span className="sr-only">{action.label}</span>
              </Button>
            ))}
          </div>
          <TabsList className="h-8">
            <TabsTrigger value="edit" className="text-xs">
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0">
          <Textarea
            ref={textareaRef}
            autoFocus={autoFocus}
            rows={minRows}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            onKeyDown={handleKeyDown}
            className="min-h-[120px] w-full border-0 bg-background focus-visible:ring-0"
          />
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <div className="prose prose-sm max-w-none p-3">
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nothing to preview yet. Start typing to see it here.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-3 py-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="button" size="sm" onClick={onSubmit} disabled={submitting || !value.trim()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
