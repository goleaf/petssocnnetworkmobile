/**
 * Pet Service Layer
 * Core CRUD operations for pet profiles
 * Requirements: 1.1, 1.4, 1.5, 7.3, 7.4, 8.1-8.8
 */

import { prisma } from "@/lib/prisma"
import type { Pet } from "@/lib/types"
import {
  createPetSchema,
  updatePetSchema,
  type CreatePetInput,
  type UpdatePetInput,
} from "@/lib/schemas/pet-schema"
import { canEditPet } from "@/lib/utils/pet-privacy"

/**
 * Generate a URL-friendly slug for a pet
 * Format: {pet-name}-{owner-username}
 * @param petName - The pet's name
 * @param ownerUsername - The owner's username
 * @returns URL-friendly slug
 */
export function generatePetSlug(petName: string, ownerUsername: string): string {
  // Convert to lowercase and replace spaces/special chars with hyphens
  const cleanPetName = petName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen

  const cleanOwnerUsername = ownerUsername
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, "")

  return `${cleanPetName}-${cleanOwnerUsername}`
}

/**
 * Ensure slug is unique by appending a number if needed
 * @param baseSlug - The base slug to check
 * @param ownerId - The owner's ID
 * @param excludePetId - Pet ID to exclude from uniqueness check (for updates)
 * @returns Unique slug
 */
async function ensureUniqueSlug(
  baseSlug: string,
  ownerId: string,
  excludePetId?: string
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.pet.findUnique({
      where: {
        ownerId_slug: {
          ownerId,
          slug,
        },
      },
      select: { id: true },
    })

    // If no existing pet or it's the same pet we're updating, slug is unique
    if (!existing || existing.id === excludePetId) {
      return slug
    }

    // Try next number
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Create a new pet profile
 * @param ownerId - The ID of the pet owner
 * @param ownerUsername - The username of the pet owner
 * @param data - Pet creation data
 * @returns Created pet
 */
export async function createPet(
  ownerId: string,
  ownerUsername: string,
  data: CreatePetInput
): Promise<Pet> {
  // Validate input
  const validatedData = createPetSchema.parse(data)

  // Generate slug
  const baseSlug = generatePetSlug(validatedData.name, ownerUsername)
  const slug = await ensureUniqueSlug(baseSlug, ownerId)

  // Prepare data for database
  const petData = {
    ownerId,
    slug,
    name: validatedData.name,
    species: validatedData.species,
    breedId: validatedData.breedId,
    breed: validatedData.breed,
    gender: validatedData.gender,
    birthday: validatedData.birthday,
    approximateAge: validatedData.approximateAge
      ? (validatedData.approximateAge as any)
      : undefined,
    adoptionDate: validatedData.adoptionDate,
    color: validatedData.color,
    markings: validatedData.markings,
    weight: validatedData.weight,
    weightUnit: validatedData.weightUnit,
    spayedNeutered: validatedData.spayedNeutered,
    primaryPhotoUrl: validatedData.primaryPhotoUrl,
    coverPhoto: validatedData.coverPhoto,
    personality: validatedData.personality
      ? (validatedData.personality as any)
      : undefined,
    specialNeeds: validatedData.specialNeeds,
    microchipId: validatedData.microchipId,
    microchipCompany: validatedData.microchipCompany,
    microchipRegistrationStatus: validatedData.microchipRegistrationStatus,
    microchipCertificateUrl: validatedData.microchipCertificateUrl,
    collarTagId: validatedData.collarTagId,
    insurancePolicyNumber: validatedData.insurancePolicyNumber,
    vetClinicName: validatedData.vetClinicName,
    vetClinicContact: validatedData.vetClinicContact,
    allergies: validatedData.allergies || [],
    allergySeverities: validatedData.allergySeverities
      ? (validatedData.allergySeverities as any)
      : undefined,
    medications: validatedData.medications
      ? (validatedData.medications as any)
      : undefined,
    conditions: validatedData.conditions
      ? (validatedData.conditions as any)
      : undefined,
    bio: validatedData.bio,
    isFeatured: validatedData.isFeatured,
    privacy: validatedData.privacy ? (validatedData.privacy as any) : undefined,
    followers: [],
    followRequests: [],
  }

  // Create pet in database
  const pet = await prisma.pet.create({
    data: petData,
  })

  // Create initial timeline event
  await prisma.petTimelineEvent.create({
    data: {
      petId: pet.id,
      type: "added_to_family",
      title: "Added to family",
      description: `${pet.name} joined the family!`,
      date: validatedData.adoptionDate
        ? new Date(validatedData.adoptionDate)
        : new Date(),
      visibility: "public",
    },
  })

  return pet as unknown as Pet
}

/**
 * Get a pet by ID
 * @param petId - The pet's ID
 * @returns Pet or null if not found
 */
export async function getPetById(petId: string): Promise<Pet | null> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      photos: {
        orderBy: { order: "asc" },
      },
      timelineEvents: {
        orderBy: { date: "desc" },
        take: 10, // Get latest 10 events
      },
    },
  })

  return pet as unknown as Pet | null
}

/**
 * Get a pet by slug and owner username
 * @param slug - The pet's slug
 * @param ownerId - The owner's ID
 * @returns Pet or null if not found
 */
