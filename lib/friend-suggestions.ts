import { getBlogPosts, getPets, getUsers, getComments, getGroups, getGroupMembersByGroupId } from "./storage"
import type { BlogPost, Pet, User } from "./types"

export interface FriendSuggestion {
  user: User
  score: number
  reasons: string[]
}

interface SuggestionOptions {
  limit?: number
}

const SPECIES_LABELS: Record<Pet["species"], string> = {
  dog: "dogs",
  cat: "cats",
  bird: "birds",
  rabbit: "rabbits",
  hamster: "hamsters",
  fish: "fish",
  other: "pets",
}

function normalizeString(value?: string | null) {
  return value?.trim().toLowerCase() ?? ""
}

function formatList(values: string[], max = 2) {
  const unique = Array.from(new Set(values))
  const trimmed = unique.slice(0, max)
  if (trimmed.length === 0) return ""
  if (trimmed.length === 1) return trimmed[0]
  return trimmed.slice(0, -1).join(", ") + " & " + trimmed.slice(-1)
}

function getLocationMatch(user: User, candidate: User) {
  if (!user.location || !candidate.location) return null
  const [userCity] = user.location.split(",").map((part) => part.trim())
  const [candidateCity] = candidate.location.split(",").map((part) => part.trim())
  if (!userCity || !candidateCity) return null
  if (normalizeString(userCity) === normalizeString(candidateCity)) {
    return userCity
  }
  return null
}

function getRecentPostStats(posts: BlogPost[], days = 30) {
  const now = Date.now()
  const recentThreshold = now - days * 24 * 60 * 60 * 1000
  const recentPosts = posts.filter((post) => {
    const timestamp = new Date(post.createdAt).getTime()
    return Number.isFinite(timestamp) && timestamp >= recentThreshold
  })
  const veryRecentThreshold = now - 7 * 24 * 60 * 60 * 1000
  const veryRecent = recentPosts.some((post) => {
    const timestamp = new Date(post.createdAt).getTime()
    return Number.isFinite(timestamp) && timestamp >= veryRecentThreshold
  })
  return {
    recentPosts,
    veryRecent,
  }
}

function intersection<T>(a: Iterable<T>, b: Iterable<T>) {
  const setB = new Set(b)
  const result: T[] = []
  for (const item of a) {
    if (setB.has(item)) {
      result.push(item)
    }
  }
  return result
}

function formatSpeciesReason(sharedSpecies: Pet["species"][]) {
  if (sharedSpecies.length === 0) return ""
  const labels = sharedSpecies.map((species) => {
    const label = SPECIES_LABELS[species] || "pets"
    return label
  })
  return `Both share a love for ${formatList(labels)}`
}

function formatInterestReason(sharedInterests: string[]) {
  if (sharedInterests.length === 0) return ""
  return `Interested in ${formatList(sharedInterests)}`
}

function formatFavoriteAnimalsReason(sharedFavorites: string[]) {
  if (sharedFavorites.length === 0) return ""
  return `Favorite animals: ${formatList(sharedFavorites)}`
}

function formatHashtagReason(sharedHashtags: string[]) {
  if (sharedHashtags.length === 0) return ""
  return `Following ${formatList(sharedHashtags.map((tag) => `#${tag}`))}`
}

