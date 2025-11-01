import type { User, PointActionType } from "./types"
import { awardPoints } from "./tiers"
import { getUserById, updateUser } from "./storage"

/**
 * Award points to a user for an action
 * This function handles updating the user's points and daily tracking
 */
export function awardPointsToUser(
  userId: string,
  actionType: PointActionType,
): { pointsAwarded: number; newTier?: string } | null {
  if (typeof window === "undefined") return null

  const user = getUserById(userId)
  if (!user) return null

  try {
    const { pointsAwarded, newTotalPoints, dailyData } = awardPoints(user, actionType)

    // Update user with new points and daily data
    updateUser(userId, {
      points: newTotalPoints,
      dailyPoints: dailyData,
    })

    // Check if tier changed (this will be computed by daily job, but we can do a quick check)
    // The daily job will handle proper tier computation

    return {
      pointsAwarded,
    }
  } catch (error) {
    console.error("Error awarding points:", error)
    return null
  }
}

