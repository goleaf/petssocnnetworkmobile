'use client'

import { Button } from '@/components/ui/button'
import { FileText, Code } from 'lucide-react'

interface MarkdownToggleProps {
  isMarkdownMode: boolean
  onToggle: () => void
}

export function MarkdownToggle({ isMarkdownMode, onToggle }: MarkdownToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="gap-2"
      type="button"
    >
      {isMarkdownMode ? (
        <>
          <FileText className="h-4 w-4" />
          <span>WYSIWYG</span>
        </>
      ) : (
        <>
          <Code className="h-4 w-4" />
          <span>Markdown</span>
        </>
      )}
    </Button>
  )
}

