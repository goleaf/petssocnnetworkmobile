"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react"

interface ExpirationBadgeProps {
  monthsUntilExpiration: number
  className?: string
}

export function ExpirationBadge({ monthsUntilExpiration, className }: ExpirationBadgeProps) {
  const getBadgeState = () => {
    if (monthsUntilExpiration <= 0) {
      return {
        label: "Expired",
        variant: "destructive" as const,
        icon: XCircle,
        description: "This article has expired and requires expert review",
      }
    } else if (monthsUntilExpiration <= 3) {
      return {
        label: "Expiring Soon",
        variant: "destructive" as const,
        icon: AlertTriangle,
        description: "This article expires within 3 months",
      }
    } else if (monthsUntilExpiration <= 6) {
      return {
        label: "Review Due",
        variant: "default" as const,
        icon: Clock,
        description: "This article should be reviewed soon",
      }
    } else {
      return {
        label: "Current",
        variant: "secondary" as const,
        icon: CheckCircle2,
        description: "This article is current and up-to-date",
      }
    }
  }

  const state = getBadgeState()
  const Icon = state.icon

  return (
    <Badge
      variant={state.variant}
      className={cn("flex items-center gap-1.5", className)}
      title={state.description}
    >
      <Icon className="h-3 w-3" />
      {state.label}
    </Badge>
  )
}

