import type { Pet, User } from "@/lib/types"

export interface SpeciesConnectionStat {
  species: Pet["species"]
  totalPets: number
  connectedPets: number
  averageFriends: number
  crossSpeciesConnections: number
}

export interface SpeciesPairingStat {
  speciesA: Pet["species"]
  speciesB: Pet["species"]
  count: number
}

export interface TopPetConnection {
  petId: string
  petName: string
  species: Pet["species"]
  ownerId: string
  ownerName?: string
  friendCount: number
  mutualFriendCount: number
  crossSpeciesFriendCount: number
}

export interface OwnerPairConnection {
  ownerAId: string
  ownerAName?: string
  ownerBId: string
  ownerBName?: string
  petConnectionCount: number
}

export interface OwnerConnectionStats {
  totalOwners: number
  ownersWithConnections: number
  averageConnectionsPerOwner: number
  crossHouseholdFriendships: number
  sameHouseholdFriendships: number
  topOwnerPairs: OwnerPairConnection[]
}

export interface FriendCategoryUsageEntry {
  categoryId: string
  categoryName: string
  assignments: number
}

export interface FriendCategoryUsage {
  petId: string
  petName: string
  ownerId: string
  ownerName?: string
  totalFriends: number
  categorizedFriends: number
  uncategorizedFriends: number
  categories: FriendCategoryUsageEntry[]
}

export interface RelationshipAnalytics {
  totalPets: number
  connectedPets: number
  isolatedPets: number
  directFriendships: number
  uniqueFriendships: number
  mutualFriendships: number
  oneWayFriendships: number
  reciprocityRate: number
  friendshipDensity: number
  averageFriendsPerPet: number
  medianFriendsPerPet: number
  crossSpeciesFriendships: number
  crossSpeciesRate: number
  speciesStats: SpeciesConnectionStat[]
  speciesPairings: SpeciesPairingStat[]
  topPets: TopPetConnection[]
  ownerConnections: OwnerConnectionStats
  friendCategoryUsage: FriendCategoryUsage[]
}

interface FriendshipEntry {
  petAId: string
  petBId: string
  directions: Set<string>
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  return sorted[middle]
}

function formatPairKey(a: string, b: string): string {
  return [a, b].sort((valueA, valueB) => valueA.localeCompare(valueB)).join("|")
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  if (!map.has(key)) {
    map.set(key, new Set())
  }
  map.get(key)?.add(value)
}

