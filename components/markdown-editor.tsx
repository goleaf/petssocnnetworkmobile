"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Link, List, ListOrdered, ImageIcon, Code, Eye, Edit, BookOpen } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { CitationModal } from "@/components/citation-modal"
import { FootnotesManager } from "@/components/footnotes-manager"
import { parseCitationsFromMarkdown } from "@/lib/citations"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  showFootnotes?: boolean
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = "400px", showFootnotes = true }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [citationModalOpen, setCitationModalOpen] = useState(false)

  const insertMarkdown = (before: string, after = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handleInsertCitation = (citationMarkdown: string) => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    
    // Insert citation inline and source definition
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)
    const newText = beforeText + citationMarkdown + afterText

    onChange(newText)

    // Set cursor position after the inline citation
    setTimeout(() => {
      textarea.focus()
      const inlineCitationMatch = citationMarkdown.match(/\[\^[^\]]+\]/)
      if (inlineCitationMatch) {
        const citationLength = inlineCitationMatch[0].length
        textarea.setSelectionRange(start + citationLength, start + citationLength)
      }
    }, 0)
  }

  const handleRemoveCitation = (citationId: string) => {
    // Remove inline citations [^id] and source definitions [^id]: ...
    let newContent = value

    // Remove inline citations
    newContent = newContent.replace(new RegExp(`\\[\\^${citationId}\\]`, "g"), "")

    // Remove source definitions
    const sourceDefinitionPattern = new RegExp(`\\[\\^${citationId}\\]:[^\\n]+`, "g")
    newContent = newContent.replace(sourceDefinitionPattern, "")

    // Clean up multiple consecutive newlines
    newContent = newContent.replace(/\n{3,}/g, "\n\n")

    onChange(newContent.trim())
  }

  const toolbarButtons = [
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Italic", action: () => insertMarkdown("*", "*") },
    { icon: Link, label: "Link", action: () => insertMarkdown("[", "](url)") },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("\n- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => insertMarkdown("\n1. ") },
    { icon: ImageIcon, label: "Image", action: () => insertMarkdown("![alt text](", ")") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`") },
    { icon: BookOpen, label: "Citation", action: () => setCitationModalOpen(true) },
  ]

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
          <div className="border-b bg-muted/50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {toolbarButtons.map((button) => (
                <Button
                  key={button.label}
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  title={button.label}
                  className="h-8 w-8 p-0"
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs">
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit" className="m-0">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm"
              style={{ minHeight }}
            />
          </TabsContent>

          <TabsContent value="preview" className="m-0">
            <div className="p-4 prose prose-sm max-w-none" style={{ minHeight }}>
              {value ? (
                <ReactMarkdown>{value}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview yet. Start writing in the Edit tab.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showFootnotes && (
        <FootnotesManager
          content={value}
          onRemoveCitation={handleRemoveCitation}
          className="mt-4"
        />
      )}

      <CitationModal
        open={citationModalOpen}
        onOpenChange={setCitationModalOpen}
        onInsert={handleInsertCitation}
        content={value}
      />
    </div>
  )
}
