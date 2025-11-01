import { z } from "zod"

/**
 * Zod schema for Place infobox data
 * Used for place-related wiki articles
 */
export const placeInfoboxSchema = z.object({
  // Basic information
  placeName: z.string().min(2, "Place name must be at least 2 characters").max(100),
  
  address: z.string().min(5, "Address must be at least 5 characters").max(200),
  
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  
  country: z.string().min(2, "Country must be at least 2 characters").max(100),
  
  state: z.string().max(100).optional(),
  
  // Location
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  
  // Features
  amenities: z.array(z.string().min(2).max(100)).default([]),
  
  rules: z.array(z.string().min(2).max(200)).default([]),
  
  hazards: z.array(z.string().min(2).max(200)).default([]).optional(),
  
  // Facilities
  fenced: z.boolean().default(false).optional(),
  
  smallDogArea: z.boolean().default(false).optional(),
  
  waterStation: z.boolean().default(false).optional(),
  
  parkingInfo: z.string().max(200).optional(),
  
  // Images
  images: z.array(z.string().url("Each image must be a valid URL")).default([]).optional(),
  
  // Accessibility
  wheelchairAccessible: z.boolean().default(false).optional(),
  
  publicTransitAccess: z.boolean().default(false).optional(),
  
  // Hours (optional)
  hours: z.string().max(200).optional(),
})

export type PlaceInfoboxInput = z.input<typeof placeInfoboxSchema>
export type PlaceInfoboxOutput = z.output<typeof placeInfoboxSchema>

export function parsePlaceInfobox(data: unknown) {
  return placeInfoboxSchema.safeParse(data)
}

export function validatePlaceInfobox(data: unknown): PlaceInfoboxOutput {
  return placeInfoboxSchema.parse(data)
}

