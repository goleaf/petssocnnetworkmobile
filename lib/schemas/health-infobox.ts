import { z } from "zod"

/**
 * Zod schema for Health infobox data
 * Used for health-related wiki articles
 */
export const healthInfoboxSchema = z.object({
  // Condition information
  conditionName: z.string().min(2, "Condition name must be at least 2 characters").max(100),
  
  urgency: z.enum(["emergency", "urgent", "routine"], {
    required_error: "Urgency level is required",
  }),
  
  // Symptoms
  symptoms: z.array(z.string().min(2).max(200)).min(1, "At least one symptom is required"),
  
  // Age-related
  onsetAge: z.string().optional(),
  commonInSpecies: z.array(z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"])).optional(),
  
  // Risk factors
  riskFactors: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Diagnosis
  diagnosisMethods: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Treatment
  treatments: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Prevention
  prevention: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Review information
  lastReviewedDate: z.string().optional(),
  expertReviewer: z.string().optional(),
  
  // Additional resources
  relatedConditions: z.array(z.string()).default([]).optional(),
  severityLevel: z.enum(["mild", "moderate", "severe", "life-threatening"]).optional(),
})

export type HealthInfoboxInput = z.input<typeof healthInfoboxSchema>
export type HealthInfoboxOutput = z.output<typeof healthInfoboxSchema>

export function parseHealthInfobox(data: unknown) {
  return healthInfoboxSchema.safeParse(data)
}

export function validateHealthInfobox(data: unknown): HealthInfoboxOutput {
  return healthInfoboxSchema.parse(data)
}

