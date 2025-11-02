import { describe, it, expect } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { BreedInfoboxDisplay } from "../breed-infobox-display"
import type { BreedInfoboxOutput } from "@/lib/schemas/breed-infobox"

describe("BreedInfoboxDisplay", () => {
  it("should render nothing when breedData is empty", () => {
    const { container } = render(<BreedInfoboxDisplay breedData={{} as BreedInfoboxOutput} />)
    expect(container.firstChild).toBeNull()
  })

  it("should render breed name and aliases", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      aliases: ["Goldie", "GR"],
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Golden Retriever")).toBeInTheDocument()
    expect(screen.getByText("Also known as: Goldie, GR")).toBeInTheDocument()
  })

  it("should render computed tags", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      shedding: "high",
      activityNeeds: 4,
      sizeClass: "large",
      computedTags: ["high-shedding", "high-energy", "large-sized"],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Key Characteristics")).toBeInTheDocument()
    expect(screen.getByText("High Shedding")).toBeInTheDocument()
    expect(screen.getByText("High Energy")).toBeInTheDocument()
    expect(screen.getByText("Large Sized")).toBeInTheDocument()
  })

  it("should render basic information", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      originCountry: "Scotland",
      sizeClass: "large",
      maleAvgWeightKg: 32,
      femaleAvgWeightKg: 28,
      lifeExpectancyYears: 12,
      coatType: "Double coat",
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Basic Information")).toBeInTheDocument()
    expect(screen.getByText("Scotland")).toBeInTheDocument()
    expect(screen.getByText("large")).toBeInTheDocument()
    expect(screen.getByText("♂ 32kg")).toBeInTheDocument()
    expect(screen.getByText("♀ 28kg")).toBeInTheDocument()
    expect(screen.getByText("12 years")).toBeInTheDocument()
    expect(screen.getByText("Double coat")).toBeInTheDocument()
  })

  it("should render behavioral traits with rating bars", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      activityNeeds: 4,
      trainability: 5,
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Behavioral Traits")).toBeInTheDocument()
    expect(screen.getByText("Activity Needs")).toBeInTheDocument()
    expect(screen.getByText("Trainability")).toBeInTheDocument()
  })

  it("should render care requirements", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      shedding: "moderate",
      groomingFrequency: "weekly",
      careLevel: "beginner",
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Care Requirements")).toBeInTheDocument()
    expect(screen.getByText("moderate")).toBeInTheDocument()
    expect(screen.getByText("Weekly")).toBeInTheDocument()
    expect(screen.getByText("beginner")).toBeInTheDocument()
  })

  it("should render color variants", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      colorVariants: ["Golden", "Cream", "Dark Golden"],
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Color Variants")).toBeInTheDocument()
    expect(screen.getByText("Golden")).toBeInTheDocument()
    expect(screen.getByText("Cream")).toBeInTheDocument()
    expect(screen.getByText("Dark Golden")).toBeInTheDocument()
  })

  it("should render temperament tags", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      temperamentTags: ["Friendly", "Intelligent", "Gentle"],
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Temperament")).toBeInTheDocument()
    expect(screen.getByText("Friendly")).toBeInTheDocument()
    expect(screen.getByText("Intelligent")).toBeInTheDocument()
    expect(screen.getByText("Gentle")).toBeInTheDocument()
  })

  it("should render health risks", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      commonHealthRisks: ["Hip Dysplasia", "Obesity"],
      computedTags: [],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Common Health Risks")).toBeInTheDocument()
    expect(screen.getByText("Hip Dysplasia")).toBeInTheDocument()
    expect(screen.getByText("Obesity")).toBeInTheDocument()
  })

  it("should render all sections together", () => {
    const breedData: BreedInfoboxOutput = {
      species: "dog",
      officialName: "Golden Retriever",
      aliases: ["Goldie"],
      shedding: "high",
      activityNeeds: 4,
      sizeClass: "large",
      computedTags: ["high-shedding", "high-energy", "large-sized"],
    }

    render(<BreedInfoboxDisplay breedData={breedData} />)
    
    expect(screen.getByText("Golden Retriever")).toBeInTheDocument()
    expect(screen.getByText("Key Characteristics")).toBeInTheDocument()
    expect(screen.getByText("High Shedding")).toBeInTheDocument()
  })
})

