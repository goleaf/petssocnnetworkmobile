/**
 * Utility to generate a large number of groups
 */

import type { Group, GroupMember } from "./types"
import { generateGroupsForAnimal } from "./generate-groups"
import { addGroup, addGroupMember, generateStorageId, getAllGroups } from "./storage"

// Animal category mapping
const animalCategoryMap: Record<string, string> = {
  dog: "cat-dogs",
  cat: "cat-cats",
  bird: "cat-birds",
  rabbit: "cat-rabbits",
  hamster: "cat-hamsters",
  fish: "cat-fish",
  turtle: "cat-turtles",
  snake: "cat-snakes",
  lizard: "cat-lizards",
  "guinea-pig": "cat-guinea-pigs",
  ferret: "cat-ferrets",
  chinchilla: "cat-chinchillas",
  hedgehog: "cat-hedgehogs",
  gerbil: "cat-gerbils",
  mouse: "cat-mice",
  rat: "cat-rats",
}

/**
 * Generate and add many groups to storage
 * @param groupsPerAnimal - Number of groups to generate per animal type (default: 50)
 * @returns Object with statistics about generated groups
 */
export function generateManyGroups(groupsPerAnimal: number = 50): {
  success: boolean
  totalGenerated: number
  groupsByAnimal: Record<string, number>
  errors: string[]
} {
  const errors: string[] = []
  const groupsByAnimal: Record<string, number> = {}
  let totalGenerated = 0

  // Get existing groups to determine starting ID
  const existingGroups = getAllGroups()
  let groupIdCounter = existingGroups.length + 1

  // Generate groups for each animal type
  Object.entries(animalCategoryMap).forEach(([animalType, categoryId]) => {
    try {
      // Generate groups
      const groups = generateGroupsForAnimal(
        animalType,
        categoryId,
        groupsPerAnimal,
        groupIdCounter
      )

      // Add each group to storage
      groups.forEach((group) => {
        try {
          addGroup(group)

          // Add owner as member
          const ownerMember: GroupMember = {
            id: generateStorageId("group_member"),
            groupId: group.id,
            userId: group.ownerId,
            role: "owner",
            joinedAt: group.createdAt,
            status: "active",
            permissions: {
              canPost: true,
              canComment: true,
              canCreateTopic: true,
              canCreatePoll: true,
              canCreateEvent: true,
              canModerate: true,
              canManageMembers: true,
              canManageSettings: true,
            },
          }

          addGroupMember(ownerMember)
          totalGenerated++
        } catch (error) {
          errors.push(`Failed to add group ${group.id}: ${error}`)
        }
      })

      groupsByAnimal[animalType] = groups.length
      groupIdCounter += groups.length
    } catch (error) {
      errors.push(`Failed to generate groups for ${animalType}: ${error}`)
    }
  })

  return {
    success: errors.length === 0,
    totalGenerated,
    groupsByAnimal,
    errors,
  }
}

/**
 * Generate additional groups with custom parameters
 * @param animalType - Animal type to generate groups for
 * @param count - Number of groups to generate
 * @param categoryId - Category ID for the groups
 * @returns Number of groups successfully generated
 */
export function generateGroupsForCategory(
  animalType: string,
  count: number,
  categoryId: string
): number {
  const existingGroups = getAllGroups()
  let groupIdCounter = existingGroups.length + 1

  const groups = generateGroupsForAnimal(animalType, categoryId, count, groupIdCounter)

  groups.forEach((group) => {
    addGroup(group)

    // Add owner as member
    const ownerMember: GroupMember = {
      id: generateStorageId("group_member"),
      groupId: group.id,
      userId: group.ownerId,
      role: "owner",
      joinedAt: group.createdAt,
      status: "active",
      permissions: {
        canPost: true,
        canComment: true,
        canCreateTopic: true,
        canCreatePoll: true,
        canCreateEvent: true,
        canModerate: true,
        canManageMembers: true,
        canManageSettings: true,
      },
    }

    addGroupMember(ownerMember)
  })

  return groups.length
}

