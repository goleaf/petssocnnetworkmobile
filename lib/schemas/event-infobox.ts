import { z } from "zod"

/**
 * Zod schema for Event infobox data
 * Used for event wiki articles (adoption events, shows, etc.)
 */
export const eventInfoboxSchema = z.object({
  // Event information
  eventName: z.string().min(2, "Event name must be at least 2 characters").max(200),
  
  // Event type
  eventType: z.enum(["adoption", "show", "expo", "training", "fundraiser", "workshop", "competition", "other"], {
    required_error: "Event type is required",
  }),
  
  // Dates and times
  startDate: z.string(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  startTime: z.string().optional(), // e.g., "10:00 AM"
  endTime: z.string().optional(), // e.g., "4:00 PM"
  
  // Location
  venueName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  
  // Event details
  organizer: z.string().optional(),
  organizerWebsite: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organizerEmail: z.string().email("Must be a valid email").optional().or(z.literal("")),
  organizerPhone: z.string().optional(),
  
  // Registration
  registrationRequired: z.boolean().optional(),
  registrationUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  registrationDeadline: z.string().optional(),
  admissionFee: z.string().optional(), // e.g., "$10", "Free"
  
  // Event description
  description: z.string().max(1000).optional(),
  
  // Target audience
  targetAudience: z.array(z.enum(["pet-owners", "breeders", "veterinarians", "trainers", "general-public"])).optional(),
  
  // Species focus
  speciesFocus: z.array(z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other", "all"])).optional(),
  
  // Activities
  activities: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Accessibility
  accessibilityInfo: z.string().optional(),
  
  // Recurring event
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().optional(), // e.g., "First Saturday of every month"
})

export type EventInfoboxInput = z.input<typeof eventInfoboxSchema>
export type EventInfoboxOutput = z.output<typeof eventInfoboxSchema>

export function parseEventInfobox(data: unknown) {
  return eventInfoboxSchema.safeParse(data)
}

export function validateEventInfobox(data: unknown): EventInfoboxOutput {
  return eventInfoboxSchema.parse(data)
}

