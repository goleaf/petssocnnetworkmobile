import { describe, it, expect } from "@jest/globals"
import { breedInfoboxSchema, parseBreedInfobox, validateBreedInfobox } from "../breed-infobox"
import { z } from "zod"

describe("Breed Infobox Schema", () => {
  describe("Valid data", () => {
    it("should accept minimal valid data", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Golden Retriever",
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.species).toBe("dog")
        expect(result.data.officialName).toBe("Golden Retriever")
      }
    })

    it("should accept full valid data", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Golden Retriever",
        aliases: ["Goldie", "GR"],
        originCountry: "Scotland",
        sizeClass: "large" as const,
        maleAvgWeightKg: 32,
        femaleAvgWeightKg: 28,
        lifeExpectancyYears: 12,
        coatType: "Double coat, medium length",
        colorVariants: ["Golden", "Cream", "Dark Golden"],
        activityNeeds: 4,
        trainability: 5,
        shedding: "moderate" as const,
        groomingFrequency: "weekly" as const,
        temperamentTags: ["Friendly", "Intelligent", "Gentle"],
        commonHealthRisks: ["Hip Dysplasia", "Elbow Dysplasia", "Obesity"],
        careLevel: "beginner" as const,
        images: [
          "https://example.com/golden-retriever-1.jpg",
          "https://example.com/golden-retriever-2.jpg",
        ],
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.species).toBe("dog")
        expect(result.data.officialName).toBe("Golden Retriever")
        expect(result.data.aliases).toEqual(["Goldie", "GR"])
        expect(result.data.images).toHaveLength(2)
      }
    })

    it("should accept cat breeds", () => {
      const validData = {
        species: "cat" as const,
        officialName: "Persian",
        sizeClass: "medium" as const,
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.species).toBe("cat")
      }
    })

    it("should accept empty arrays for optional array fields", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Test Breed",
        aliases: [],
        colorVariants: [],
        temperamentTags: [],
        commonHealthRisks: [],
        images: [],
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe("Validation errors", () => {
    it("should reject missing species", () => {
      const invalidData = {
        officialName: "Golden Retriever",
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("species")
      }
    })

    it("should reject invalid species", () => {
      const invalidData = {
        species: "invalid_species",
        officialName: "Test",
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject too short official name", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "A",
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters")
      }
    })

    it("should reject too long official name", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "A".repeat(101),
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject invalid size class", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        sizeClass: "extra-large",
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject negative weight", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        maleAvgWeightKg: -5,
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive")
      }
    })

    it("should reject invalid image URLs", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        images: ["not-a-url", "also-invalid"],
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid URL")
      }
    })

    it("should reject invalid shedding value", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        shedding: "extreme",
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject invalid activity needs range", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        activityNeeds: 6,
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("should reject too high life expectancy", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        lifeExpectancyYears: 100,
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe("Cross-field validation", () => {
    it("should accept size class with male weight only", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Test Breed",
        sizeClass: "large" as const,
        maleAvgWeightKg: 32,
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should accept size class with female weight only", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Test Breed",
        sizeClass: "large" as const,
        femaleAvgWeightKg: 28,
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("should warn when male and female weights are too similar", () => {
      const invalidData = {
        species: "dog" as const,
        officialName: "Test Breed",
        maleAvgWeightKg: 30,
        femaleAvgWeightKg: 30.3, // Too similar (within 0.5kg)
      }

      const result = breedInfoboxSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("too similar")
      }
    })

    it("should accept different enough male and female weights", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Test Breed",
        maleAvgWeightKg: 32,
        femaleAvgWeightKg: 28,
      }

      const result = breedInfoboxSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe("Computed tags", () => {
    it("should compute high-shedding tag", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        shedding: "high" as const,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("high-shedding")
      }
    })

    it("should compute hypoallergenic-potential tag", () => {
      const data = {
        species: "cat" as const,
        officialName: "Test Breed",
        shedding: "none" as const,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("hypoallergenic-potential")
      }
    })

    it("should compute high-energy tag", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        activityNeeds: 5,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("high-energy")
      }
    })

    it("should compute low-energy tag", () => {
      const data = {
        species: "cat" as const,
        officialName: "Test Breed",
        activityNeeds: 2,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("low-energy")
      }
    })

    it("should compute size-specific tags", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        sizeClass: "toy" as const,
        maleAvgWeightKg: 3,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("toy-sized")
      }
    })

    it("should compute experienced-owner-recommended tag", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        careLevel: "expert" as const,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("experienced-owner-recommended")
      }
    })

    it("should compute high-maintenance-grooming tag", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        groomingFrequency: "daily" as const,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("high-maintenance-grooming")
      }
    })

    it("should compute low-maintenance-grooming tag", () => {
      const data = {
        species: "cat" as const,
        officialName: "Test Breed",
        groomingFrequency: "monthly" as const,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("low-maintenance-grooming")
      }
    })

    it("should compute multiple tags", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        shedding: "high" as const,
        activityNeeds: 5,
        sizeClass: "large" as const,
        maleAvgWeightKg: 45,
        groomingFrequency: "daily" as const,
        careLevel: "advanced" as const,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toContain("high-shedding")
        expect(result.data.computedTags).toContain("high-energy")
        expect(result.data.computedTags).toContain("large-sized")
        expect(result.data.computedTags).toContain("high-maintenance-grooming")
        expect(result.data.computedTags).toContain("experienced-owner-recommended")
        expect(result.data.computedTags.length).toBe(5)
      }
    })

    it("should have empty computedTags when no tags apply", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.computedTags).toEqual([])
      }
    })
  })

  describe("Helper functions", () => {
    it("should parse valid data with parseBreedInfobox", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Golden Retriever",
      }

      const result = parseBreedInfobox(validData)
      expect(result.success).toBe(true)
    })

    it("should parse invalid data with parseBreedInfobox", () => {
      const invalidData = {
        officialName: "Golden Retriever",
        // Missing species
      }

      const result = parseBreedInfobox(invalidData)
      expect(result.success).toBe(false)
    })

    it("should validate valid data with validateBreedInfobox", () => {
      const validData = {
        species: "dog" as const,
        officialName: "Golden Retriever",
      }

      const result = validateBreedInfobox(validData)
      expect(result.species).toBe("dog")
      expect(result.officialName).toBe("Golden Retriever")
    })

    it("should throw on invalid data with validateBreedInfobox", () => {
      const invalidData = {
        // Missing species
        officialName: "Golden Retriever",
      }

      expect(() => validateBreedInfobox(invalidData)).toThrow()
    })
  })

  describe("Edge cases", () => {
    it("should handle empty strings in optional string fields", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        originCountry: "",
        coatType: "",
      }

      const result = breedInfoboxSchema.safeParse(data)
      // Empty strings should fail validation for required fields
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("at least 2 characters"))).toBe(true)
      }
    })

    it("should handle very long array values", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        aliases: ["A".repeat(51)], // Too long
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("should handle floating point weights correctly", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        maleAvgWeightKg: 32.5,
        femaleAvgWeightKg: 28.3,
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maleAvgWeightKg).toBe(32.5)
        expect(result.data.femaleAvgWeightKg).toBe(28.3)
      }
    })

    it("should handle activity needs at boundaries", () => {
      const data1 = {
        species: "dog" as const,
        officialName: "Test Breed",
        activityNeeds: 1,
      }

      const data2 = {
        species: "dog" as const,
        officialName: "Test Breed",
        activityNeeds: 5,
      }

      expect(breedInfoboxSchema.safeParse(data1).success).toBe(true)
      expect(breedInfoboxSchema.safeParse(data2).success).toBe(true)
    })

    it("should handle non-integer trainability values", () => {
      const data = {
        species: "dog" as const,
        officialName: "Test Breed",
        trainability: 3.5, // Should be invalid
      }

      const result = breedInfoboxSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})

