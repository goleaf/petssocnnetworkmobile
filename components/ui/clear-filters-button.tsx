"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClearFiltersButtonProps {
  onClick: () => void
  className?: string
  size?: "sm" | "default"
  disabled?: boolean
}

export function ClearFiltersButton({
  onClick,
  className,
  size = "default",
  disabled = false,
}: ClearFiltersButtonProps) {
  const heightClass = size === "sm" ? "h-8" : "h-9"
  const paddingClass = size === "sm" ? "px-3 py-1.5" : "px-3 py-2"

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex items-center justify-center gap-2 rounded-md border bg-white dark:bg-input/30 dark:hover:bg-input/50 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow,background-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
        heightClass,
        paddingClass,
        className
      )}
    >
      <X className="size-4 shrink-0" />
      <span>Clear Filters</span>
    </button>
  )
}

