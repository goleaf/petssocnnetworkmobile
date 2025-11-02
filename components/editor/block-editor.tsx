'use client'

import { useEditor, EditorContent, EditorContext } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Underline } from '@tiptap/extension-underline'
import { Highlight } from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Placeholder } from '@tiptap/extension-placeholder'
import { useCallback, useState } from 'react'
import { EditorToolbar } from './editor-toolbar'
import { MarkdownToggle } from './markdown-toggle'
import { EditorPreview } from './editor-preview'
import type { Editor as TiptapEditor } from '@tiptap/core'

export interface BlockEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  editable?: boolean
  onBlur?: () => void
  onFocus?: () => void
  articleType?: 'breed' | 'health' | 'care-guide' | 'place' | 'org' | 'product' | 'regulation' | 'event'
}

export function BlockEditor({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  editable = true,
  onBlur,
  onFocus,
  articleType,
}: BlockEditorProps) {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color.configure({
        types: [TextStyle.name],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    onBlur,
    onFocus,
  })

  const handleMarkdownToggle = useCallback(() => {
    if (!editor) return

    if (isMarkdownMode) {
      // Switch from markdown to WYSIWYG
      // Convert markdown to HTML and set in editor
      // For now, we'll use a simple conversion (you may want to use a markdown parser)
      editor.commands.setContent(markdownContent)
      setIsMarkdownMode(false)
    } else {
      // Switch from WYSIWYG to markdown
      // Convert HTML to markdown
      const html = editor.getHTML()
      // Simple HTML to markdown conversion (you may want to use a library)
      setMarkdownContent(html)
      setIsMarkdownMode(true)
    }
  }, [editor, isMarkdownMode, markdownContent])

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between p-2">
            <EditorToolbar editor={editor} articleType={articleType} />
            <div className="flex items-center gap-2">
              <MarkdownToggle
                isMarkdownMode={isMarkdownMode}
                onToggle={handleMarkdownToggle}
              />
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                type="button"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        {showPreview ? (
          <EditorPreview content={editor.getHTML()} />
        ) : isMarkdownMode ? (
          <div className="p-4 min-h-[400px]">
            <textarea
              value={markdownContent}
              onChange={(e) => {
                setMarkdownContent(e.target.value)
                onChange?.(e.target.value)
              }}
              className="w-full h-full min-h-[400px] p-4 font-mono text-sm border-0 focus:outline-none resize-none"
              placeholder="Write in Markdown..."
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none p-4 min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </EditorContext.Provider>
  )
}