export async function getPetBySlug(
  slug: string,
  ownerId: string
): Promise<Pet | null> {
  const pet = await prisma.pet.findUnique({
    where: {
      ownerId_slug: {
        ownerId,
        slug,
      },
    },
    include: {
      photos: {
        orderBy: { order: "asc" },
      },
      timelineEvents: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  })

  return pet as unknown as Pet | null
}

/**
 * Get all pets for an owner
 * @param ownerId - The owner's ID
 * @returns Array of pets
 */
export async function getPetsByOwnerId(ownerId: string): Promise<Pet[]> {
  const pets = await prisma.pet.findMany({
    where: {
      ownerId,
      deletedAt: null,
    },
    include: {
      photos: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return pets as unknown as Pet[]
}

/**
 * Update a pet profile
 * @param petId - The pet's ID
 * @param userId - The ID of the user making the update
 * @param data - Update data
 * @returns Updated pet
 */
export async function updatePet(
  petId: string,
  userId: string,
  data: UpdatePetInput
): Promise<Pet> {
  // Get existing pet
  const existingPet = await getPetById(petId)
  if (!existingPet) {
    throw new Error("Pet not found")
  }

  // Check permissions
  if (!canEditPet(existingPet, userId)) {
    throw new Error("Unauthorized to edit this pet")
  }

  // Validate input
  const validatedData = updatePetSchema.parse(data)

  // If name is being updated, regenerate slug
  let slug = existingPet.slug
  if (validatedData.name && validatedData.name !== existingPet.name) {
    // Get owner username
    const owner = await prisma.user.findUnique({
      where: { id: existingPet.ownerId },
      select: { username: true },
    })

    if (owner) {
      const baseSlug = generatePetSlug(validatedData.name, owner.username)
      slug = await ensureUniqueSlug(baseSlug, existingPet.ownerId, petId)
    }
  }

  // Prepare update data
  const updateData: any = {
    ...validatedData,
    slug,
  }

  // Handle JSON fields
  if (validatedData.approximateAge !== undefined) {
    updateData.approximateAge = validatedData.approximateAge
  }
  if (validatedData.personality !== undefined) {
    updateData.personality = validatedData.personality
  }
  if (validatedData.allergySeverities !== undefined) {
    updateData.allergySeverities = validatedData.allergySeverities
  }
  if (validatedData.medications !== undefined) {
    updateData.medications = validatedData.medications
  }
  if (validatedData.conditions !== undefined) {
    updateData.conditions = validatedData.conditions
  }
  if (validatedData.privacy !== undefined) {
    updateData.privacy = validatedData.privacy
  }

  // Update pet
  const updatedPet = await prisma.pet.update({
    where: { id: petId },
    data: updateData,
    include: {
      photos: {
        orderBy: { order: "asc" },
      },
      timelineEvents: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  })

  return updatedPet as unknown as Pet
}

/**
 * Delete a pet profile (soft delete)
 * @param petId - The pet's ID
 * @param userId - The ID of the user making the deletion
 */
export async function deletePet(petId: string, userId: string): Promise<void> {
  // Get existing pet
  const existingPet = await getPetById(petId)
  if (!existingPet) {
    throw new Error("Pet not found")
  }

  // Check permissions
  if (!canEditPet(existingPet, userId)) {
    throw new Error("Unauthorized to delete this pet")
  }

  // Soft delete
  await prisma.pet.update({
    where: { id: petId },
    data: {
      deletedAt: new Date(),
    },
  })
}

/**
 * Calculate pet statistics
 * @param petId - The pet's ID
 * @returns Statistics object
 */
export async function calculatePetStats(petId: string): Promise<{
  followers: number
  posts: number
  photos: number
}> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: {
      followers: true,
      _count: {
        select: {
          photos: true,
        },
      },
    },
  })

  if (!pet) {
    return { followers: 0, posts: 0, photos: 0 }
  }

  // Count posts that tag this pet
  const postsCount = await prisma.post.count({
    where: {
      petTags: {
        has: petId,
      },
      deletedAt: null,
    },
  })

  return {
    followers: pet.followers?.length || 0,
    posts: postsCount,
    photos: pet._count.photos,
  }
}

/**
 * Add a follower to a pet
 * @param petId - The pet's ID
 * @param userId - The user ID to add as follower
 */
export async function followPet(petId: string, userId: string): Promise<void> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { followers: true },
  })

  if (!pet) {
    throw new Error("Pet not found")
  }

  const followers = (pet.followers as string[]) || []
  if (!followers.includes(userId)) {
    await prisma.pet.update({
      where: { id: petId },
      data: {
        followers: [...followers, userId],
      },
    })
  }
}

/**
 * Remove a follower from a pet
 * @param petId - The pet's ID
 * @param userId - The user ID to remove as follower
 */
export async function unfollowPet(petId: string, userId: string): Promise<void> {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { followers: true },
  })

  if (!pet) {
    throw new Error("Pet not found")
  }

  const followers = (pet.followers as string[]) || []
  await prisma.pet.update({
    where: { id: petId },
    data: {
      followers: followers.filter((id: string) => id !== userId),
    },
  })
}
