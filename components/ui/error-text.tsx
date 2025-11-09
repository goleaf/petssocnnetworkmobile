import * as React from 'react'
import { AlertCircle } from 'lucide-react'

export function ErrorText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" aria-live="polite" className={`text-xs text-destructive flex items-center gap-1 ${className}`.trim()}>
      <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
      <span>{children}</span>
    </p>
  )
}
