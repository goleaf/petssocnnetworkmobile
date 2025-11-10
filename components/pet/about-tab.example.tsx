/**
 * Example usage of the AboutTab component
 * 
 * This file demonstrates how to integrate the AboutTab component
 * into a pet profile page with sample data.
 */

import { AboutTab } from "./about-tab"
import type { Pet } from "@/lib/types"

// Example pet data with all fields populated
const examplePet: Pet = {
  id: "pet-123",
  ownerId: "user-456",
  name: "Max",
  species: "dog",
  breed: "Golden Retriever",
  birthday: new Date("2020-06-15").toISOString(),
  weight: "65 lbs",
  color: "Golden with white chest markings",
  spayedNeutered: true,
  followers: [],
  
  // Microchip information
  microchipId: "123456789012345",
  microchipCompany: "HomeAgain",
  microchipRegistrationStatus: "registered",
  
  // Weight history for chart
  weightHistory: [
    { date: new Date("2023-01-15").toISOString(), weight: 58 },
    { date: new Date("2023-04-15").toISOString(), weight: 60 },
    { date: new Date("2023-07-15").toISOString(), weight: 62 },
    { date: new Date("2023-10-15").toISOString(), weight: 63 },
    { date: new Date("2024-01-15").toISOString(), weight: 64 },
    { date: new Date("2024-04-15").toISOString(), weight: 65 },
  ],
  
  // Personality traits
  personality: {
    traits: ["Friendly", "Playful", "Energetic", "Loyal", "Intelligent"],
    energyLevel: 4,
    friendliness: 5,
    trainability: 4,
  },
  
  // Favorite things
  favoriteThings: {
    toys: ["Tennis ball", "Rope toy", "Squeaky duck"],
    activities: ["Fetch", "Swimming", "Hiking", "Playing with other dogs"],
    foods: ["Chicken treats", "Peanut butter", "Carrots"],
  },
  
  // Dislikes and special needs
  dislikes: "Loud noises, vacuum cleaner, being left alone",
  specialNeeds: "Needs daily exercise (at least 1 hour). Prefers cooler weather.",
  
  // Medical information
  allergies: ["Chicken", "Wheat", "Corn"],
  allergySeverities: {
    Chicken: "moderate",
    Wheat: "mild",
    Corn: "mild",
  },
  
  medications: [
    {
      id: "med-1",
      name: "Carprofen",
      dosage: "50mg",
      frequency: "Twice daily",
      startDate: new Date("2023-06-01").toISOString(),
      purpose: "Arthritis pain management",
      prescribedBy: "Dr. Smith",
    },
    {
      id: "med-2",
      name: "Omega-3 supplement",
      dosage: "1 capsule",
      frequency: "Once daily",
      startDate: new Date("2023-06-01").toISOString(),
      purpose: "Joint health support",
    },
  ],
  
  conditions: [
    {
      id: "cond-1",
      name: "Hip dysplasia",
      diagnosedAt: new Date("2022-08-15").toISOString(),
      notes: "Controlled with medication and regular exercise. X-rays show mild progression.",
    },
    {
      id: "cond-2",
      name: "Seasonal allergies",
      diagnosedAt: new Date("2021-04-20").toISOString(),
      notes: "Under treatment with antihistamines during spring and fall.",
    },
  ],
  
  // Veterinary information
  vetInfo: {
    clinicName: "Happy Paws Veterinary Clinic",
    veterinarianName: "Dr. Sarah Johnson",
    phone: "(555) 123-4567",
    address: "123 Main Street, Anytown, CA 12345",
    emergencyContact: "(555) 987-6543",
  },
}

// Example with minimal data
const minimalPet: Pet = {
  id: "pet-789",
  ownerId: "user-456",
  name: "Whiskers",
  species: "cat",
  followers: [],
}

/**
 * Example 1: Full-featured pet profile
 */
export function FullPetProfileExample() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Max's Profile</h1>
      <AboutTab pet={examplePet} canEdit={true} />
    </div>
  )
}

/**
 * Example 2: Minimal pet profile
 */
export function MinimalPetProfileExample() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Whiskers' Profile</h1>
      <AboutTab pet={minimalPet} canEdit={false} />
    </div>
  )
}

/**
 * Example 3: Pet with upcoming birthday
 */
export function BirthdayPetExample() {
  const petWithBirthday: Pet = {
    ...examplePet,
    birthday: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate() + 15
    ).toISOString(),
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Max's Profile (Birthday Soon!)</h1>
      <AboutTab pet={petWithBirthday} canEdit={true} />
    </div>
  )
}

/**
 * Example 4: Integration in a tabbed interface
 */
export function TabbedProfileExample() {
  const [activeTab, setActiveTab] = useState("about")
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Max's Profile</h1>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab("about")}
          className={`px-4 py-2 ${
            activeTab === "about"
              ? "border-b-2 border-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`px-4 py-2 ${
            activeTab === "photos"
              ? "border-b-2 border-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          Photos
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`px-4 py-2 ${
            activeTab === "health"
              ? "border-b-2 border-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          Health
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === "about" && <AboutTab pet={examplePet} canEdit={true} />}
      {activeTab === "photos" && <div>Photos tab content (to be implemented)</div>}
      {activeTab === "health" && <div>Health tab content (to be implemented)</div>}
    </div>
  )
}

// Note: Add this import at the top if using the tabbed example
// import { useState } from "react"
