"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Pin, PinOff } from "lucide-react"
import { usePinnedItems } from "@/lib/pinned-items"
import type { PinnedItemType } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PinButtonProps {
  type: PinnedItemType
  itemId: string
  metadata?: { title?: string; description?: string; image?: string }
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showTooltip?: boolean
  onToggle?: (isPinned: boolean) => void
}

export function PinButton({
  type,
  itemId,
  metadata,
  variant = "ghost",
  size = "icon",
  className,
  showTooltip = true,
  onToggle,
}: PinButtonProps) {
  const { togglePin, checkIsPinned, loadPinnedItems } = usePinnedItems()
  const [isPinned, setIsPinned] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadPinnedItems()
    setIsPinned(checkIsPinned(type, itemId))
  }, [type, itemId, checkIsPinned, loadPinnedItems])

  const handleToggle = async () => {
    setIsLoading(true)
    const result = togglePin(type, itemId, metadata)
    if (result.success || !result.error) {
      setIsPinned(result.isPinned)
      onToggle?.(result.isPinned)
    } else {
      // Show error message to user
      alert(result.error || "Failed to toggle pin")
    }
    setIsLoading(false)
  }

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        className,
        isPinned && "bg-primary/10 text-primary hover:bg-primary/20"
      )}
      aria-label={isPinned ? "Unpin item" : "Pin item"}
    >
      {isPinned ? (
        <Pin className="h-4 w-4 fill-current" />
      ) : (
        <PinOff className="h-4 w-4" />
      )}
    </Button>
  )

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{isPinned ? "Unpin" : "Pin"} this {type}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

