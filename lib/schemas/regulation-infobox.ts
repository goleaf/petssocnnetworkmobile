import { z } from "zod"

/**
 * Zod schema for Regulation infobox data
 * Used for regulation/wiki articles about laws and regulations
 */
export const regulationInfoboxSchema = z.object({
  // Regulation information
  regulationName: z.string().min(2, "Regulation name must be at least 2 characters").max(200),
  
  // Type of regulation
  regulationType: z.enum(["federal", "state", "local", "international"], {
    required_error: "Regulation type is required",
  }),
  
  // Jurisdiction
  jurisdiction: z.string().min(2).max(200), // e.g., "United States", "California", "New York City"
  
  // Law/regulation number
  lawNumber: z.string().optional(), // e.g., "AB 1234", "H.R. 5678"
  
  // Effective date
  effectiveDate: z.string().optional(), // ISO date string
  
  // Status
  status: z.enum(["active", "pending", "repealed", "amended"]).optional(),
  
  // Applicable to
  applicableSpecies: z.array(z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other", "all"])).optional(),
  
  // Key requirements
  keyRequirements: z.array(z.string().min(2).max(500)).default([]).optional(),
  
  // Penalties/violations
  penalties: z.array(z.string().min(2).max(500)).default([]).optional(),
  
  // Exemptions
  exemptions: z.array(z.string().min(2).max(500)).default([]).optional(),
  
  // Related regulations
  relatedRegulations: z.array(z.string()).default([]).optional(),
  
  // Enforcement agency
  enforcementAgency: z.string().optional(),
  
  // Last updated
  lastUpdatedDate: z.string().optional(),
  
  // Legal references
  legalReferences: z.array(z.string().min(2).max(500)).default([]).optional(),
})

export type RegulationInfoboxInput = z.input<typeof regulationInfoboxSchema>
export type RegulationInfoboxOutput = z.output<typeof regulationInfoboxSchema>

export function parseRegulationInfobox(data: unknown) {
  return regulationInfoboxSchema.safeParse(data)
}

export function validateRegulationInfobox(data: unknown): RegulationInfoboxOutput {
  return regulationInfoboxSchema.parse(data)
}

