/**
 * Example usage of Step6BioReview component
 * 
 * This file demonstrates how to integrate Step 6 into the pet creation wizard.
 */

import { Step6BioReview } from "./step6-bio-review"

// Example: Integration in PetCreationWizard component
export function PetCreationWizardExample() {
  // ... other wizard state ...

  const [step6Data, setStep6Data] = useState({
    bio: "",
    isFeatured: false,
    privacy: {
      visibility: "public" as const,
      interactions: "public" as const,
    },
  })

  // Complete form data from all steps
  const allFormData = {
    // Step 1: Basic Info
    name: "Max",
    species: "dog",
    breed: "Golden Retriever",
    breedId: "uuid-here",
    gender: "male",
    spayedNeutered: true,
    weight: "65",
    weightUnit: "lbs",
    birthday: "2020-05-15",
    markings: "White chest patch",
    
    // Step 2: Photos
    primaryPhotoUrl: "https://example.com/photo.jpg",
    photos: ["url1", "url2", "url3"],
    
    // Step 3: Personality
    personality: {
      traits: ["Friendly", "Energetic", "Playful"],
      favoriteActivities: ["Fetch", "Swimming"],
      favoriteTreats: "Peanut butter treats",
      favoriteToys: "Tennis balls",
    },
    specialNeeds: "Needs daily exercise",
    
    // Step 4: Identification
    microchipId: "123456789012345",
    microchipCompany: "HomeAgain",
    collarTagId: "MAX-2024",
    
    // Step 5: Medical
    vetClinicName: "Happy Paws Veterinary",
    vetClinicContact: "(555) 123-4567",
    allergies: ["Chicken"],
    allergySeverities: { Chicken: "moderate" },
    medications: [
      {
        name: "Carprofen",
        dosage: "50mg",
        frequency: "Twice daily",
        purpose: "Arthritis",
      },
    ],
    conditions: [
      {
        name: "Hip Dysplasia",
        diagnosedAt: "2023-01-15",
        notes: "Mild, managed with medication",
      },
    ],
    
    // Step 6: Bio & Privacy
    ...step6Data,
  }

  const handleStep6Change = (data: Partial<typeof step6Data>) => {
    setStep6Data((prev) => ({ ...prev, ...data }))
  }

  const handleEditStep = (step: number) => {
    // Navigate back to the specified step
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/pets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allFormData),
      })

      if (response.ok) {
        const { petId, slug } = await response.json()
        // Redirect to new pet profile
        router.push(`/pet/${username}/${slug}`)
      } else {
        // Handle error
        const error = await response.json()
        setErrors(error.validationErrors || {})
      }
    } catch (error) {
      console.error("Failed to create pet:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Step6BioReview
      formData={step6Data}
      allFormData={allFormData}
      onChange={handleStep6Change}
      onEditStep={handleEditStep}
      onSubmit={handleSubmit}
      errors={errors}
      isSubmitting={isSubmitting}
    />
  )
}

/**
 * Example: Bio formatting in action
 */
export function BioFormattingExample() {
  const bioText = `Meet **Max**, the most _energetic_ Golden Retriever you'll ever meet! 🐕

He loves playing fetch at the park with @johndoe and swimming in the lake. His favorite activities include #fetch #swimming and #hiking.

Max is a certified therapy dog who brings joy to everyone he meets. Despite his hip dysplasia, he never lets it slow him down!`

  // This bio will be rendered with:
  // - **Max** → Bold
  // - _energetic_ → Italic
  // - 🐕 → Emoji (rendered as-is)
  // - @johndoe → Highlighted mention
  // - #fetch, #swimming, #hiking → Highlighted hashtags

  return <div>{/* Bio preview will show formatted text */}</div>
}

/**
 * Example: Privacy settings
 */
export function PrivacySettingsExample() {
  const privacyOptions = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can view this profile",
      icon: "🌐",
    },
    {
      value: "followers-only",
      label: "Followers Only",
      description: "Only followers can view this profile",
      icon: "👥",
    },
    {
      value: "private",
      label: "Private",
      description: "Only you can view this profile",
      icon: "🔒",
    },
  ]

  return (
    <div>
      {/* Privacy selector dropdown */}
      {/* Visual indicator showing current selection */}
    </div>
  )
}

/**
 * Example: Review summary data structure
 */
export function ReviewSummaryExample() {
  const summaryData = {
    step1: {
      title: "Basic Information",
      icon: "🐾",
      items: [
        { label: "Name", value: "Max" },
        { label: "Species", value: "Dog" },
        { label: "Breed", value: "Golden Retriever" },
        { label: "Gender", value: "Male" },
        { label: "Weight", value: "65 lbs" },
        { label: "Birthday", value: "5/15/2020" },
      ],
    },
    // ... other steps
  }

  return (
    <div>
      {/* Review cards with edit buttons */}
      {/* Each card shows summary of that step */}
    </div>
  )
}

/**
 * Example: Confirmation dialog
 */
export function ConfirmationDialogExample() {
  return (
    <div>
      {/* AlertDialog component */}
      {/* Shows pet name, species, breed, visibility */}
      {/* "Cancel" and "Yes, Create Profile" buttons */}
    </div>
  )
}
