/**
 * Location Privacy Utilities
 * 
 * Functions for obfuscating and rounding geographic coordinates
 * to protect user privacy while maintaining useful location data
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface ObfuscatedCoordinates extends Coordinates {
  precision: number // Precision level in decimal places
  original?: Coordinates // Optional: store original if needed for authorized access
}

/**
 * Round coordinates to a specified precision level
 * 
 * Higher precision = more accurate location
 * Lower precision = more privacy protection
 * 
 * @param coords - Original coordinates
 * @param precision - Number of decimal places (default: 2, ~1km accuracy)
 * @returns Obfuscated coordinates
 */
export function obfuscateCoordinates(
  coords: Coordinates,
  precision: number = 2
): ObfuscatedCoordinates {
  const factor = Math.pow(10, precision)
  
  return {
    latitude: Math.round(coords.latitude * factor) / factor,
    longitude: Math.round(coords.longitude * factor) / factor,
    precision,
  }
}

/**
 * Get appropriate precision level based on privacy setting
 * 
 * @param privacyLevel - User's privacy preference
 * @returns Precision level (lower = more private)
 */
export function getPrecisionForPrivacyLevel(privacyLevel: "public" | "followers-only" | "private"): number {
  switch (privacyLevel) {
    case "public":
      return 2 // ~1km accuracy
    case "followers-only":
      return 3 // ~100m accuracy
    case "private":
      return 1 // ~10km accuracy (very broad)
    default:
      return 2
  }
}

/**
 * Obfuscate coordinates based on user's privacy level
 */
export function obfuscateByPrivacyLevel(
  coords: Coordinates,
  privacyLevel: "public" | "followers-only" | "private"
): ObfuscatedCoordinates {
  const precision = getPrecisionForPrivacyLevel(privacyLevel)
  return obfuscateCoordinates(coords, precision)
}

/**
 * Format coordinates for display (with privacy rounding)
 */
export function formatCoordinatesForDisplay(coords: Coordinates | ObfuscatedCoordinates): string {
  const lat = typeof coords.latitude === "number" ? coords.latitude.toFixed(2) : coords.latitude
  const lng = typeof coords.longitude === "number" ? coords.longitude.toFixed(2) : coords.longitude
  return `${lat}, ${lng}`
}

/**
 * Check if coordinates are within a radius (for location-based features)
 * Uses obfuscated coordinates for privacy
 */
export function isWithinRadius(
  point1: Coordinates,
  point2: Coordinates,
  radiusKm: number
): boolean {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude)
  const dLon = toRad(point2.longitude - point1.longitude)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance <= radiusKm
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

