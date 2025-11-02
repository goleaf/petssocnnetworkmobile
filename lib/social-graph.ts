import { getUsers } from "./storage"
import type { User } from "./types"

/**
 * Get follower count excluding blocked and muted users
 */
export function getEffectiveFollowerCount(userId: string): number {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return 0

  const followers = user.followers ?? []
  const blockedUsers = new Set(user.blockedUsers ?? [])
  const mutedUsers = new Set(user.mutedUsers ?? [])

  return followers.filter(
    (followerId) => !blockedUsers.has(followerId) && !mutedUsers.has(followerId),
  ).length
}

/**
 * Get following count excluding blocked and muted users
 */
export function getEffectiveFollowingCount(userId: string): number {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) return 0

  const following = user.following ?? []
  const allUsers = users
  const blockedUsers = new Set(user.blockedUsers ?? [])
  const mutedUsers = new Set(user.mutedUsers ?? [])

  return following.filter((followingId) => {
    const followedUser = allUsers.find((u) => u.id === followingId)
    if (!followedUser) return false
    // Exclude if they blocked or muted us, or if we blocked/muted them
    return (
      !blockedUsers.has(followingId) &&
      !mutedUsers.has(followingId) &&
      !followedUser.blockedUsers?.includes(userId) &&
      !followedUser.mutedUsers?.includes(userId)
    )
  }).length
}

/**
 * Check if a user can see another user's content
 * Takes into account mutes, blocks, and privacy settings
 */
export function canUserSeeContent(viewerId: string | null, authorId: string): boolean {
  if (!viewerId || viewerId === authorId) return true

  const users = getUsers()
  const viewer = users.find((u) => u.id === viewerId)
  const author = users.find((u) => u.id === authorId)

  if (!viewer || !author) return false

  // Check blocks (bidirectional)
  if (viewer.blockedUsers?.includes(authorId) || author.blockedUsers?.includes(viewerId)) {
    return false
  }

  // Check mutes (viewer muted author - they won't see author's content)
  if (viewer.mutedUsers?.includes(authorId)) {
    return false
  }

  // Note: Author muting viewer doesn't hide content from viewer
  // (mute is one-way: "I don't want to see your content")

  return true
}

/**
 * Get close friends list for a user
 */
export function getCloseFriends(userId: string): User[] {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  if (!user || !user.closeFriends) return []

  return user.closeFriends
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => u !== undefined)
}

/**
 * Check if a user is in another user's close friends list
 */
export function isCloseFriend(userId: string, friendId: string): boolean {
  const users = getUsers()
  const user = users.find((u) => u.id === userId)
  return user?.closeFriends?.includes(friendId) ?? false
}

/**
 * Check if a post should be visible to a viewer based on privacy settings
 * including close friends list
 */
export function canViewPost(
  viewerId: string | null,
  authorId: string,
  privacy?: "public" | "private" | "followers-only" | "close-friends",
): boolean {
  if (!viewerId || viewerId === authorId) return true

  if (!canUserSeeContent(viewerId, authorId)) {
    return false
  }

  if (!privacy || privacy === "public") return true
  if (privacy === "private") return false

  const users = getUsers()
  const viewer = users.find((u) => u.id === viewerId)
  const author = users.find((u) => u.id === authorId)

  if (!viewer || !author) return false

  if (privacy === "followers-only") {
    return author.followers?.includes(viewerId) ?? false
  }

  if (privacy === "close-friends") {
    return author.closeFriends?.includes(viewerId) ?? false
  }

  return false
}

