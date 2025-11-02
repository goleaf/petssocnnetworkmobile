"use client"
import { CheckCircle2, Crown, Heart, Stethoscope, GraduationCap, Trophy } from "lucide-react"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface BadgeDisplayProps {
  user: User
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "badge" // Display as icon only or full badge
}

export function BadgeDisplay({ user, size = "md", variant = "icon" }: BadgeDisplayProps) {
  // Support both new badges array and legacy badge field
  // Map legacy badge values to new badge values
  const legacyBadgeMap: Record<string, string> = {
    verified: "verified",
    pro: "pro",
    shelter: "shelter", // Keep as shelter (same as new)
    vet: "vet", // Keep as vet (same as new)
  }
  
  const badgeList = user.badges || (user.badge ? [legacyBadgeMap[user.badge] || user.badge] : [])
  if (badgeList.length === 0) return null

  const sizeClasses = {
    sm: {
      icon: "h-3 w-3",
      badge: "text-xs px-1.5 py-0.5",
      iconInBadge: "h-3 w-3",
    },
    md: {
      icon: "h-4 w-4",
      badge: "text-xs px-2 py-1",
      iconInBadge: "h-3.5 w-3.5",
    },
    lg: {
      icon: "h-5 w-5",
      badge: "text-sm px-2.5 py-1",
      iconInBadge: "h-4 w-4",
    },
  }

  const badgeConfigs = {
    vet: {
      icon: Stethoscope,
      label: "Vet",
      iconColor: "text-green-600 dark:text-green-400",
      badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    trainer: {
      icon: GraduationCap,
      label: "Trainer",
      iconColor: "text-blue-600 dark:text-blue-400",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    shelter: {
      icon: Heart,
      label: "Shelter",
      iconColor: "text-pink-600 dark:text-pink-400",
      badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
      legacyLabel: "Shelter Sponsor", // For legacy badge field
    },
    "top-contributor": {
      icon: Trophy,
      label: "Top Contributor",
      iconColor: "text-amber-600 dark:text-amber-400",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    // Legacy badges support
    verified: {
      icon: CheckCircle2,
      label: "Verified",
      iconColor: "text-blue-500",
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    pro: {
      icon: Crown,
      label: "Pro Member",
      iconColor: "text-amber-500",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
  }

  const activeBadges = badgeList.filter((badge) => badge && badgeConfigs[badge as keyof typeof badgeConfigs])

  if (activeBadges.length === 0) return null

  // Check if using legacy badge field to show legacy label
  const isLegacyBadge = !user.badges && user.badge

  if (variant === "icon") {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        {activeBadges.map((badgeType) => {
          const config = badgeConfigs[badgeType as keyof typeof badgeConfigs]
          if (!config) return null
          const Icon = config.icon
          const label = isLegacyBadge && badgeType === user.badge && (config as any).legacyLabel 
            ? (config as any).legacyLabel 
            : config.label
          return (
            <div key={badgeType} className="inline-flex items-center" title={label}>
              <Icon className={`${sizeClasses[size].icon} ${config.iconColor}`} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {activeBadges.map((badgeType) => {
        const config = badgeConfigs[badgeType as keyof typeof badgeConfigs]
        if (!config) return null
        const Icon = config.icon
        return (
          <Badge key={badgeType} variant="outline" className={`${sizeClasses[size].badge} ${config.badgeClass} flex items-center gap-1`}>
            <Icon className={sizeClasses[size].iconInBadge} />
            <span>{config.label}</span>
          </Badge>
        )
      })}
    </div>
  )
}
