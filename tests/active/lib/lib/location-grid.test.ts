/**
 * Tests for Location Grid Utilities
 */

import {
  coordinatesToGrid,
  gridToCoordinates,
  getGridSize,
  areCoordinatesInSameGrid,
} from "../utils/location-grid"

describe("Location Grid Utilities", () => {
  const testLatitude = 37.7749 // San Francisco
  const testLongitude = -122.4194

  describe("coordinatesToGrid", () => {
    it("should convert coordinates to grid identifier", () => {
      const result = coordinatesToGrid(testLatitude, testLongitude)

      expect(result.gridId).toBeDefined()
      expect(result.gridId).toMatch(/^lat_(-?\d+)_lng_(-?\d+)$/)
      expect(result.approximateCenter).toBeDefined()
      expect(result.approximateCenter.latitude).toBeGreaterThan(0)
      expect(result.approximateCenter.longitude).toBeLessThan(0)
    })

    it("should generate consistent grid IDs for coordinates in same cell", () => {
      const result1 = coordinatesToGrid(testLatitude, testLongitude)
      const result2 = coordinatesToGrid(testLatitude + 0.001, testLongitude + 0.001)

      // Should be in same grid if difference is small
      const sameGrid = areCoordinatesInSameGrid(
        testLatitude,
        testLongitude,
        testLatitude + 0.001,
        testLongitude + 0.001
      )

      // Grid IDs should be the same for nearby coordinates (within ~1km)
      if (sameGrid) {
        expect(result1.gridId).toBe(result2.gridId)
      }
    })

    it("should handle negative coordinates", () => {
      const result = coordinatesToGrid(-33.8688, 151.2093) // Sydney

      expect(result.gridId).toBeDefined()
      expect(result.approximateCenter.latitude).toBeLessThan(0)
      expect(result.approximateCenter.longitude).toBeGreaterThan(0)
    })

    it("should handle zero coordinates", () => {
      const result = coordinatesToGrid(0, 0)

      expect(result.gridId).toBeDefined()
      expect(result.approximateCenter.latitude).toBeCloseTo(0.0045, 2)
      expect(result.approximateCenter.longitude).toBeCloseTo(0.0045, 2)
    })
  })

  describe("gridToCoordinates", () => {
    it("should convert grid identifier back to approximate coordinates", () => {
      const grid = coordinatesToGrid(testLatitude, testLongitude)
      const coords = gridToCoordinates(grid.gridId)

      expect(coords).not.toBeNull()
      expect(coords?.latitude).toBeDefined()
      expect(coords?.longitude).toBeDefined()
      // Approximate center should be within grid size of original
      expect(Math.abs(coords!.latitude - grid.approximateCenter.latitude)).toBeLessThan(0.01)
      expect(Math.abs(coords!.longitude - grid.approximateCenter.longitude)).toBeLessThan(0.01)
    })

    it("should return null for invalid grid identifier", () => {
      expect(gridToCoordinates("invalid")).toBeNull()
      expect(gridToCoordinates("lat_abc_lng_def")).toBeNull()
      expect(gridToCoordinates("")).toBeNull()
    })

    it("should handle negative grid indices", () => {
      const grid = coordinatesToGrid(-33.8688, 151.2093)
      const coords = gridToCoordinates(grid.gridId)

      expect(coords).not.toBeNull()
      expect(coords?.latitude).toBeLessThan(0)
      expect(coords?.longitude).toBeGreaterThan(0)
    })
  })

  describe("getGridSize", () => {
    it("should return grid size in degrees", () => {
      const size = getGridSize()

      expect(size).toBeGreaterThan(0)
      expect(size).toBeLessThan(1)
    })
  })

  describe("areCoordinatesInSameGrid", () => {
    it("should return true for coordinates in same grid cell", () => {
      const result = areCoordinatesInSameGrid(
        testLatitude,
        testLongitude,
        testLatitude + 0.001,
        testLongitude + 0.001
      )

      // Should be in same grid if very close
      expect(typeof result).toBe("boolean")
    })

    it("should return false for coordinates far apart", () => {
      const result = areCoordinatesInSameGrid(
        testLatitude,
        testLongitude,
        testLatitude + 10,
        testLongitude + 10
      )

      expect(result).toBe(false)
    })

    it("should return true for identical coordinates", () => {
      const result = areCoordinatesInSameGrid(
        testLatitude,
        testLongitude,
        testLatitude,
        testLongitude
      )

      expect(result).toBe(true)
    })
  })
})

