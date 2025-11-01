import type { Pet } from "@/lib/types"

export interface MutualFriendSuggestion {
  pet: Pet
  mutualFriends: Pet[]
}

export function findMutualFriendSuggestions(targetPet: Pet | null, allPets: Pet[]): MutualFriendSuggestion[] {
  if (!targetPet || !targetPet.friends || targetPet.friends.length === 0) {
    return []
  }

  const petMap = new Map(allPets.map((pet) => [pet.id, pet]))
  const directFriends = new Set(targetPet.friends)
  const suggestions = new Map<string, Set<string>>()

  for (const friendId of directFriends) {
    const friendPet = petMap.get(friendId)
    if (!friendPet || !friendPet.friends || friendPet.friends.length === 0) {
      continue
    }

    for (const friendOfFriendId of friendPet.friends) {
      if (!friendOfFriendId || friendOfFriendId === targetPet.id || directFriends.has(friendOfFriendId)) {
        continue
      }

      if (!suggestions.has(friendOfFriendId)) {
        suggestions.set(friendOfFriendId, new Set())
      }

      suggestions.get(friendOfFriendId)?.add(friendId)
    }
  }

  const results: MutualFriendSuggestion[] = []

  for (const [candidateId, mutualIds] of suggestions.entries()) {
    const candidatePet = petMap.get(candidateId)
    if (!candidatePet) {
      continue
    }

    const mutualFriends = Array.from(mutualIds)
      .map((id) => petMap.get(id))
      .filter((pet): pet is Pet => Boolean(pet))

    if (mutualFriends.length === 0) {
      continue
    }

    results.push({
      pet: candidatePet,
      mutualFriends,
    })
  }

  return results.sort((a, b) => {
    const mutualDifference = b.mutualFriends.length - a.mutualFriends.length
    if (mutualDifference !== 0) {
      return mutualDifference
    }

    return a.pet.name.localeCompare(b.pet.name)
  })
}
