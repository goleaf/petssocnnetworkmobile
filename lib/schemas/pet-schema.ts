import { z } from "zod"

/**
 * Zod schema for pet creation and validation
 * Based on requirements from pet-profile-system spec
 */

// Privacy settings schema
export const petPrivacySettingsSchema = z.object({
  visibility: z.enum(["public", "followers-only", "private"]).default("public"),
  interactions: z.enum(["public", "followers-only", "private"]).default("public"),
  sections: z
    .object({
      photos: z.enum(["public", "followers-only", "private"]).optional(),
      health: z.enum(["public", "followers-only", "private"]).optional(),
      documents: z.enum(["public", "followers-only", "private"]).optional(),
      posts: z.enum(["public", "followers-only", "private"]).optional(),
    })
    .optional(),
})

// Personality traits schema
export const personalityTraitsSchema = z.object({
  traits: z.array(z.string()).max(10).optional(),
  customTraits: z.array(z.string()).optional(),
  favoriteActivities: z.array(z.string()).optional(),
  favoriteTreats: z.string().max(200).optional(),
  favoriteToys: z.string().max(200).optional(),
  dislikes: z.string().max(300).optional(),
})

// Medication schema
export const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string(),
  frequency: z.string(),
  purpose: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

// Condition schema
export const conditionSchema = z.object({
  name: z.string().min(1),
  diagnosedAt: z.string().optional(),
  notes: z.string().optional(),
})

// Weight history entry schema
export const weightHistoryEntrySchema = z.object({
  date: z.string(),
  weight: z.number().positive(),
  unit: z.enum(["lbs", "kg"]),
  notes: z.string().optional(),
})

// Core pet creation schema
export const createPetSchema = z.object({
  // Basic information (Step 1)
  name: z
    .string()
    .min(2, "Pet name must be at least 2 characters")
    .max(50, "Pet name must be at most 50 characters"),
  species: z.enum([
    "dog",
    "cat",
    "bird",
    "rabbit",
    "guinea_pig",
    "hamster",
    "fish",
    "reptile",
    "horse",
    "farm_animal",
    "other",
  ]),
  breedId: z.string().uuid().optional(),
  breed: z.string().optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  birthday: z.string().optional(),
  approximateAge: z
    .object({
      years: z.number().int().min(0).optional(),
      months: z.number().int().min(0).max(11).optional(),
    })
    .optional(),
  adoptionDate: z.string().optional(),
  color: z.string().max(100).optional(),
  markings: z.string().max(500).optional(),
  weight: z.string().optional(),
  weightUnit: z.enum(["lbs", "kg"]).optional(),
  spayedNeutered: z.boolean().default(false),

  // Photos (Step 2)
  primaryPhotoUrl: z.string().url().optional(),
  coverPhoto: z.string().url().optional(),

  // Personality (Step 3)
  personality: personalityTraitsSchema.optional(),
  specialNeeds: z.string().max(500).optional(),

  // Identification (Step 4)
  microchipId: z
    .string()
    .regex(/^\d{15}$/, "Microchip ID must be exactly 15 digits")
    .optional(),
  microchipCompany: z.string().optional(),
  microchipRegistrationStatus: z
    .enum(["registered", "not_registered", "unknown"])
    .optional(),
  microchipCertificateUrl: z.string().url().optional(),
  collarTagId: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),

  // Medical (Step 5)
  vetClinicName: z.string().optional(),
  vetClinicContact: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  allergySeverities: z.record(z.enum(["mild", "moderate", "severe"])).optional(),
  medications: z.array(medicationSchema).optional(),
  conditions: z.array(conditionSchema).optional(),

  // Bio & Privacy (Step 6)
  bio: z.string().max(1000).optional(),
  isFeatured: z.boolean().default(false),
  privacy: petPrivacySettingsSchema.optional(),
})

// Update pet schema (partial of create schema)
export const updatePetSchema = createPetSchema.partial()

// Schema for slug generation input
export const slugInputSchema = z.object({
  petName: z.string().min(1),
  ownerUsername: z.string().min(1),
})

// Export types
export type CreatePetInput = z.infer<typeof createPetSchema>
export type UpdatePetInput = z.infer<typeof updatePetSchema>
export type PetPrivacySettings = z.infer<typeof petPrivacySettingsSchema>
export type PersonalityTraits = z.infer<typeof personalityTraitsSchema>
export type Medication = z.infer<typeof medicationSchema>
export type Condition = z.infer<typeof conditionSchema>
export type WeightHistoryEntry = z.infer<typeof weightHistoryEntrySchema>