export function getFriendSuggestions(currentUser: User, options: SuggestionOptions = {}): FriendSuggestion[] {
  const limit = options.limit ?? 4
  if (!currentUser) return []

  const allUsers = getUsers()
  const allPets = getPets()
  const allPosts = getBlogPosts()
  const allComments = getComments()
  const allGroups = getGroups()
  
  // Get all group members by iterating through all groups
  const allGroupMembers: Array<{ userId: string; groupId: string; status?: string }> = []
  allGroups.forEach((group) => {
    const members = getGroupMembersByGroupId(group.id)
    members.forEach((member) => {
      allGroupMembers.push({
        userId: member.userId,
        groupId: member.groupId,
        status: member.status,
      })
    })
  })

  const currentUserBlocked = new Set(currentUser.blockedUsers ?? [])
  const currentUserFollowing = new Set(currentUser.following ?? [])
  const currentUserConnections = new Set([...(currentUser.followers ?? []), ...(currentUser.following ?? [])])

  const currentUserPets = allPets.filter((pet) => pet.ownerId === currentUser.id)
  const currentUserSpecies = new Set(currentUserPets.map((pet) => pet.species))
  const currentUserInterestMap = new Map(
    (currentUser.interests ?? []).map((interest) => [interest.toLowerCase(), interest]),
  )
  const currentUserInterests = new Set(currentUserInterestMap.keys())
  const currentUserFavoriteMap = new Map(
    (currentUser.favoriteAnimals ?? []).map((animal) => [animal.toLowerCase(), animal]),
  )
  const currentUserFavorites = new Set(currentUserFavoriteMap.keys())

  const currentUserPosts = allPosts.filter((post) => post.authorId === currentUser.id)
  const currentUserPostIds = new Set(currentUserPosts.map((post) => post.id))
  const postsLikedByCurrentUser = new Set(
    allPosts.filter((post) => post.likes?.includes(currentUser.id)).map((post) => post.id),
  )

  // Get current user's comments to find co-commenters
  const currentUserComments = allComments.filter((comment) => comment.userId === currentUser.id)
  const currentUserCommentedPostIds = new Set(
    currentUserComments.map((comment) => comment.postId).filter((id): id is string => Boolean(id)),
  )
  const currentUserCommentedWikiIds = new Set(
    currentUserComments.map((comment) => comment.wikiArticleId).filter((id): id is string => Boolean(id)),
  )

  // Get current user's groups for group overlap
  const currentUserGroupIds = new Set(
    allGroupMembers
      .filter((member) => member.userId === currentUser.id && member.status === "active")
      .map((member) => member.groupId),
  )

  const userHashtags = new Set(
    currentUserPosts
      .flatMap((post) => post.hashtags ?? post.tags ?? [])
      .map((tag) => tag.toString().replace(/^#/, "").toLowerCase())
      .filter((tag) => tag.length > 0),
  )

  const suggestions: FriendSuggestion[] = []

  for (const candidate of allUsers) {
    if (!candidate) continue
    if (candidate.id === currentUser.id) continue
    if (currentUserFollowing.has(candidate.id)) continue
    if (currentUserBlocked.has(candidate.id)) continue
    if (candidate.blockedUsers?.includes(currentUser.id)) continue
    if (candidate.privacy?.searchable === false) continue

    const reasons: string[] = []
    let score = 0

    const candidateFollowers = new Set(candidate.followers ?? [])
    const candidateFollowing = new Set(candidate.following ?? [])

    const mutualConnections = [
      ...intersection(currentUserConnections, candidateFollowers),
      ...intersection(currentUserConnections, candidateFollowing),
    ]

    if (mutualConnections.length > 0) {
      score += 15 + mutualConnections.length * 3
      const uniqueMutuals = new Set(mutualConnections)
      const mutualCount = uniqueMutuals.size
      reasons.push(`${mutualCount} mutual ${mutualCount === 1 ? "connection" : "connections"}`)
    }

    const candidatePets = allPets.filter((pet) => pet.ownerId === candidate.id)
    const candidateSpecies = new Set(candidatePets.map((pet) => pet.species))
    const sharedSpecies = [...currentUserSpecies].filter((species) => candidateSpecies.has(species))

    if (sharedSpecies.length > 0) {
      score += 12 + sharedSpecies.length * 4
      reasons.push(formatSpeciesReason(sharedSpecies))
    }

    const candidateInterestMap = new Map(
      (candidate.interests ?? []).map((interest) => [interest.toLowerCase(), interest]),
    )
    const candidateInterests = new Set(candidateInterestMap.keys())
    const sharedInterests = [...currentUserInterests].filter((interest) => candidateInterests.has(interest))

    if (sharedInterests.length > 0) {
      score += 10 + sharedInterests.length * 3
      const interestLabels = sharedInterests.map(
        (interest) => currentUserInterestMap.get(interest) ?? candidateInterestMap.get(interest) ?? interest,
      )
      reasons.push(formatInterestReason(interestLabels))
    }

    const candidateFavoriteMap = new Map(
      (candidate.favoriteAnimals ?? []).map((animal) => [animal.toLowerCase(), animal]),
    )
    const candidateFavorites = new Set(candidateFavoriteMap.keys())
    const sharedFavorites = [...currentUserFavorites].filter((animal) => candidateFavorites.has(animal))

    if (sharedFavorites.length > 0) {
      score += 8 + sharedFavorites.length * 2
      const favoriteLabels = sharedFavorites.map(
        (animal) => currentUserFavoriteMap.get(animal) ?? candidateFavoriteMap.get(animal) ?? animal,
      )
      reasons.push(formatFavoriteAnimalsReason(favoriteLabels))
    }

    const locationMatch = getLocationMatch(currentUser, candidate)
    if (locationMatch) {
      score += 8
      reasons.push(`Also in ${locationMatch}`)
    }

    const candidatePosts = allPosts.filter((post) => post.authorId === candidate.id)
    const { recentPosts, veryRecent } = getRecentPostStats(candidatePosts)

    if (recentPosts.length > 0) {
      score += Math.min(recentPosts.length * 4, 16)
      reasons.push(`Active with ${recentPosts.length} recent ${recentPosts.length === 1 ? "post" : "posts"}`)
    } else if (candidatePosts.length > 0) {
      score += 4
    }

    if (veryRecent) {
      score += 5
      reasons.push("Active this week")
    }

    const postsLikedByCandidate = new Set(
      allPosts.filter((post) => post.likes?.includes(candidate.id)).map((post) => post.id),
    )

    const sharedLikedPosts = intersection(postsLikedByCandidate, postsLikedByCurrentUser)
    if (sharedLikedPosts.length > 0) {
      score += 6 + sharedLikedPosts.length * 2
      reasons.push("Reacted to similar posts")
    }

    const engagedWithYourPosts = [...currentUserPosts].some((post) => post.likes?.includes(candidate.id))
    if (engagedWithYourPosts) {
      score += 6
      reasons.push("Engaged with your posts")
    }

    const candidateHashtags = new Set(
      candidatePosts
        .flatMap((post) => post.hashtags ?? post.tags ?? [])
        .map((tag) => tag.toString().replace(/^#/, "").toLowerCase())
        .filter((tag) => tag.length > 0),
    )
    const sharedHashtags = [...userHashtags].filter((tag) => candidateHashtags.has(tag) && tag.length > 0)

    if (sharedHashtags.length > 0) {
      score += 5 + sharedHashtags.length * 2
      reasons.push(formatHashtagReason(sharedHashtags))
    }

    if (candidateFollowing.has(currentUser.id)) {
      score += 5
      reasons.push("Already following you")
    }

    // Co-commenters: Users who have commented on the same posts/wiki articles
    const candidateComments = allComments.filter((comment) => comment.userId === candidate.id)
    const candidateCommentedPostIds = new Set(
      candidateComments.map((comment) => comment.postId).filter((id): id is string => Boolean(id)),
    )
    const candidateCommentedWikiIds = new Set(
      candidateComments.map((comment) => comment.wikiArticleId).filter((id): id is string => Boolean(id)),
    )

    const sharedCommentedPosts = intersection(currentUserCommentedPostIds, candidateCommentedPostIds)
    const sharedCommentedWikis = intersection(currentUserCommentedWikiIds, candidateCommentedWikiIds)
    const totalCoComments = sharedCommentedPosts.length + sharedCommentedWikis.length

    if (totalCoComments > 0) {
      score += 12 + totalCoComments * 2
      const commentCount = totalCoComments
      reasons.push(
        `${commentCount} ${commentCount === 1 ? "shared discussion" : "shared discussions"} on posts or articles`,
      )
    }

    // Group overlap: Users in the same groups
    const candidateGroupIds = new Set(
      allGroupMembers
        .filter((member) => member.userId === candidate.id && member.status === "active")
        .map((member) => member.groupId),
    )

    const sharedGroups = intersection(currentUserGroupIds, candidateGroupIds)
    if (sharedGroups.length > 0) {
      score += 14 + sharedGroups.length * 3
      const groupNames = sharedGroups
        .map((groupId) => {
          const group = allGroups.find((g) => g.id === groupId)
          return group?.name
        })
        .filter((name): name is string => Boolean(name))
        .slice(0, 2)
      const groupCount = sharedGroups.length
      if (groupNames.length > 0) {
        reasons.push(`Member of ${formatList(groupNames)}${groupCount > groupNames.length ? ` and ${groupCount - groupNames.length} more` : ""}`)
      } else {
        reasons.push(`Member of ${groupCount} ${groupCount === 1 ? "shared group" : "shared groups"}`)
      }
    }

    // Encourage discovering new users with well-loved pets
    const candidatePetFollowerScore = candidatePets.reduce((sum, pet) => sum + (pet.followers?.length ?? 0), 0)
    if (candidatePetFollowerScore > 0) {
      score += Math.min(candidatePetFollowerScore, 10)
    }

    // Slight preference for active community members
    score += Math.min(candidate.followers?.length ?? 0, 5)

    if (score <= 0) {
      // Provide a small baseline to prevent all-zero scores
      score = 1
    }

    const uniqueReasons = Array.from(new Set(reasons)).filter(Boolean)

    suggestions.push({
      user: candidate,
      score,
      reasons: uniqueReasons,
    })
  }

  suggestions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const followerDelta = (b.user.followers?.length ?? 0) - (a.user.followers?.length ?? 0)
    if (followerDelta !== 0) return followerDelta
    return normalizeString(a.user.fullName).localeCompare(normalizeString(b.user.fullName))
  })

  return suggestions.slice(0, limit)
}
