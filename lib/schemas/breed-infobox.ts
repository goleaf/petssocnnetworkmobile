import { z } from "zod"

/**
 * Zod schema for Breed infobox data
 * Used for wiki articles in the "breeds" category
 */
export const breedInfoboxSchema = z.object({
  // Basic information
  species: z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"], {
    required_error: "Species is required",
    invalid_type_error: "Species must be one of the valid options",
  }),
  
  officialName: z.string().min(2, "Official name must be at least 2 characters").max(100, "Official name must be less than 100 characters"),
  
  aliases: z.array(z.string().min(1).max(50)).default([]).optional(),
  
  originCountry: z.string().min(2, "Origin country must be at least 2 characters").max(100, "Origin country must be less than 100 characters").optional(),
  
  // Physical characteristics
  sizeClass: z.enum(["toy", "small", "medium", "large", "giant"], {
    required_error: "Size class is required",
    invalid_type_error: "Size class must be one of: toy, small, medium, large, giant",
  }).optional(),
  
  maleAvgWeightKg: z.number().positive("Male average weight must be positive").max(100, "Male average weight must be less than 100kg").optional(),
  femaleAvgWeightKg: z.number().positive("Female average weight must be positive").max(100, "Female average weight must be less than 100kg").optional(),
  
  lifeExpectancyYears: z.number().positive("Life expectancy must be positive").max(50, "Life expectancy must be less than 50 years").optional(),
  
  coatType: z.string().min(2, "Coat type must be at least 2 characters").max(50, "Coat type must be less than 50 characters").optional(),
  
  colorVariants: z.array(z.string().min(1).max(50)).default([]).optional(),
  
  // Behavioral traits (using scale 1-5)
  activityNeeds: z.number().int().min(1).max(5).optional(),
  trainability: z.number().int().min(1).max(5).optional(),
  
  // Shedding level
  shedding: z.enum(["none", "low", "moderate", "high"], {
    invalid_type_error: "Shedding level must be one of: none, low, moderate, high",
  }).optional(),
  
  // Grooming frequency
  groomingFrequency: z.enum(["daily", "weekly", "bi-weekly", "monthly"], {
    invalid_type_error: "Grooming frequency must be one of: daily, weekly, bi-weekly, monthly",
  }).optional(),
  
  // Temperament and care
  temperamentTags: z.array(z.string().min(1).max(50)).default([]).optional(),
  
  commonHealthRisks: z.array(z.string().min(2).max(100)).default([]).optional(),
  
  careLevel: z.enum(["beginner", "intermediate", "advanced", "expert"], {
    invalid_type_error: "Care level must be one of: beginner, intermediate, advanced, expert",
  }).optional(),
  
  // Images
  images: z.array(z.string().url("Each image must be a valid URL")).default([]).optional(),
}).refine(
  (data) => {
    // If gender-specific weights are provided, they should be different enough
    if (data.maleAvgWeightKg && data.femaleAvgWeightKg) {
      const diff = Math.abs(data.maleAvgWeightKg - data.femaleAvgWeightKg)
      // If both are very similar (within 0.5kg), suggest using a single weight field
      if (diff < 0.5) {
        return false
      }
    }
    return true
  },
  {
    message: "Male and female weights are too similar. Consider using a single average weight instead.",
    path: ["femaleAvgWeightKg"],
  }
).transform((data) => {
  // Compute additional tags based on data
  const computedTags: string[] = []
  
  // Shedding tags
  if (data.shedding) {
    if (data.shedding === "high") {
      computedTags.push("high-shedding")
    } else if (data.shedding === "none") {
      computedTags.push("hypoallergenic-potential")
    }
  }
  
  // Activity level tags
  if (data.activityNeeds) {
    if (data.activityNeeds >= 4) {
      computedTags.push("high-energy")
    } else if (data.activityNeeds <= 2) {
      computedTags.push("low-energy")
    }
  }
  
  // Size tags
  if (data.sizeClass) {
    computedTags.push(`${data.sizeClass}-sized`)
  }
  
  // Care level tags
  if (data.careLevel) {
    if (data.careLevel === "expert" || data.careLevel === "advanced") {
      computedTags.push("experienced-owner-recommended")
    }
  }
  
  // Grooming intensity tags
  if (data.groomingFrequency === "daily") {
    computedTags.push("high-maintenance-grooming")
  } else if (data.groomingFrequency === "monthly") {
    computedTags.push("low-maintenance-grooming")
  }
  
  return {
    ...data,
    computedTags,
  }
})

export type BreedInfoboxInput = z.input<typeof breedInfoboxSchema>
export type BreedInfoboxOutput = z.output<typeof breedInfoboxSchema>

// Helper function to safely parse breed infobox data
export function parseBreedInfobox(data: unknown) {
  return breedInfoboxSchema.safeParse(data)
}

// Helper function to validate breed infobox data (throws on error)
export function validateBreedInfobox(data: unknown): BreedInfoboxOutput {
  return breedInfoboxSchema.parse(data)
}

