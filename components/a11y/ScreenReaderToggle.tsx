"use client"

import { useScreenReaderMode } from "@/components/a11y/screen-reader-provider"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

export function ScreenReaderToggle() {
  const { enabled, toggle } = useScreenReaderMode()
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      aria-pressed={enabled}
      aria-label={enabled ? "Disable screen reader mode" : "Enable screen reader mode"}
      data-testid="sr-toggle"
      onClick={toggle}
    >
      {enabled ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
      Screen reader
    </Button>
  )
}
