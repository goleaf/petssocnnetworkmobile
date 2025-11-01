"use client"

import type { User, UserTier } from "@/lib/types"
import { getTierConfig } from "@/lib/tiers"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TierBadgeProps {
  user: User
  size?: "sm" | "md" | "lg"
  showPoints?: boolean
}

export function TierBadge({ user, size = "md", showPoints = false }: TierBadgeProps) {
  const tier = user.tier || "bronze"
  const config = getTierConfig(tier)

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const tierNames: Record<UserTier, string> = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    diamond: "Diamond",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${sizeClasses[size]} ${config.badgeColor} cursor-help border-current`}
          >
            <span className="mr-1">{config.badgeIcon}</span>
            <span>{tierNames[tier]}</span>
            {showPoints && user.points !== undefined && (
              <span className="ml-1 opacity-70">({user.points} pts)</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">
              {tierNames[tier]} Tier ({user.points || 0} points)
            </p>
            <div className="text-xs space-y-0.5">
              <p>• {config.privileges.externalLinkQuota} external links per post</p>
              {config.privileges.canMovePages && <p>• Can move pages</p>}
              {config.privileges.maxPostsPerDay && (
                <p>• {config.privileges.maxPostsPerDay} posts/day limit</p>
              )}
              {config.privileges.maxCommentsPerDay && (
                <p>• {config.privileges.maxCommentsPerDay} comments/day limit</p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

