"use client"

import * as React from "react"
import { Eye, Lock, EyeOff, Layers } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type GroupType = "all" | "open" | "closed" | "secret"

interface GroupTypeFilterProps {
  value: GroupType
  onValueChange: (value: GroupType) => void
  className?: string
  showSecret?: boolean
}

export function GroupTypeFilter({
  value,
  onValueChange,
  className,
  showSecret = false,
}: GroupTypeFilterProps) {
  const getTypeIcon = (type: GroupType) => {
    switch (type) {
      case "open":
        return <Eye className="h-4 w-4" />
      case "closed":
        return <Lock className="h-4 w-4" />
      case "secret":
        return <EyeOff className="h-4 w-4" />
      case "all":
        return <Layers className="h-4 w-4" />
      default:
        return <Layers className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: GroupType) => {
    switch (type) {
      case "open":
        return "Open"
      case "closed":
        return "Closed"
      case "secret":
        return "Secret"
      default:
        return "All Types"
    }
  }

  const options: GroupType[] = showSecret
    ? ["all", "open", "closed", "secret"]
    : ["all", "open", "closed"]

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            {getTypeIcon(value)}
            <span>{getTypeLabel(value)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((type) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              {getTypeIcon(type)}
              {getTypeLabel(type)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

