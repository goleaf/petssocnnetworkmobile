"use client"

import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import {
  generateICSFile,
  generateICSFileForMultipleEvents,
  downloadICSFile,
} from "@/lib/utils/ics-export"
import type { GroupEvent } from "@/lib/types"

interface EventExportButtonProps {
  event: GroupEvent
  groupSlug: string
  groupName?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  showLabel?: boolean
}

export function EventExportButton({
  event,
  groupSlug,
  groupName,
  variant = "outline",
  size = "default",
  showIcon = true,
  showLabel = true,
}: EventExportButtonProps) {
  const handleExport = () => {
    const icsContent = generateICSFile(event, groupSlug, groupName)
    const filename = `${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${event.id}`
    downloadICSFile(icsContent, filename)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleExport()
      }}
      className="gap-2"
    >
      {showIcon && <Download className="h-4 w-4" />}
      {showLabel && "Export to Calendar"}
    </Button>
  )
}

interface BulkEventExportButtonProps {
  events: GroupEvent[]
  groupSlug: string
  groupName?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function BulkEventExportButton({
  events,
  groupSlug,
  groupName,
  variant = "outline",
  size = "default",
}: BulkEventExportButtonProps) {
  const handleBulkExport = () => {
    if (events.length === 0) return

    const icsContent = generateICSFileForMultipleEvents(events, groupSlug, groupName)
    const filename = `${groupName?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "group"}_events`
    downloadICSFile(icsContent, filename)
  }

  if (events.length === 0) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleBulkExport()
      }}
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      Export All Events
    </Button>
  )
}

