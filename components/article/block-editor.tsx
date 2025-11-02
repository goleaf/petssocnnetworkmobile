"use client"

import { useState, useEffect, useCallback } from "react"
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { Link } from "@tiptap/extension-link"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Underline } from "@tiptap/extension-underline"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import TurndownService from "turndown"
import { marked } from "marked"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Code2,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BlockEditorProps {
  content?: JSONContent | string
  onChange?: (content: JSONContent) => void
  placeholder?: string
  editable?: boolean
  className?: string
}

type EditorMode = "wysiwyg" | "markdown"

export function BlockEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
}: BlockEditorProps) {
  const [mode, setMode] = useState<EditorMode>("wysiwyg")
  const [markdownContent, setMarkdownContent] = useState("")

  // Initialize Turndown service for HTML to Markdown conversion
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || "",
    editable: editable && mode === "wysiwyg",
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChange?.(json)
      // Update markdown content when in WYSIWYG mode
      if (mode === "wysiwyg") {
        const html = editor.getHTML()
        const markdown = turndownService.turndown(html)
        setMarkdownContent(markdown)
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none",
          "focus:outline-none min-h-[400px] px-4 py-3",
          className
        ),
      },
    },
  })

  // Convert markdown to Tiptap JSON when switching to WYSIWYG mode
  const convertMarkdownToEditor = useCallback(
    (markdown: string) => {
      if (!editor) return

      try {
        // Convert markdown to HTML
        const html = marked.parse(markdown, {
          breaks: true,
          gfm: true,
        }) as string

        // Set HTML content in editor
        editor.commands.setContent(html)
      } catch (error) {
        console.error("Error converting markdown to editor:", error)
      }
    },
    [editor]
  )

  // Convert editor content to markdown when switching to markdown mode
  const convertEditorToMarkdown = useCallback(() => {
    if (!editor) return ""

    try {
      const html = editor.getHTML()
      return turndownService.turndown(html)
    } catch (error) {
      console.error("Error converting editor to markdown:", error)
      return ""
    }
  }, [editor, turndownService])

  // Handle mode toggle
  const handleModeToggle = (newMode: EditorMode) => {
    if (!editor) return

    if (mode === "wysiwyg" && newMode === "markdown") {
      // Convert WYSIWYG to markdown
      const markdown = convertEditorToMarkdown()
      setMarkdownContent(markdown)
    } else if (mode === "markdown" && newMode === "wysiwyg") {
      // Convert markdown to WYSIWYG
      convertMarkdownToEditor(markdownContent)
    }

    setMode(newMode)
  }

  // Handle markdown content changes
  const handleMarkdownChange = (value: string) => {
    setMarkdownContent(value)
    if (editor && onChange) {
      try {
        const html = marked.parse(value, {
          breaks: true,
          gfm: true,
        }) as string
        const tempEditor = editor.chain().setContent(html).getJSON()
        onChange(tempEditor)
      } catch (error) {
        console.error("Error parsing markdown:", error)
      }
    }
  }

  // Initialize markdown content from editor content
  useEffect(() => {
    if (editor && mode === "markdown" && !markdownContent) {
      const markdown = convertEditorToMarkdown()
      setMarkdownContent(markdown)
    }
  }, [editor, mode, markdownContent, convertEditorToMarkdown])

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt("Image URL")
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {editable && (
        <div className="border-b p-2 flex flex-wrap items-center gap-2 bg-muted/50">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2 px-2">
            <Label htmlFor="editor-mode" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">WYSIWYG</span>
            </Label>
            <Switch
              id="editor-mode"
              checked={mode === "markdown"}
              onCheckedChange={(checked) => handleModeToggle(checked ? "markdown" : "wysiwyg")}
            />
            <Label htmlFor="editor-mode" className="text-sm font-medium flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Markdown</span>
            </Label>
          </div>

          {mode === "wysiwyg" && (
            <>
              <div className="w-px h-6 bg-border" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn(editor.isActive("bold") && "bg-muted")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn(editor.isActive("italic") && "bg-muted")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={!editor.can().chain().focus().toggleUnderline().run()}
                className={cn(editor.isActive("underline") && "bg-muted")}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={cn(editor.isActive("strike") && "bg-muted")}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(editor.isActive("heading", { level: 1 }) && "bg-muted")}
              >
                H1
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(editor.isActive("heading", { level: 2 }) && "bg-muted")}
              >
                H2
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={cn(editor.isActive("heading", { level: 3 }) && "bg-muted")}
              >
                H3
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editor.isActive("bulletList") && "bg-muted")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editor.isActive("orderedList") && "bg-muted")}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(editor.isActive("blockquote") && "bg-muted")}
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={cn(editor.isActive("code") && "bg-muted")}
              >
                <Code className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={setLink} className={cn(editor.isActive("link") && "bg-muted")}>
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={addImage}>
                <ImageIcon className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {mode === "wysiwyg" ? (
        <EditorContent editor={editor} className={cn(editable && "min-h-[400px]")} />
      ) : (
        <div className="p-4">
          <Textarea
            value={markdownContent}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "min-h-[400px] font-mono text-sm",
              "focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
            disabled={!editable}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Markdown mode: Use standard Markdown syntax. Changes are automatically synced with WYSIWYG mode.
          </p>
        </div>
      )}
    </div>
  )
}

