/**
 * Location Obfuscation Utilities
 * 
 * Ensures that precise coordinates are never stored for non-public profiles.
 * Only public location privacy settings allow precise coordinate storage.
 */

import type { User, PrivacyLevel } from "@/lib/types"
import { coordinatesToGrid } from "./location-grid"

/**
 * Check if location privacy setting allows precise coordinate storage
 */
export function allowsPreciseCoordinates(locationPrivacy: PrivacyLevel | undefined): boolean {
  return locationPrivacy === "public"
}

/**
 * Obfuscate location coordinates based on privacy settings
 * 
 * For public profiles: stores precise coordinates
 * For private/followers-only profiles: stores only grid identifier, removes precise coordinates
 */
export function obfuscateLocationForStorage(
  user: Partial<User>,
  preciseLatitude?: number,
  preciseLongitude?: number
): {
  locationGrid?: string
  locationPrecise?: { latitude: number; longitude: number }
} {
  const locationPrivacy = user.privacy?.location
  const allowsPrecise = allowsPreciseCoordinates(locationPrivacy)

  // If no coordinates provided, return empty
  if (preciseLatitude === undefined || preciseLongitude === undefined) {
    return {}
  }

  // If privacy allows precise storage, store both grid and precise
  if (allowsPrecise) {
    const grid = coordinatesToGrid(preciseLatitude, preciseLongitude)
    return {
      locationGrid: grid.gridId,
      locationPrecise: {
        latitude: preciseLatitude,
        longitude: preciseLongitude,
      },
    }
  }

  // For non-public profiles: ONLY store grid, NEVER precise coordinates
  const grid = coordinatesToGrid(preciseLatitude, preciseLongitude)
  return {
    locationGrid: grid.gridId,
    // Explicitly do NOT include locationPrecise for non-public profiles
  }
}

/**
 * Sanitize user location data to ensure privacy compliance
 * Removes precise coordinates if privacy setting doesn't allow them
 */
export function sanitizeLocationForStorage(user: Partial<User>): Partial<User> {
  const locationPrivacy = user.privacy?.location
  const allowsPrecise = allowsPreciseCoordinates(locationPrivacy)

  // If precise coordinates exist but privacy doesn't allow them, remove them
  if (!allowsPrecise && user.locationPrecise) {
    const sanitized = { ...user }
    delete sanitized.locationPrecise
    return sanitized
  }

  return user
}

/**
 * Get the location data to display for a user based on privacy and viewer
 */
export function getDisplayLocation(
  user: User,
  viewerId: string | null
): {
  locationText?: string
  locationGrid?: string
  locationPrecise?: { latitude: number; longitude: number }
} | null {
  // Owner can always see their own precise location (if stored)
  if (viewerId === user.id) {
    return {
      locationText: user.location,
      locationGrid: user.locationGrid,
      locationPrecise: user.locationPrecise,
    }
  }

  // Check if viewer can see location at all
  const locationPrivacy = user.privacy?.location
  const allowsPrecise = allowsPreciseCoordinates(locationPrivacy)

  // If location is private, return null
  if (locationPrivacy === "private") {
    return null
  }

  // If followers-only, check if viewer is a follower
  if (locationPrivacy === "followers-only") {
    if (!viewerId || !user.followers.includes(viewerId)) {
      return null
    }
  }

  // Public or allowed followers can see location
  // But only show precise coordinates if they're stored (which should only be for public)
  return {
    locationText: user.location,
    locationGrid: user.locationGrid,
    locationPrecise: allowsPrecise ? user.locationPrecise : undefined,
  }
}

