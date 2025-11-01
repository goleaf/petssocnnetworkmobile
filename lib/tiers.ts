import type {
  User,
  UserTier,
  PointActionType,
  TierConfig,
  TierPrivileges,
  DailyPointsData,
} from "./types"

// Tier configurations
export const TIER_CONFIGS: TierConfig[] = [
  {
    tier: "bronze",
    minPoints: 0,
    privileges: {
      externalLinkQuota: 1,
      canMovePages: false,
      maxPostsPerDay: 10,
      maxCommentsPerDay: 20,
    },
    badgeColor: "text-amber-600",
    badgeIcon: "🥉",
  },
  {
    tier: "silver",
    minPoints: 100,
    privileges: {
      externalLinkQuota: 2,
      canMovePages: false,
      maxPostsPerDay: 20,
      maxCommentsPerDay: 40,
    },
    badgeColor: "text-gray-400",
    badgeIcon: "🥈",
  },
  {
    tier: "gold",
    minPoints: 500,
    privileges: {
      externalLinkQuota: 5,
      canMovePages: true,
      maxPostsPerDay: 50,
      maxCommentsPerDay: 100,
    },
    badgeColor: "text-yellow-500",
    badgeIcon: "🥇",
  },
  {
    tier: "platinum",
    minPoints: 2000,
    privileges: {
      externalLinkQuota: 10,
      canMovePages: true,
      maxPostsPerDay: 100,
      maxCommentsPerDay: 200,
    },
    badgeColor: "text-slate-300",
    badgeIcon: "💎",
  },
  {
    tier: "diamond",
    minPoints: 10000,
    privileges: {
      externalLinkQuota: 20,
      canMovePages: true,
      maxPostsPerDay: 200,
      maxCommentsPerDay: 500,
    },
    badgeColor: "text-blue-400",
    badgeIcon: "💠",
  },
]

// Base points for each action
const BASE_POINTS: Record<PointActionType, number> = {
  post_create: 10,
  post_like: 1,
  post_comment: 3,
  post_share: 2,
  wiki_create: 15,
  wiki_edit: 5,
  comment_reply: 2,
  follow_user: 1,
  pet_add: 5,
  group_create: 10,
  group_post: 5,
}

// Anti-gaming: Diminishing returns threshold (N actions per day)
const DIMINISHING_RETURNS_THRESHOLD: Record<PointActionType, number> = {
  post_create: 5, // After 5 posts/day, diminishing returns
  post_like: 20,
  post_comment: 15,
  post_share: 10,
  wiki_create: 3,
  wiki_edit: 5,
  comment_reply: 10,
  follow_user: 10,
  pet_add: 2,
  group_create: 1,
  group_post: 10,
}

// Calculate points with diminishing returns
export function calculatePoints(
  actionType: PointActionType,
  dailyActionCount: number,
): number {
  const basePoints = BASE_POINTS[actionType]
  const threshold = DIMINISHING_RETURNS_THRESHOLD[actionType]

  if (dailyActionCount <= threshold) {
    return basePoints
  }

  // Diminishing returns: 50% points after threshold, then 25% after 2x threshold
  const excess = dailyActionCount - threshold
  const multiplier = excess >= threshold ? 0.25 : 0.5

  return Math.round(basePoints * multiplier)
}

// Get today's date string (YYYY-MM-DD)
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]
}

// Get or initialize daily points data
export function getDailyPointsData(user: User): DailyPointsData {
  const today = getTodayDateString()

  if (!user.dailyPoints || user.dailyPoints.date !== today) {
    return {
      date: today,
      actions: {
        post_create: 0,
        post_like: 0,
        post_comment: 0,
        post_share: 0,
        wiki_create: 0,
        wiki_edit: 0,
        comment_reply: 0,
        follow_user: 0,
        pet_add: 0,
        group_create: 0,
        group_post: 0,
      },
      totalPointsEarned: 0,
    }
  }

  return user.dailyPoints
}

// Award points for an action
export function awardPoints(
  user: User,
  actionType: PointActionType,
): { pointsAwarded: number; newTotalPoints: number; dailyData: DailyPointsData } {
  const dailyData = getDailyPointsData(user)
  const actionCount = dailyData.actions[actionType] || 0

  const pointsAwarded = calculatePoints(actionType, actionCount)

  const updatedDailyData: DailyPointsData = {
    ...dailyData,
    actions: {
      ...dailyData.actions,
      [actionType]: actionCount + 1,
    },
    totalPointsEarned: dailyData.totalPointsEarned + pointsAwarded,
  }

  const currentPoints = user.points || 0
  const newTotalPoints = currentPoints + pointsAwarded

  return {
    pointsAwarded,
    newTotalPoints,
    dailyData: updatedDailyData,
  }
}

// Compute tier based on points
export function computeTier(points: number): UserTier {
  // Sort tiers by minPoints descending
  const sortedTiers = [...TIER_CONFIGS].sort((a, b) => b.minPoints - a.minPoints)

  for (const config of sortedTiers) {
    if (points >= config.minPoints) {
      return config.tier
    }
  }

  return "bronze"
}

// Get tier configuration
export function getTierConfig(tier: UserTier): TierConfig {
  const config = TIER_CONFIGS.find((c) => c.tier === tier)
  if (!config) {
    throw new Error(`Invalid tier: ${tier}`)
  }
  return config
}

// Get privileges for a user
export function getUserPrivileges(user: User): TierPrivileges {
  const tier = user.tier || "bronze"
  const config = getTierConfig(tier)
  return config.privileges
}

// Check if user can add external links
export function canAddExternalLink(user: User, currentLinkCount: number): boolean {
  const privileges = getUserPrivileges(user)
  return currentLinkCount < privileges.externalLinkQuota
}

// Check if user can move pages
export function canMovePages(user: User): boolean {
  const privileges = getUserPrivileges(user)
  return privileges.canMovePages
}

// Check daily action limits
export function canPerformAction(
  user: User,
  actionType: PointActionType,
): { allowed: boolean; reason?: string } {
  const privileges = getUserPrivileges(user)

  if (actionType === "post_create" && privileges.maxPostsPerDay) {
    const dailyData = getDailyPointsData(user)
    const postCount = dailyData.actions.post_create || 0
    if (postCount >= privileges.maxPostsPerDay) {
      return {
        allowed: false,
        reason: `Daily post limit reached (${privileges.maxPostsPerDay} posts/day)`,
      }
    }
  }

  if (actionType === "post_comment" && privileges.maxCommentsPerDay) {
    const dailyData = getDailyPointsData(user)
    const commentCount =
      (dailyData.actions.post_comment || 0) + (dailyData.actions.comment_reply || 0)
    if (commentCount >= privileges.maxCommentsPerDay) {
      return {
        allowed: false,
        reason: `Daily comment limit reached (${privileges.maxCommentsPerDay} comments/day)`,
      }
    }
  }

  return { allowed: true }
}

// Daily job to recompute tiers for all users
export function computeTiersForAllUsers(users: User[]): User[] {
  const today = getTodayDateString()

  return users.map((user) => {
    // Only recompute if it hasn't been computed today
    if (user.tierLastComputed === today) {
      return user
    }

    const currentPoints = user.points || 0
    const newTier = computeTier(currentPoints)
    const currentTier = user.tier || "bronze"

    // Only update if tier changed
    if (newTier !== currentTier) {
      return {
        ...user,
        tier: newTier,
        tierLastComputed: today,
      }
    }

    return {
      ...user,
      tierLastComputed: today,
    }
  })
}

