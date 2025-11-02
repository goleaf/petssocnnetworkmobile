'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Monitor, Smartphone } from 'lucide-react'

interface EditorPreviewProps {
  content: string
}

export function EditorPreview({ content }: EditorPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="relative">
      {/* Preview Mode Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant={previewMode === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMode('desktop')}
          className="gap-2"
          type="button"
        >
          <Monitor className="h-4 w-4" />
          Desktop
        </Button>
        <Button
          variant={previewMode === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreviewMode('mobile')}
          className="gap-2"
          type="button"
        >
          <Smartphone className="h-4 w-4" />
          Mobile
        </Button>
      </div>

      {/* Preview Content */}
      <div
        className={`p-8 min-h-[400px] bg-white ${
          previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-4xl mx-auto'
        }`}
      >
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
}

