"use client"
import { CheckCircle2, Crown, Heart, Stethoscope } from "lucide-react"
import type { User } from "@/lib/types"

interface BadgeDisplayProps {
  user: User
  size?: "sm" | "md" | "lg"
}

export function BadgeDisplay({ user, size = "md" }: BadgeDisplayProps) {
  if (!user.badge) return null

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const badges = {
    verified: {
      icon: CheckCircle2,
      label: "Verified",
      color: "text-blue-500",
    },
    pro: {
      icon: Crown,
      label: "Pro Member",
      color: "text-amber-500",
    },
    shelter: {
      icon: Heart,
      label: "Shelter Sponsor",
      color: "text-pink-500",
    },
    vet: {
      icon: Stethoscope,
      label: "Veterinarian",
      color: "text-green-500",
    },
  }

  const badge = badges[user.badge]
  const Icon = badge.icon

  return (
    <div className="inline-flex items-center gap-1" title={badge.label}>
      <Icon className={`${sizeClasses[size]} ${badge.color}`} />
    </div>
  )
}
