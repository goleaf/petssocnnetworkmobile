/**
 * Emergency utilities for finding local clinics and guidelines
 */

export interface EmergencyClinic {
  id: string
  name: string
  phone: string
  address: string
  is24Hours: boolean
  distance?: number
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * Gets emergency clinic finder URL based on user location
 * Uses browser geolocation or defaults to a general search
 */
export function getEmergencyClinicFinderUrl(): string {
  // In a real implementation, this would use user's location
  // For now, returns a generic search URL
  return "/emergency/clinics"
}

/**
 * Gets emergency guidelines page URL
 */
export function getEmergencyGuidelinesUrl(): string {
  return "/emergency/guidelines"
}

/**
 * Gets phone number URL for emergency hotline
 * Default emergency veterinary hotline
 */
export function getEmergencyPhoneUrl(phoneNumber?: string): string {
  const phone = phoneNumber || "1-888-PET-HELP" // Placeholder - can be configured
  // Clean phone number for tel: link
  const cleanPhone = phone.replace(/[^\d+]/g, "")
  return `tel:${cleanPhone}`
}

/**
 * Opens maps app with search for nearest emergency clinics
 */
export function getEmergencyMapsUrl(query: string = "emergency veterinary clinic"): string {
  // For mobile, use native map apps or web maps
  if (typeof window !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // iOS - use Apple Maps
    return `maps://maps.apple.com/?q=${encodeURIComponent(query)}`
  } else if (typeof window !== "undefined" && /Android/i.test(navigator.userAgent)) {
    // Android - use Google Maps
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }
  // Default to web Google Maps
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/**
 * Gets emergency action URLs based on urgency level
 */
export function getEmergencyActions(urgency: "emergency" | "urgent" | "routine") {
  if (urgency === "emergency") {
    return {
      clinicFinderUrl: getEmergencyClinicFinderUrl(),
      phoneUrl: getEmergencyPhoneUrl(),
      mapsUrl: getEmergencyMapsUrl("emergency veterinary clinic 24 hours"),
      guidelinesUrl: getEmergencyGuidelinesUrl(),
    }
  } else if (urgency === "urgent") {
    return {
      clinicFinderUrl: getEmergencyClinicFinderUrl(),
      guidelinesUrl: getEmergencyGuidelinesUrl(),
      mapsUrl: getEmergencyMapsUrl("veterinary clinic"),
    }
  }
  return null
}

