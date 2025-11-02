import { z } from "zod"

/**
 * Zod schema for Organization infobox data
 * Used for organization wiki articles (rescues, shelters, vets, etc.)
 */
export const organizationInfoboxSchema = z.object({
  // Organization information
  organizationName: z.string().min(2, "Organization name must be at least 2 characters").max(200),
  
  type: z.enum(["rescue", "shelter", "veterinary-clinic", "groomer", "trainer", "breeder", "non-profit", "other"], {
    required_error: "Organization type is required",
  }),
  
  // Contact information
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  
  // Location
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  
  // Service area
  serviceArea: z.string().optional(), // e.g., "Greater Boston Area"
  
  // Services offered
  services: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Specializations
  specializations: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Species served
  speciesServed: z.array(z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"])).optional(),
  
  // Operating hours
  operatingHours: z.string().optional(), // e.g., "Mon-Fri: 9am-5pm"
  
  // Accreditation/certifications
  accreditations: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Established year
  establishedYear: z.string().optional(),
  
  // Additional information
  description: z.string().max(1000).optional(),
})

export type OrganizationInfoboxInput = z.input<typeof organizationInfoboxSchema>
export type OrganizationInfoboxOutput = z.output<typeof organizationInfoboxSchema>

export function parseOrganizationInfobox(data: unknown) {
  return organizationInfoboxSchema.safeParse(data)
}

export function validateOrganizationInfobox(data: unknown): OrganizationInfoboxOutput {
  return organizationInfoboxSchema.parse(data)
}

