/**
 * Location Grid Utilities
 * 
 * Converts precise coordinates to grid-based identifiers for privacy.
 * Grid cells are approximately 1km x 1km (can be adjusted via GRID_SIZE).
 */

// Grid size in degrees (approximately 1km at equator)
// 1 degree latitude ≈ 111km
// For ~1km grid: 1/111 ≈ 0.009 degrees
const GRID_SIZE_DEGREES = 0.009

export interface LocationGrid {
  gridId: string
  approximateCenter: {
    latitude: number
    longitude: number
  }
}

/**
 * Convert precise coordinates to a grid cell identifier
 * Grid cells are defined by integer divisions of latitude/longitude
 */
export function coordinatesToGrid(latitude: number, longitude: number): LocationGrid {
  // Calculate grid cell indices
  const latGridIndex = Math.floor(latitude / GRID_SIZE_DEGREES)
  const lngGridIndex = Math.floor(longitude / GRID_SIZE_DEGREES)

  // Create grid identifier (e.g., "lat_45_lng_-122")
  const gridId = `lat_${latGridIndex}_lng_${lngGridIndex}`

  // Calculate approximate center of the grid cell
  const approximateCenter = {
    latitude: latGridIndex * GRID_SIZE_DEGREES + GRID_SIZE_DEGREES / 2,
    longitude: lngGridIndex * GRID_SIZE_DEGREES + GRID_SIZE_DEGREES / 2,
  }

  return {
    gridId,
    approximateCenter,
  }
}

/**
 * Convert grid identifier back to approximate center coordinates
 */
export function gridToCoordinates(gridId: string): { latitude: number; longitude: number } | null {
  try {
    // Parse grid ID format: "lat_45_lng_-122"
    const match = gridId.match(/^lat_(-?\d+)_lng_(-?\d+)$/)
    if (!match) {
      return null
    }

    const latGridIndex = parseInt(match[1], 10)
    const lngGridIndex = parseInt(match[2], 10)

    return {
      latitude: latGridIndex * GRID_SIZE_DEGREES + GRID_SIZE_DEGREES / 2,
      longitude: lngGridIndex * GRID_SIZE_DEGREES + GRID_SIZE_DEGREES / 2,
    }
  } catch {
    return null
  }
}

/**
 * Get grid size in degrees (for external use)
 */
export function getGridSize(): number {
  return GRID_SIZE_DEGREES
}

/**
 * Check if coordinates are within the same grid cell
 */
export function areCoordinatesInSameGrid(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): boolean {
  const grid1 = coordinatesToGrid(lat1, lng1)
  const grid2 = coordinatesToGrid(lat2, lng2)
  return grid1.gridId === grid2.gridId
}