export function computeRelationshipAnalytics(pets: Pet[], users: User[]): RelationshipAnalytics {
  const petMap = new Map(pets.map((pet) => [pet.id, pet]))
  const userMap = new Map(users.map((user) => [user.id, user]))

  const friendCountsByPetId = new Map<
    string,
    { pet: Pet; friendIds: string[]; friendCount: number }
  >()

  const speciesStatsMap = new Map<
    Pet["species"],
    {
      species: Pet["species"]
      totalPets: number
      connectedPets: number
      totalFriends: number
      crossSpeciesConnections: number
    }
  >()

  let directFriendships = 0

  pets.forEach((pet) => {
    const speciesEntry =
      speciesStatsMap.get(pet.species) ??
      {
        species: pet.species,
        totalPets: 0,
        connectedPets: 0,
        totalFriends: 0,
        crossSpeciesConnections: 0,
      }
    speciesEntry.totalPets += 1
    speciesStatsMap.set(pet.species, speciesEntry)

    const seenFriendIds = new Set<string>()
    const validFriendIds: string[] = []

    ;(pet.friends ?? []).forEach((friendId) => {
      if (
        friendId &&
        friendId !== pet.id &&
        !seenFriendIds.has(friendId) &&
        petMap.has(friendId)
      ) {
        seenFriendIds.add(friendId)
        validFriendIds.push(friendId)
      }
    })

    if (validFriendIds.length > 0) {
      speciesEntry.connectedPets += 1
    }
    speciesEntry.totalFriends += validFriendIds.length

    friendCountsByPetId.set(pet.id, {
      pet,
      friendIds: validFriendIds,
      friendCount: validFriendIds.length,
    })
    directFriendships += validFriendIds.length
  })

  const friendshipMap = new Map<string, FriendshipEntry>()

  friendCountsByPetId.forEach(({ pet, friendIds }) => {
    friendIds.forEach((friendId) => {
      const key = formatPairKey(pet.id, friendId)
      const entry =
        friendshipMap.get(key) ??
        {
          petAId: key.split("|")[0],
          petBId: key.split("|")[1],
          directions: new Set<string>(),
        }
      entry.directions.add(`${pet.id}->${friendId}`)
      friendshipMap.set(key, entry)
    })
  })

  const mutualFriendIdsByPet = new Map<string, Set<string>>()
  const crossSpeciesFriendIdsByPet = new Map<string, Set<string>>()
  const speciesPairingsMap = new Map<string, number>()
  const ownerConnectionMap = new Map<string, Set<string>>()
  const ownerPairConnections = new Map<string, Set<string>>()

  let mutualFriendships = 0
  let crossSpeciesFriendships = 0
  let sameHouseholdFriendships = 0
  let crossHouseholdFriendships = 0

  friendshipMap.forEach((entry) => {
    const petA = petMap.get(entry.petAId)
    const petB = petMap.get(entry.petBId)
    if (!petA || !petB) return

    const isMutual = entry.directions.size > 1
    if (isMutual) {
      mutualFriendships += 1
      addToSetMap(mutualFriendIdsByPet, petA.id, petB.id)
      addToSetMap(mutualFriendIdsByPet, petB.id, petA.id)
    }

    const speciesKey = formatPairKey(petA.species, petB.species)
    speciesPairingsMap.set(
      speciesKey,
      (speciesPairingsMap.get(speciesKey) ?? 0) + 1
    )

    if (petA.species !== petB.species) {
      crossSpeciesFriendships += 1
      addToSetMap(crossSpeciesFriendIdsByPet, petA.id, petB.id)
      addToSetMap(crossSpeciesFriendIdsByPet, petB.id, petA.id)

      const speciesEntryA = speciesStatsMap.get(petA.species)
      const speciesEntryB = speciesStatsMap.get(petB.species)
      if (speciesEntryA) {
        speciesEntryA.crossSpeciesConnections += 1
      }
      if (speciesEntryB) {
        speciesEntryB.crossSpeciesConnections += 1
      }
    }

    if (petA.ownerId && petB.ownerId) {
      if (petA.ownerId === petB.ownerId) {
        sameHouseholdFriendships += 1
      } else {
        crossHouseholdFriendships += 1
        addToSetMap(ownerConnectionMap, petA.ownerId, petB.ownerId)
        addToSetMap(ownerConnectionMap, petB.ownerId, petA.ownerId)

        const ownerPairKey = formatPairKey(petA.ownerId, petB.ownerId)
        const petPairKey = formatPairKey(petA.id, petB.id)
        if (!ownerPairConnections.has(ownerPairKey)) {
          ownerPairConnections.set(ownerPairKey, new Set())
        }
        ownerPairConnections.get(ownerPairKey)?.add(petPairKey)
      }
    }
  })

  const uniqueFriendships = friendshipMap.size
  const oneWayFriendships = uniqueFriendships - mutualFriendships
  const totalPets = pets.length
  const connectedPets = Array.from(friendCountsByPetId.values()).filter(
    ({ friendCount }) => friendCount > 0
  ).length
  const isolatedPets = totalPets - connectedPets
  const reciprocityRate =
    uniqueFriendships > 0 ? mutualFriendships / uniqueFriendships : 0
  const friendshipDensity =
    totalPets > 1
      ? uniqueFriendships / ((totalPets * (totalPets - 1)) / 2)
      : 0
  const averageFriendsPerPet =
    totalPets > 0 ? directFriendships / totalPets : 0
  const medianFriendsPerPet = median(
    Array.from(friendCountsByPetId.values()).map(({ friendCount }) => friendCount)
  )
  const crossSpeciesRate =
    uniqueFriendships > 0 ? crossSpeciesFriendships / uniqueFriendships : 0

  const speciesStats: SpeciesConnectionStat[] = Array.from(
    speciesStatsMap.values()
  ).map((entry) => ({
    species: entry.species,
    totalPets: entry.totalPets,
    connectedPets: entry.connectedPets,
    averageFriends:
      entry.totalPets > 0 ? entry.totalFriends / entry.totalPets : 0,
    crossSpeciesConnections: entry.crossSpeciesConnections,
  }))

  const speciesPairings: SpeciesPairingStat[] = Array.from(
    speciesPairingsMap.entries()
  )
    .map(([key, count]) => {
      const [speciesA, speciesB] = key.split("|") as [Pet["species"], Pet["species"]]
      return {
        speciesA,
        speciesB,
        count,
      }
    })
    .sort((a, b) => b.count - a.count)

  const topPets: TopPetConnection[] = Array.from(
    friendCountsByPetId.values()
  )
    .map(({ pet, friendCount }) => {
      const ownerName = pet.ownerId ? userMap.get(pet.ownerId)?.fullName : undefined
      const mutualCount = mutualFriendIdsByPet.get(pet.id)?.size ?? 0
      const crossSpeciesCount = crossSpeciesFriendIdsByPet.get(pet.id)?.size ?? 0
      return {
        petId: pet.id,
        petName: pet.name,
        species: pet.species,
        ownerId: pet.ownerId,
        ownerName,
        friendCount,
        mutualFriendCount: mutualCount,
        crossSpeciesFriendCount: crossSpeciesCount,
      }
    })
    .sort((a, b) => {
      if (b.friendCount !== a.friendCount) {
        return b.friendCount - a.friendCount
      }
      if (b.mutualFriendCount !== a.mutualFriendCount) {
        return b.mutualFriendCount - a.mutualFriendCount
      }
      return a.petName.localeCompare(b.petName)
    })
    .slice(0, 5)

  const totalOwners = users.length
  const ownersWithConnections = Array.from(ownerConnectionMap.entries()).filter(
    ([, connections]) => connections.size > 0
  )
  const averageConnectionsPerOwner =
    ownersWithConnections.length > 0
      ? ownersWithConnections.reduce((sum, [, connections]) => sum + connections.size, 0) /
        ownersWithConnections.length
      : 0

  const topOwnerPairs: OwnerPairConnection[] = Array.from(
    ownerPairConnections.entries()
  )
    .map(([ownerPairKey, petPairs]) => {
      const [ownerAId, ownerBId] = ownerPairKey.split("|")
      const ownerAName = userMap.get(ownerAId)?.fullName
      const ownerBName = userMap.get(ownerBId)?.fullName
      return {
        ownerAId,
        ownerAName,
        ownerBId,
        ownerBName,
        petConnectionCount: petPairs.size,
      }
    })
    .sort((a, b) => b.petConnectionCount - a.petConnectionCount)
    .slice(0, 5)

  const friendCategoryUsage: FriendCategoryUsage[] = Array.from(
    friendCountsByPetId.values()
  )
    .map(({ pet, friendIds, friendCount }) => {
      const assignments = pet.friendCategoryAssignments ?? {}
      const categories = pet.friendCategories ?? []
      const categoryById = new Map(categories.map((category) => [category.id, category.name]))
      const categoryCounts = new Map<string, number>()
      const categorizedFriendIds = new Set<string>()

      Object.entries(assignments).forEach(([friendId, categoryId]) => {
        if (!friendId || !categoryId || !friendIds.includes(friendId)) {
          return
        }
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1)
        categorizedFriendIds.add(friendId)
      })

      const categoriesUsage: FriendCategoryUsageEntry[] = []
      categoryCounts.forEach((count, categoryId) => {
        categoriesUsage.push({
          categoryId,
          categoryName: categoryById.get(categoryId) ?? "Unknown Category",
          assignments: count,
        })
      })

      const uncategorizedFriends = friendIds.filter((friendId) => {
        const categoryId = assignments[friendId]
        return !categoryId
      }).length

      const categorizedFriends = Math.max(friendCount - uncategorizedFriends, 0)

      const ownerName = pet.ownerId ? userMap.get(pet.ownerId)?.fullName : undefined

      return {
        petId: pet.id,
        petName: pet.name,
        ownerId: pet.ownerId,
        ownerName,
        totalFriends: friendCount,
        categorizedFriends,
        uncategorizedFriends,
        categories: categoriesUsage.sort((a, b) => b.assignments - a.assignments),
      }
    })
    .filter((entry) => entry.totalFriends > 0)
    .sort((a, b) => b.totalFriends - a.totalFriends)

  return {
    totalPets,
    connectedPets,
    isolatedPets,
    directFriendships,
    uniqueFriendships,
    mutualFriendships,
    oneWayFriendships,
    reciprocityRate,
    friendshipDensity,
    averageFriendsPerPet,
    medianFriendsPerPet,
    crossSpeciesFriendships,
    crossSpeciesRate,
    speciesStats,
    speciesPairings,
    topPets,
    ownerConnections: {
      totalOwners,
      ownersWithConnections: ownersWithConnections.length,
      averageConnectionsPerOwner,
      crossHouseholdFriendships,
      sameHouseholdFriendships,
      topOwnerPairs,
    },
    friendCategoryUsage,
  }
}
