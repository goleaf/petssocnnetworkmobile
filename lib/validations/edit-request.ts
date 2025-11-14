/**
 * Validation schemas for edit request submission
 * Uses Zod for strict validation with proper error messages
 */

import { z } from "zod"

/**
 * Content type validation
 */
export const contentTypeSchema = z.enum(["blog", "wiki", "pet", "profile"], {
  errorMap: () => ({ message: "Invalid content type" }),
})

/**
 * Priority level validation
 */
export const prioritySchema = z.enum(["low", "normal", "high", "urgent"], {
  errorMap: () => ({ message: "Invalid priority level" }),
}).default("normal")

/**
 * Changes object validation
 * Must be a valid JSON object with at least one field
 */
export const changesSchema = z
  .record(z.unknown())
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Changes object must contain at least one field",
  })

/**
 * Edit request submission validation schema
 */
export const createEditRequestSchema = z
  .object({
    contentType: contentTypeSchema,
    contentId: z
      .string({
        required_error: "Content ID is required",
        invalid_type_error: "Content ID must be a string",
      })
      .min(1, "Content ID cannot be empty"),
    changes: changesSchema,
    reason: z
      .string()
      .max(500, "Reason cannot exceed 500 characters")
      .optional(),
    priority: prioritySchema.optional(),
  })
  .strict()

/**
 * Type inference for create edit request input
 */
export type CreateEditRequestInput = z.infer<typeof createEditRequestSchema>
