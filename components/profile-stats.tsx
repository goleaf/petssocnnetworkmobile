"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Heart, LucideIcon, Badge, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Lock } from "lucide-react"
import { Badge as UIBadge } from "@/components/ui/badge"

interface ProfileStatProps {
  label: string
  value: number | string
  icon: LucideIcon
  href?: string
  isLocked?: boolean
  lockedMessage?: string
  className?: string
  badge?: string
  highlight?: boolean
  highlightText?: string
}

function ProfileStat({ 
  label, 
  value, 
  icon: Icon, 
  href, 
  isLocked, 
  lockedMessage, 
  className,
  badge,
  highlight,
  highlightText
}: ProfileStatProps) {
  const content = (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full",
        isLocked && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <CardContent className="p-2 text-center">
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className={cn("p-1 rounded-full", isLocked ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20 transition-colors")}>
            {isLocked ? (
              <Lock className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Icon className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
            )}
          </div>
          <div className="w-full">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <p
                className={cn(
                  "text-base font-bold transition-colors",
                  isLocked ? "text-muted-foreground" : "text-foreground group-hover:text-primary",
                  highlight && "text-primary"
                )}
              >
                {value}
              </p>
              {badge && (
                <UIBadge variant="secondary" className="text-[8px] px-1 py-0 h-3 leading-tight">
                  {badge}
                </UIBadge>
              )}
              {highlight && (
                <TrendingUp className="h-3 w-3 text-primary" />
              )}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
            {highlight && highlightText && (
              <p className="text-[9px] text-primary font-medium mt-0.5">{highlightText}</p>
            )}
            {isLocked && lockedMessage && (
              <p className="text-[9px] leading-tight text-muted-foreground mt-1">{lockedMessage}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLocked || !href) {
    return content
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  )
}

interface ProfileStatsProps {
  followers: number
  following: number
  followersHref?: string
  followingHref?: string
  canViewFollowers?: boolean
  canViewFollowing?: boolean
  followersLockedMessage?: string
  followingLockedMessage?: string
  className?: string
  badges?: {
    verified?: boolean
    pro?: boolean
    shelter?: boolean
    vet?: boolean
  }
  highlights?: {
    recentFollowers?: number
    recentPosts?: number
    highEngagement?: boolean
  }
}

export function ProfileStats({
  followers,
  following,
  followersHref,
  followingHref,
  canViewFollowers = true,
  canViewFollowing = true,
  followersLockedMessage,
  followingLockedMessage,
  className,
  badges,
  highlights,
}: ProfileStatsProps) {
  const followerBadge = highlights?.recentFollowers 
    ? `+${highlights.recentFollowers}` 
    : undefined
  
  const followerHighlight = highlights?.recentFollowers && highlights.recentFollowers > 0
  const followerHighlightText = followerHighlight 
    ? `${highlights.recentFollowers} new this week` 
    : undefined

  return (
    <div className={cn("space-y-3", className)}>
      {/* Badges row */}
      {badges && (badges.verified || badges.pro || badges.shelter || badges.vet) && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {badges.verified && (
            <UIBadge variant="default" className="flex items-center gap-1">
              <Badge className="h-3 w-3" />
              Verified
            </UIBadge>
          )}
          {badges.pro && (
            <UIBadge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Pro
            </UIBadge>
          )}
          {badges.shelter && (
            <UIBadge variant="outline" className="flex items-center gap-1">
              Shelter
            </UIBadge>
          )}
          {badges.vet && (
            <UIBadge variant="outline" className="flex items-center gap-1">
              Veterinarian
            </UIBadge>
          )}
        </div>
      )}
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <ProfileStat
          label={followers === 1 ? "Follower" : "Followers"}
          value={canViewFollowers ? followers : "—"}
          icon={Users}
          href={followersHref}
          isLocked={!canViewFollowers}
          lockedMessage={followersLockedMessage}
          badge={followerBadge}
          highlight={followerHighlight}
          highlightText={followerHighlightText}
        />
        <ProfileStat
          label="Following"
          value={canViewFollowing ? following : "—"}
          icon={Heart}
          href={followingHref}
          isLocked={!canViewFollowing}
          lockedMessage={followingLockedMessage}
        />
      </div>
      
      {/* Engagement highlight */}
      {highlights?.highEngagement && (
        <div className="flex items-center justify-center gap-2 text-xs text-primary bg-primary/10 rounded-md p-2">
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">High engagement profile</span>
        </div>
      )}
    </div>
  )
}

interface CompactStatBlockProps {
  label: string
  value: number | string
  icon: LucideIcon
  href?: string
  isLocked?: boolean
  lockedMessage?: string
  className?: string
}

export function CompactStatBlock({
  label,
  value,
  icon: Icon,
  href,
  isLocked,
  lockedMessage,
  className,
}: CompactStatBlockProps) {
  const content = (
    <Card
      className={cn(
        "hover:shadow-md transition-all duration-200 hover:border-primary/50 cursor-pointer group h-full",
        isLocked && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <CardContent className="p-2 text-center">
        <div className="flex flex-col items-center justify-center space-y-1">
          <div className={cn("p-1 rounded-full", isLocked ? "bg-muted" : "bg-primary/10 group-hover:bg-primary/20 transition-colors")}>
            {isLocked ? (
              <Lock className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Icon className="h-3 w-3 text-primary group-hover:scale-110 transition-transform" />
            )}
          </div>
          <div>
            <p
              className={cn(
                "text-base font-bold transition-colors",
                isLocked ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
              )}
            >
              {value}
            </p>
            <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
            {isLocked && lockedMessage && (
              <p className="text-[9px] leading-tight text-muted-foreground mt-1">{lockedMessage}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (isLocked || !href) {
    return content
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  )
}

