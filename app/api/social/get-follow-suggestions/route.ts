import { NextRequest, NextResponse } from "next/server"
import { getFriendSuggestions } from "@/lib/friend-suggestions"
import { getUsers, getGroups, getAllGroupMembersPublic, getComments, getBlogPosts } from "@/lib/storage"
import type { User } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const users = getUsers()
    const currentUser = users.find((u) => u.id === userId)

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get enhanced suggestions with mutuals, group overlap, co-commenters
    const suggestions = getFollowSuggestions(currentUser, {
      includeMutuals: true,
      includeGroupOverlap: true,
      includeCoCommenters: true,
      limit: 20,
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error getting follow suggestions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

interface FollowSuggestionOptions {
  includeMutuals?: boolean
  includeGroupOverlap?: boolean
  includeCoCommenters?: boolean
  limit?: number
}

function getFollowSuggestions(
  currentUser: User,
  options: FollowSuggestionOptions = {},
): Array<{
  user: User
  score: number
  reasons: string[]
  mutualCount?: number
  sharedGroups?: number
  coCommentCount?: number
}> {
  const {
    includeMutuals = true,
    includeGroupOverlap = true,
    includeCoCommenters = true,
    limit = 20,
  } = options

  const allUsers = getUsers()
  const allGroups = getGroups()
  const allGroupMembers = getAllGroupMembersPublic()
  const allComments = getComments()
  const allPosts = getBlogPosts()

  const currentUserFollowing = new Set(currentUser.following ?? [])
  const currentUserFollowers = new Set(currentUser.followers ?? [])
  const currentUserBlocked = new Set(currentUser.blockedUsers ?? [])
  const currentUserMuted = new Set(currentUser.mutedUsers ?? [])

  // Get groups where current user is a member
  const currentUserGroupIds = new Set(
    allGroupMembers
      .filter((member) => member.userId === currentUser.id)
      .map((m) => m.groupId),
  )
  const currentUserOwnedGroups = new Set(
    allGroups.filter((g) => g.ownerId === currentUser.id).map((g) => g.id),
  )
  const currentUserGroups = new Set([...currentUserGroupIds, ...currentUserOwnedGroups])

  // Get posts where current user has commented
  const currentUserCommentPostIds = new Set(
    allComments.filter((c) => c.userId === currentUser.id && c.postId).map((c) => c.postId!),
  )

  const suggestions: Array<{
    user: User
    score: number
    reasons: string[]
    mutualCount?: number
    sharedGroups?: number
    coCommentCount?: number
  }> = []

  for (const candidate of allUsers) {
    if (candidate.id === currentUser.id) continue
    if (currentUserFollowing.has(candidate.id)) continue
    if (currentUserBlocked.has(candidate.id)) continue
    if (currentUserMuted.has(candidate.id)) continue
    if (candidate.blockedUsers?.includes(currentUser.id)) continue
    if (candidate.mutedUsers?.includes(currentUser.id)) continue
    if (candidate.privacy?.searchable === false) continue
    if ((candidate.privacy as any)?.showInRecommendations === false) continue

    let score = 0
    const reasons: string[] = []
    let mutualCount = 0
    let sharedGroups = 0
    let coCommentCount = 0

    // Mutual connections
    if (includeMutuals) {
      const candidateFollowing = new Set(candidate.following ?? [])
      const candidateFollowers = new Set(candidate.followers ?? [])

      const mutuals = [
        ...Array.from(currentUserFollowing).filter((id) => candidateFollowers.has(id)),
        ...Array.from(currentUserFollowers).filter((id) => candidateFollowing.has(id)),
      ]
      mutualCount = new Set(mutuals).size

      if (mutualCount > 0) {
        score += 15 + mutualCount * 3
        reasons.push(`${mutualCount} mutual ${mutualCount === 1 ? "connection" : "connections"}`)
      }
    }

    // Group overlap
    if (includeGroupOverlap) {
      const candidateGroupIds = new Set(
        allGroupMembers.filter((member) => member.userId === candidate.id).map((m) => m.groupId),
      )
      const candidateOwnedGroups = new Set(
        allGroups.filter((g) => g.ownerId === candidate.id).map((g) => g.id),
      )
      const candidateGroups = new Set([...candidateGroupIds, ...candidateOwnedGroups])

      const shared = Array.from(currentUserGroups).filter((id) => candidateGroups.has(id))
      sharedGroups = shared.length

      if (sharedGroups > 0) {
        score += 12 + sharedGroups * 4
        const groupNames = allGroups
          .filter((g) => shared.includes(g.id))
          .slice(0, 2)
          .map((g) => g.name)
        if (groupNames.length > 0) {
          reasons.push(`In ${groupNames.join(", ")}${sharedGroups > 2 ? ` +${sharedGroups - 2} more` : ""}`)
        } else {
          reasons.push(`In ${sharedGroups} shared ${sharedGroups === 1 ? "group" : "groups"}`)
        }
      }
    }

    // Co-commenters
    if (includeCoCommenters) {
      const candidateCommentPostIds = new Set(
        allComments.filter((c) => c.userId === candidate.id && c.postId).map((c) => c.postId!),
      )

      const sharedPosts = Array.from(currentUserCommentPostIds).filter((id) =>
        candidateCommentPostIds.has(id),
      )
      coCommentCount = sharedPosts.length

      if (coCommentCount > 0) {
        score += 10 + Math.min(coCommentCount * 2, 20)
        reasons.push(
          `Commented on ${coCommentCount} shared ${coCommentCount === 1 ? "post" : "posts"}`,
        )
      }
    }

    // Base score from existing friend suggestions logic
    const baseSuggestions = getFriendSuggestions(currentUser, { limit: 100 })
    const baseSuggestion = baseSuggestions.find((s) => s.user.id === candidate.id)
    if (baseSuggestion) {
      score += baseSuggestion.score
      reasons.push(...baseSuggestion.reasons)
    }

    if (score > 0 || mutualCount > 0 || sharedGroups > 0 || coCommentCount > 0) {
      suggestions.push({
        user: candidate,
        score,
        reasons: Array.from(new Set(reasons)),
        mutualCount,
        sharedGroups,
        coCommentCount,
      })
    }
  }

  // Sort by score descending
  suggestions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (b.user.followers?.length ?? 0) - (a.user.followers?.length ?? 0)
  })

  return suggestions.slice(0, limit)
}
