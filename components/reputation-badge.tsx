"use client"

import type { BadgeType } from "@/lib/types"
import { Badge as UIBadge } from "@/components/ui/badge"

interface ReputationBadgeProps {
  type: BadgeType
  className?: string
}

const BADGE_CONFIG: Record<
  BadgeType,
  { label: string; color: string; icon?: string }
> = {
  "accepted-edit": {
    label: "Accepted Edit",
    color: "bg-blue-500",
    icon: "✏️",
  },
  "accepted-citation": {
    label: "Accepted Citation",
    color: "bg-green-500",
    icon: "📚",
  },
  "expert-review": {
    label: "Expert Review",
    color: "bg-purple-500",
    icon: "✅",
  },
  "quality-improver": {
    label: "Quality Improver",
    color: "bg-yellow-500",
    icon: "⭐",
  },
  "citation-master": {
    label: "Citation Master",
    color: "bg-indigo-500",
    icon: "🏆",
  },
  reviewer: {
    label: "Reviewer",
    color: "bg-pink-500",
    icon: "👁️",
  },
}

export function ReputationBadge({ type, className }: ReputationBadgeProps) {
  const config = BADGE_CONFIG[type]

  return (
    <UIBadge
      className={`${config.color} text-white ${className || ""}`}
      title={config.label}
    >
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </UIBadge>
  )
}

