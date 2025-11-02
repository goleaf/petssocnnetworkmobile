"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface VerifiedBadgeProps {
  verifiedAt?: string
  className?: string
}

export function VerifiedBadge({ verifiedAt, className }: VerifiedBadgeProps) {
  if (!verifiedAt) return null

  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className || ""}`}>
      <CheckCircle className="h-3 w-3" />
      Verified
    </Badge>
  )
}

