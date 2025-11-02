import { getUserById, getUsers } from "../storage"
import type { User } from "../types"

/**
 * Get mutual connections between the current user and another user
 * @param currentUserId - The ID of the current logged-in user
 * @param targetUserId - The ID of the user to check mutuals with
 * @param maxResults - Maximum number of mutuals to return (default: 2)
 * @returns Array of User objects representing mutual connections
 */
export function getMutualConnections(
  currentUserId: string,
  targetUserId: string,
  maxResults: number = 2,
): User[] {
  const currentUser = getUserById(currentUserId)
  const targetUser = getUserById(targetUserId)

  if (!currentUser || !targetUser) {
    return []
  }

  // Get users that both currentUser and targetUser follow
  const currentUserFollowing = new Set(currentUser.following ?? [])
  const targetUserFollowing = new Set(targetUser.following ?? [])
  const mutualFollowing = [...currentUserFollowing].filter((id) => targetUserFollowing.has(id))

  // Also consider users that follow both (mutual followers)
  const currentUserFollowers = new Set(currentUser.followers ?? [])
  const targetUserFollowers = new Set(targetUser.followers ?? [])
  const mutualFollowers = [...currentUserFollowers].filter((id) => targetUserFollowers.has(id))

  // Combine and deduplicate
  const allMutuals = new Set([...mutualFollowing, ...mutualFollowers])
  
  // Filter out blocked users and the users themselves
  const currentUserBlocked = new Set(currentUser.blockedUsers ?? [])
  const targetUserBlocked = new Set(targetUser.blockedUsers ?? [])
  
  const mutualIds = [...allMutuals].filter(
    (id) => id !== currentUserId && id !== targetUserId && !currentUserBlocked.has(id) && !targetUserBlocked.has(id)
  )

  // Get user objects
  const mutualUsers = mutualIds
    .map((id) => getUserById(id))
    .filter((user): user is User => user !== null)
    .slice(0, maxResults)

  return mutualUsers
}

/**
 * Get count of mutual connections between two users
 * @param currentUserId - The ID of the current logged-in user
 * @param targetUserId - The ID of the user to check mutuals with
 * @returns Number of mutual connections
 */
export function getMutualConnectionsCount(currentUserId: string, targetUserId: string): number {
  const currentUser = getUserById(currentUserId)
  const targetUser = getUserById(targetUserId)

  if (!currentUser || !targetUser) {
    return 0
  }

  const currentUserFollowing = new Set(currentUser.following ?? [])
  const targetUserFollowing = new Set(targetUser.following ?? [])
  const mutualFollowing = [...currentUserFollowing].filter((id) => targetUserFollowing.has(id))

  const currentUserFollowers = new Set(currentUser.followers ?? [])
  const targetUserFollowers = new Set(targetUser.followers ?? [])
  const mutualFollowers = [...currentUserFollowers].filter((id) => targetUserFollowers.has(id))

  const allMutuals = new Set([...mutualFollowing, ...mutualFollowers])
  
  const currentUserBlocked = new Set(currentUser.blockedUsers ?? [])
  const targetUserBlocked = new Set(targetUser.blockedUsers ?? [])
  
  const mutualIds = [...allMutuals].filter(
    (id) => id !== currentUserId && id !== targetUserId && !currentUserBlocked.has(id) && !targetUserBlocked.has(id)
  )

  return mutualIds.length
}

/**
 * Format mutual connections text (e.g., "Followed by John & Jane" or "Followed by John, Jane, and 3 others")
 * @param mutuals - Array of User objects
 * @param totalCount - Total count of mutuals (if more than what's shown)
 * @returns Formatted string
 */
export function formatMutualsText(mutuals: User[], totalCount?: number): string {
  if (mutuals.length === 0) {
    return ""
  }

  const displayMutuals = mutuals.slice(0, 2)
  const names = displayMutuals.map((user) => user.fullName)

  if (names.length === 1) {
    return `Followed by ${names[0]}`
  }

  if (names.length === 2) {
    if (totalCount && totalCount > 2) {
      const remaining = totalCount - 2
      return `Followed by ${names[0]} & ${names[1]} and ${remaining} ${remaining === 1 ? "other" : "others"}`
    }
    return `Followed by ${names[0]} & ${names[1]}`
  }

  // Fallback for edge cases
  return `Followed by ${names.join(", ")}`
}

