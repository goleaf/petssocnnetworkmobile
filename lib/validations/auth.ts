/**
 * Validation schemas for authentication and onboarding
 * Uses Zod for strict validation with proper error messages
 */

import { z } from "zod"
import type { PetSpecies } from "../types"

/**
 * Email validation schema with strict format checking
 */
export const emailSchema = z
  .string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  })
  .min(1, "Email cannot be empty")
  .email("Invalid email format")
  .toLowerCase()
  .trim()

/**
 * Onboarding preferences validation schema
 * Strict validation for species interests, location consent, and follow requirements
 */
export const onboardingPreferencesSchema = z
  .object({
    speciesInterests: z
      .array(
        z.enum(["dog", "cat", "bird", "rabbit", "hamster", "fish", "other"], {
          errorMap: () => ({ message: "Invalid species selected" }),
        })
      )
      .min(1, "Please select at least one species interest")
      .max(7, "Cannot select more than 7 species"),
    locationConsent: z.boolean({
      required_error: "Location consent is required",
      invalid_type_error: "Location consent must be a boolean",
    }),
    followsRequired: z
      .number({
        required_error: "Follows required is required",
        invalid_type_error: "Follows required must be a number",
      })
      .int("Follows required must be an integer")
      .min(0, "Follows required cannot be negative")
      .max(50, "Follows required cannot exceed 50")
      .default(5),
    followedUserIds: z
      .array(z.string().min(1, "Invalid user ID"))
      .optional()
      .default([]),
  })
  .strict()

/**
 * Magic link request validation
 */
export const magicLinkRequestSchema = z
  .object({
    email: emailSchema,
  })
  .strict()

/**
 * Magic link token validation
 */
export const magicLinkTokenSchema = z
  .string({
    required_error: "Magic link token is required",
    invalid_type_error: "Token must be a string",
  })
  .min(32, "Invalid token format")
  .max(256, "Invalid token format")

/**
 * 2FA code validation (6-digit TOTP code)
 */
export const twoFactorCodeSchema = z
  .string({
    required_error: "2FA code is required",
    invalid_type_error: "Code must be a string",
  })
  .length(6, "2FA code must be 6 digits")
  .regex(/^\d{6}$/, "2FA code must contain only digits")

/**
 * Complete onboarding validation
 */
export const completeOnboardingSchema = z
  .object({
    userId: z
      .string({
        required_error: "User ID is required",
        invalid_type_error: "User ID must be a string",
      })
      .min(1, "User ID cannot be empty"),
    preferences: onboardingPreferencesSchema,
  })
  .strict()

/**
 * Device info schema for session tracking
 */
export const deviceInfoSchema = z
  .object({
    name: z.string().min(1, "Device name is required"),
    type: z.enum(["mobile", "tablet", "desktop", "other"]),
    os: z.string().optional(),
    browser: z.string().optional(),
    ip: z.string().optional(),
  })
  .strict()

/**
 * Revoke device request schema
 */
export const revokeDeviceSchema = z
  .object({
    deviceId: z
      .string({
        required_error: "Device ID is required",
        invalid_type_error: "Device ID must be a string",
      })
      .min(1, "Device ID cannot be empty"),
  })
  .strict()

