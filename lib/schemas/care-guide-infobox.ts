import { z } from "zod"

/**
 * Zod schema for Care Guide infobox data
 * Used for care guide wiki articles
 */
export const careGuideInfoboxSchema = z.object({
  // Guide information
  guideTitle: z.string().min(2, "Guide title must be at least 2 characters").max(200),
  
  category: z.enum(["nutrition", "grooming", "enrichment", "senior-care", "puppy-kitten-care"], {
    required_error: "Category is required",
  }),
  
  // Applicable to
  applicableSpecies: z.array(z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"])).min(1, "At least one species is required"),
  
  applicableAgeGroups: z.array(z.enum(["puppy-kitten", "adult", "senior"])).optional(),
  
  // Frequency/timing
  frequency: z.enum(["daily", "weekly", "bi-weekly", "monthly", "quarterly", "as-needed", "seasonal"]).optional(),
  
  // Time requirements
  estimatedTime: z.string().optional(), // e.g., "15-30 minutes"
  
  // Difficulty
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  
  // Equipment/tools needed
  requiredTools: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Cost estimate
  estimatedCost: z.string().optional(), // e.g., "$20-50 per month"
  
  // Safety information
  safetyWarnings: z.array(z.string().min(2).max(500)).default([]).optional(),
  
  // Related guides
  relatedGuides: z.array(z.string()).default([]).optional(),
  
  // Last updated
  lastUpdatedDate: z.string().optional(),
  
  // Expert reviewer
  expertReviewer: z.string().optional(),
})

export type CareGuideInfoboxInput = z.input<typeof careGuideInfoboxSchema>
export type CareGuideInfoboxOutput = z.output<typeof careGuideInfoboxSchema>

export function parseCareGuideInfobox(data: unknown) {
  return careGuideInfoboxSchema.safeParse(data)
}

export function validateCareGuideInfobox(data: unknown): CareGuideInfoboxOutput {
  return careGuideInfoboxSchema.parse(data)
}

