/**
 * Pet Privacy Utilities
 * Implements privacy checking logic for pet profiles
 * Requirements: 7.3, 7.4, 8.1-8.8
 */

import type { Pet } from "@/lib/types"
import type { PetPrivacySettings } from "@/lib/schemas/pet-schema"

/**
 * Check if a user can view a pet profile
 * @param pet - The pet to check
 * @param viewerId - The ID of the user trying to view (null for anonymous)
 * @param isFollowing - Whether the viewer is following the pet
 * @returns true if the user can view the pet
 */
export function canViewPet(
  pet: Pet,
  viewerId: string | null,
  isFollowing: boolean = false
): boolean {
  // Owner can always view their own pet
  if (viewerId && pet.ownerId === viewerId) {
    return true
  }

  // Get privacy settings with defaults
  const privacy = pet.privacy as PetPrivacySettings | undefined
  const visibility = privacy?.visibility || "public"

  // Public pets can be viewed by anyone
  if (visibility === "public") {
    return true
  }

  // Private pets can only be viewed by owner
  if (visibility === "private") {
    return false
  }

  // Followers-only pets require authentication and following
  if (visibility === "followers-only") {
    if (!viewerId) {
      return false
    }
    return isFollowing || pet.followers?.includes(viewerId) || false
  }

  return false
}

/**
 * Check if a user can edit a pet profile
 * @param pet - The pet to check
 * @param userId - The ID of the user trying to edit
 * @returns true if the user can edit the pet
 */
export function canEditPet(pet: Pet, userId: string | null): boolean {
  if (!userId) {
    return false
  }

  // Owner can always edit their pet
  if (pet.ownerId === userId) {
    return true
  }

  // TODO: Add co-owner support in future tasks
  // For now, only the owner can edit

  return false
}

/**
 * Check if a user can follow a pet
 * @param pet - The pet to check
 * @param userId - The ID of the user trying to follow
 * @returns true if the user can follow the pet
 */
export function canFollowPet(pet: Pet, userId: string | null): boolean {
  if (!userId) {
    return false
  }

  // Cannot follow your own pet
  if (pet.ownerId === userId) {
    return false
  }

  // Cannot follow if already following
  if (pet.followers?.includes(userId)) {
    return false
  }

  // Get privacy settings
  const privacy = pet.privacy as PetPrivacySettings | undefined
  const interactions = privacy?.interactions || "public"

  // Public interaction allows anyone to follow
  if (interactions === "public") {
    return true
  }

  // Private interaction doesn't allow following
  if (interactions === "private") {
    return false
  }

  // Followers-only requires existing follow relationship
  // This creates a chicken-and-egg problem, so we treat it as requiring approval
  if (interactions === "followers-only") {
    // For now, allow follow requests (follow request system to be implemented in future tasks)
    return true
  }

  return false
}

/**
 * Check if a user can view a specific section of a pet profile
 * @param pet - The pet to check
 * @param section - The section to check (photos, health, documents, posts)
 * @param viewerId - The ID of the user trying to view
 * @param isFollowing - Whether the viewer is following the pet
 * @returns true if the user can view the section
 */
export function canViewSection(
  pet: Pet,
  section: "photos" | "health" | "documents" | "posts",
  viewerId: string | null,
  isFollowing: boolean = false
): boolean {
  // Owner can always view all sections
  if (viewerId && pet.ownerId === viewerId) {
    return true
  }

  // First check if user can view the pet at all
  if (!canViewPet(pet, viewerId, isFollowing)) {
    return false
  }

  // Get section-specific privacy settings
  const privacy = pet.privacy as PetPrivacySettings | undefined
  const sectionPrivacy = privacy?.sections?.[section]

  // If no section-specific privacy, use overall visibility
  if (!sectionPrivacy) {
    return true // Already passed canViewPet check
  }

  // Check section-specific privacy
  if (sectionPrivacy === "public") {
    return true
  }

  if (sectionPrivacy === "private") {
    return false
  }

  if (sectionPrivacy === "followers-only") {
    if (!viewerId) {
      return false
    }
    return isFollowing || pet.followers?.includes(viewerId) || false
  }

  return false
}

/**
 * Get the effective privacy level for a pet
 * @param pet - The pet to check
 * @returns The effective privacy level
 */
export function getEffectivePrivacy(
  pet: Pet
): "public" | "followers-only" | "private" {
  const privacy = pet.privacy as PetPrivacySettings | undefined
  return privacy?.visibility || "public"
}

/**
 * Check if a pet profile is publicly visible
 * @param pet - The pet to check
 * @returns true if the pet is public
 */
export function isPublicPet(pet: Pet): boolean {
  return getEffectivePrivacy(pet) === "public"
}

/**
 * Filter pets based on viewer permissions
 * @param pets - Array of pets to filter
 * @param viewerId - The ID of the user viewing
 * @param followingPetIds - Array of pet IDs the viewer is following
 * @returns Filtered array of pets the viewer can see
 */
export function filterViewablePets(
  pets: Pet[],
  viewerId: string | null,
  followingPetIds: string[] = []
): Pet[] {
  return pets.filter((pet) => {
    const isFollowing = followingPetIds.includes(pet.id)
    return canViewPet(pet, viewerId, isFollowing)
  })
}
