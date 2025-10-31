"use client"

import * as React from "react"
import { Filter, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface FilterOption {
  id: string
  label: string
  value: string
  icon?: LucideIcon | string
  color?: string
}

interface FilterDropdownProps {
  label?: string
  className?: string
  showBadge?: boolean
  badgeCount?: number
  hasActiveFilters?: boolean
  onClear?: () => void
  children: React.ReactNode
}

export function FilterDropdown({
  label = "Filters",
  className,
  showBadge = false,
  badgeCount = 0,
  hasActiveFilters = false,
  onClear,
  children,
}: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn("w-full md:w-auto", className)}>
          <Filter className="h-4 w-4 mr-2" />
          {label}
          {showBadge && badgeCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {badgeCount}
            </Badge>
          )}
          {hasActiveFilters && (
            <Badge variant="default" className="ml-2">
              1
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{label}</span>
          {hasActiveFilters && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (onClear) {
                  onClear()
                }
                setOpen(false)
              }}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">{children}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

