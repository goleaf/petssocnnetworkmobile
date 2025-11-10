import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { AboutTab } from "@/components/pet/about-tab"
import type { Pet } from "@/lib/types"

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})

describe("AboutTab", () => {
  const mockPet: Pet = {
    id: "pet-1",
    ownerId: "user-1",
    name: "Max",
    species: "dog",
    breed: "Golden Retriever",
    // Birthday 3 years ago, but 60 days from now (not within 30 days)
    birthday: new Date(
      new Date().getFullYear() - 3,
      new Date().getMonth() + 2,
      new Date().getDate()
    ).toISOString(),
    weight: "65 lbs",
    color: "Golden",
    spayedNeutered: true,
    microchipId: "123456789012345",
    microchipCompany: "HomeAgain",
    followers: [],
    weightHistory: [
      { date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), weight: 60 },
      { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), weight: 63 },
      { date: new Date().toISOString(), weight: 65 },
    ],
    personality: {
      traits: ["Friendly", "Playful", "Energetic"],
      energyLevel: 4,
    },
    favoriteThings: {
      toys: ["Tennis ball", "Rope toy"],
      activities: ["Fetch", "Swimming"],
      foods: ["Chicken treats", "Peanut butter"],
    },
    dislikes: "Loud noises, vacuum cleaner",
    specialNeeds: "Needs daily exercise",
    allergies: ["Chicken", "Wheat"],
    allergySeverities: {
      Chicken: "moderate",
      Wheat: "mild",
    },
    medications: [
      {
        id: "med-1",
        name: "Arthritis medication",
        dosage: "50mg",
        frequency: "Once daily",
        startDate: new Date().toISOString(),
        purpose: "Joint pain management",
      },
    ],
    conditions: [
      {
        id: "cond-1",
        name: "Hip dysplasia",
        diagnosedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Controlled with medication and exercise",
      },
    ],
    vetInfo: {
      clinicName: "Happy Paws Veterinary Clinic",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, USA",
    },
  }

  it("renders physical stats card", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Physical Stats")).toBeInTheDocument()
    expect(screen.getByText("65 lbs")).toBeInTheDocument()
    expect(screen.getByText("Golden")).toBeInTheDocument()
    expect(screen.getByText("Yes")).toBeInTheDocument() // Spayed/Neutered
  })

  it("displays weight history chart when multiple entries exist", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Weight History")).toBeInTheDocument()
  })

  it("displays weight trend indicator", () => {
    render(<AboutTab pet={mockPet} />)
    
    // Should show "Gaining" since weight increased from 60 to 65
    expect(screen.getByText("Gaining")).toBeInTheDocument()
  })

  it("displays microchip ID with copy button", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("123456789012345")).toBeInTheDocument()
    expect(screen.getByText("Registered with HomeAgain")).toBeInTheDocument()
  })

  it("copies microchip ID to clipboard when copy button is clicked", async () => {
    render(<AboutTab pet={mockPet} />)
    
    const copyButton = screen.getAllByRole("button").find(
      btn => btn.querySelector("svg")
    )
    
    if (copyButton) {
      fireEvent.click(copyButton)
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("123456789012345")
      })
    }
  })

  it("displays birthday notification when within 30 days", () => {
    const petWithUpcomingBirthday: Pet = {
      ...mockPet,
      birthday: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate() + 15
      ).toISOString(),
    }
    
    render(<AboutTab pet={petWithUpcomingBirthday} />)
    
    expect(screen.getByText(/Birthday coming up/i)).toBeInTheDocument()
  })

  it("renders personality card with traits", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Personality & Traits")).toBeInTheDocument()
    expect(screen.getByText("Friendly")).toBeInTheDocument()
    expect(screen.getByText("Playful")).toBeInTheDocument()
    expect(screen.getByText("Energetic")).toBeInTheDocument()
  })

  it("displays favorites with icons", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Favorites")).toBeInTheDocument()
    expect(screen.getByText("Tennis ball, Rope toy")).toBeInTheDocument()
    expect(screen.getByText("Fetch, Swimming")).toBeInTheDocument()
    expect(screen.getByText("Chicken treats, Peanut butter")).toBeInTheDocument()
  })

  it("displays dislikes and special needs", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Loud noises, vacuum cleaner")).toBeInTheDocument()
    expect(screen.getByText("Needs daily exercise")).toBeInTheDocument()
  })

  it("renders medical summary card", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Medical Summary")).toBeInTheDocument()
  })

  it("displays allergies with severity indicators", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Allergies")).toBeInTheDocument()
    // Use getAllByText since "Chicken" appears in both favorites and allergies
    const chickenElements = screen.getAllByText(/Chicken/)
    expect(chickenElements.length).toBeGreaterThan(0)
    expect(screen.getByText(/moderate/)).toBeInTheDocument()
    expect(screen.getByText(/Wheat/)).toBeInTheDocument()
    expect(screen.getByText(/mild/)).toBeInTheDocument()
  })

  it("displays current medications with dosage", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Current Medications")).toBeInTheDocument()
    expect(screen.getByText("Arthritis medication")).toBeInTheDocument()
    expect(screen.getByText("50mg")).toBeInTheDocument()
    expect(screen.getByText("Once daily")).toBeInTheDocument()
    expect(screen.getByText("For: Joint pain management")).toBeInTheDocument()
  })

  it("displays medication schedule", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText(/Schedule: Once daily/)).toBeInTheDocument()
  })

  it("displays conditions with management status", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Pre-existing Conditions")).toBeInTheDocument()
    expect(screen.getByText("Hip dysplasia")).toBeInTheDocument()
    expect(screen.getByText("Controlled")).toBeInTheDocument()
    expect(screen.getByText("Controlled with medication and exercise")).toBeInTheDocument()
  })

  it("displays vet information", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.getByText("Veterinary Information")).toBeInTheDocument()
    expect(screen.getByText("Happy Paws Veterinary Clinic")).toBeInTheDocument()
    expect(screen.getByText("(555) 123-4567")).toBeInTheDocument()
    expect(screen.getByText("123 Main St, Anytown, USA")).toBeInTheDocument()
  })

  it("does not display birthday notification when not within 30 days", () => {
    render(<AboutTab pet={mockPet} />)
    
    expect(screen.queryByText(/Birthday coming up/i)).not.toBeInTheDocument()
  })

  it("handles pet with minimal data", () => {
    const minimalPet: Pet = {
      id: "pet-2",
      ownerId: "user-2",
      name: "Buddy",
      species: "cat",
      followers: [],
    }
    
    render(<AboutTab pet={minimalPet} />)
    
    // Should still render without errors
    expect(screen.getByText("Physical Stats")).toBeInTheDocument()
    expect(screen.getByText("Personality & Traits")).toBeInTheDocument()
  })

  it("does not display weight history chart with single entry", () => {
    const petWithSingleWeight: Pet = {
      ...mockPet,
      weightHistory: [{ date: new Date().toISOString(), weight: 65 }],
    }
    
    render(<AboutTab pet={petWithSingleWeight} />)
    
    expect(screen.queryByText("Weight History")).not.toBeInTheDocument()
  })

  it("displays correct condition status based on notes", () => {
    const petWithDifferentConditions: Pet = {
      ...mockPet,
      conditions: [
        {
          id: "cond-1",
          name: "Condition 1",
          notes: "Under treatment with antibiotics",
        },
        {
          id: "cond-2",
          name: "Condition 2",
          notes: "Monitoring closely",
        },
        {
          id: "cond-3",
          name: "Condition 3",
          notes: "Stable and controlled",
        },
      ],
    }
    
    render(<AboutTab pet={petWithDifferentConditions} />)
    
    expect(screen.getByText("Under Treatment")).toBeInTheDocument()
    expect(screen.getByText("Monitoring")).toBeInTheDocument()
    expect(screen.getByText("Controlled")).toBeInTheDocument()
  })
})
