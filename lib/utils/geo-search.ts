/**
 * Geo search utilities for calculating distances and filtering places by radius
 */

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param point1 First point (lat, lng)
 * @param point2 Second point (lat, lng)
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Filter places within a given radius from a center point
 * @param places Array of places with latitude and longitude
 * @param center Center point (lat, lng)
 * @param radiusKm Radius in kilometers
 * @returns Filtered places with distance property added
 */
export function filterPlacesByRadius<T extends { latitude: number; longitude: number }>(
  places: T[],
  center: LatLng,
  radiusKm: number
): Array<T & { distance: number }> {
  return places
    .map((place) => {
      const distance = calculateDistance(center, {
        lat: place.latitude,
        lng: place.longitude,
      })
      return { ...place, distance }
    })
    .filter((place) => place.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Check if a point is within a radius of a center point
 * @param point Point to check
 * @param center Center point
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(point: LatLng, center: LatLng, radiusKm: number): boolean {
  const distance = calculateDistance(point, center)
  return distance <= radiusKm
}
