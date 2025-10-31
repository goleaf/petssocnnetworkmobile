"use client"

import * as React from "react"
import { Grid, Grid3x3, List } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type ViewMode = "grid" | "list"

interface ViewModeSelectorProps {
  value: ViewMode
  onValueChange: (value: ViewMode) => void
  className?: string
  iconVariant?: "grid" | "grid3x3"
  showLabel?: boolean
}

export function ViewModeSelector({
  value,
  onValueChange,
  className,
  iconVariant = "grid",
  showLabel = false,
}: ViewModeSelectorProps) {
  const GridIcon = iconVariant === "grid3x3" ? Grid3x3 : Grid

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-[130px]", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {value === "grid" ? (
              <GridIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <List className="h-4 w-4 text-muted-foreground" />
            )}
            {showLabel && (
              <span className="capitalize">{value === "grid" ? "Grid" : "List"}</span>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grid">
          <div className="flex items-center gap-2">
            <GridIcon className="h-4 w-4 text-muted-foreground" />
            <span>Grid View</span>
          </div>
        </SelectItem>
        <SelectItem value="list">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground" />
            <span>List View</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

