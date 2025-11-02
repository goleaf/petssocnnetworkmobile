import { z } from "zod"

/**
 * Zod schema for Product infobox data
 * Used for product-related wiki articles
 */
export const productInfoboxSchema = z.object({
  // Basic information
  productName: z.string().min(2, "Product name must be at least 2 characters").max(100),
  
  brand: z.string().min(1).max(100).optional(),
  
  category: z.enum(["food", "toys", "accessories", "health", "grooming", "training", "housing", "other"], {
    required_error: "Category is required",
  }),
  
  // Description
  shortDescription: z.string().max(500).optional(),
  
  // Pricing
  price: z.number().positive().max(100000).optional(),
  
  currency: z.string().length(3).default("USD").optional(),
  
  // Availability
  inStock: z.boolean().default(true).optional(),
  
  availability: z.enum(["readily-available", "limited", "discontinued"]).optional(),
  
  // Ratings
  rating: z.number().min(0).max(5).optional(),
  
  reviewCount: z.number().int().min(0).optional(),
  
  // Product details
  suitableForSpecies: z.array(z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"])).optional(),
  
  size: z.string().max(50).optional(),
  
  weight: z.string().max(50).optional(),
  
  material: z.array(z.string()).default([]).optional(),
  
  // Images
  images: z.array(z.string().url("Each image must be a valid URL")).default([]).optional(),
  
  // Safety and certifications
  safetyCertifications: z.array(z.string()).default([]).optional(),
  
  // Where to buy
  purchaseLinks: z.array(z.string().url("Each link must be a valid URL")).default([]).optional(),
  
  // Tags for search
  tags: z.array(z.string().min(1).max(50)).default([]).optional(),
})

export type ProductInfoboxInput = z.input<typeof productInfoboxSchema>
export type ProductInfoboxOutput = z.output<typeof productInfoboxSchema>

export function parseProductInfobox(data: unknown) {
  return productInfoboxSchema.safeParse(data)
}

export function validateProductInfobox(data: unknown): ProductInfoboxOutput {
  return productInfoboxSchema.parse(data)
}

