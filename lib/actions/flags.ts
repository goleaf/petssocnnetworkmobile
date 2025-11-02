"use server"

import { z } from "zod"
import { 
  FeatureFlagSchema, 
  FeatureFlagsSchema,
  type FeatureFlag,
  type FeatureFlags,
  DEFAULT_FLAGS,
  loadFlags,
  saveFlags,
  updateFlag as updateFlagLocal,
  createFlag as createFlagLocal,
  deleteFlag as deleteFlagLocal,
} from "@/lib/flags"

/**
 * Server action: Get all feature flags
 */
export async function getAllFlags(): Promise<FeatureFlags> {
  // In a real app, this would fetch from a database or API
  // For now, we use the client-side storage functions
  // Note: Server actions should ideally use a shared data source
  return loadFlags()
}

/**
 * Server action: Get a specific flag by key
 */
export async function getFlag(key: string): Promise<FeatureFlag | null> {
  const flags = await getAllFlags()
  return flags.flags[key] || null
}

/**
 * Server action: Update a feature flag with validation
 */
const UpdateFlagInputSchema = z.object({
  key: z.string().min(1),
  updates: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
    rolloutNotes: z.string().optional(),
    targetEnvironment: z.enum(["development", "staging", "production", "all"]).optional(),
    killSwitch: z.boolean().optional(),
  }),
  updatedBy: z.string().optional(),
})

export async function updateFlag(
  input: z.infer<typeof UpdateFlagInputSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = UpdateFlagInputSchema.parse(input)
    
    // Update flag
    const success = updateFlagLocal(
      validated.key,
      validated.updates,
      validated.updatedBy
    )
    
    if (!success) {
      return { success: false, error: `Flag ${validated.key} not found` }
    }
    
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation error" }
    }
    return { success: false, error: "Failed to update flag" }
  }
}

/**
 * Server action: Create a new feature flag with validation
 */
const CreateFlagInputSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
  rolloutNotes: z.string().optional(),
  targetEnvironment: z.enum(["development", "staging", "production", "all"]),
  killSwitch: z.boolean(),
  updatedBy: z.string().optional(),
})

export async function createFlag(
  input: z.infer<typeof CreateFlagInputSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = CreateFlagInputSchema.parse(input)
    
    // Create flag
    const success = createFlagLocal({
      key: validated.key,
      name: validated.name,
      description: validated.description,
      enabled: validated.enabled,
      rolloutPercentage: validated.rolloutPercentage,
      rolloutNotes: validated.rolloutNotes,
      targetEnvironment: validated.targetEnvironment,
      killSwitch: validated.killSwitch,
      updatedBy: validated.updatedBy,
    })
    
    if (!success) {
      return { success: false, error: `Flag ${validated.key} already exists` }
    }
    
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation error" }
    }
    return { success: false, error: "Failed to create flag" }
  }
}

/**
 * Server action: Delete a feature flag
 */
const DeleteFlagInputSchema = z.object({
  key: z.string().min(1),
})

export async function deleteFlag(
  input: z.infer<typeof DeleteFlagInputSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = DeleteFlagInputSchema.parse(input)
    
    // Delete flag
    const success = deleteFlagLocal(validated.key)
    
    if (!success) {
      return { success: false, error: `Flag ${validated.key} not found` }
    }
    
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation error" }
    }
    return { success: false, error: "Failed to delete flag" }
  }
}

/**
 * Server action: Toggle kill switch for a flag
 */
const ToggleKillSwitchInputSchema = z.object({
  key: z.string().min(1),
  killSwitch: z.boolean(),
  updatedBy: z.string().optional(),
})

export async function toggleKillSwitch(
  input: z.infer<typeof ToggleKillSwitchInputSchema>
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = ToggleKillSwitchInputSchema.parse(input)
    
    const success = updateFlagLocal(
      validated.key,
      { killSwitch: validated.killSwitch },
      validated.updatedBy
    )
    
    if (!success) {
      return { success: false, error: `Flag ${validated.key} not found` }
    }
    
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation error" }
    }
    return { success: false, error: "Failed to toggle kill switch" }
  }
}

