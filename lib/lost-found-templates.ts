/**
 * Lost & Found templates per city
 */

export interface LostFoundTemplate {
  id: string
  city: string
  title: string
  description: string
  fields: LostFoundField[]
  defaultTags: string[]
}

export interface LostFoundField {
  id: string
  label: string
  type: "text" | "textarea" | "select" | "date" | "file" | "location"
  required: boolean
  options?: string[] // For select fields
  placeholder?: string
}

// City-specific templates
const LOST_FOUND_TEMPLATES: Record<string, LostFoundTemplate> = {
  "New York": {
    id: "nyc-lost-found",
    city: "New York",
    title: "Lost Pet Report - NYC",
    description: "Report a lost pet in New York City",
    fields: [
      { id: "pet_name", label: "Pet Name", type: "text", required: true, placeholder: "Enter pet's name" },
      { id: "species", label: "Species", type: "select", required: true, options: ["Dog", "Cat", "Bird", "Rabbit", "Other"] },
      { id: "breed", label: "Breed", type: "text", required: false, placeholder: "Enter breed" },
      { id: "color", label: "Color/Markings", type: "text", required: true, placeholder: "Describe color and markings" },
      { id: "last_seen", label: "Last Seen", type: "date", required: true },
      { id: "last_location", label: "Last Known Location", type: "location", required: true, placeholder: "Street address or landmark" },
      { id: "contact", label: "Contact Information", type: "text", required: true, placeholder: "Phone or email" },
      { id: "reward", label: "Reward Offered", type: "text", required: false, placeholder: "Amount if applicable" },
      { id: "additional_info", label: "Additional Information", type: "textarea", required: false, placeholder: "Any other details" },
      { id: "photos", label: "Photos", type: "file", required: true },
    ],
    defaultTags: ["lost-pet", "nyc", "missing"],
  },
  "Los Angeles": {
    id: "la-lost-found",
    city: "Los Angeles",
    title: "Lost Pet Report - LA",
    description: "Report a lost pet in Los Angeles",
    fields: [
      { id: "pet_name", label: "Pet Name", type: "text", required: true, placeholder: "Enter pet's name" },
      { id: "species", label: "Species", type: "select", required: true, options: ["Dog", "Cat", "Bird", "Rabbit", "Other"] },
      { id: "breed", label: "Breed", type: "text", required: false, placeholder: "Enter breed" },
      { id: "color", label: "Color/Markings", type: "text", required: true, placeholder: "Describe color and markings" },
      { id: "last_seen", label: "Last Seen", type: "date", required: true },
      { id: "last_location", label: "Last Known Location", type: "location", required: true, placeholder: "Neighborhood or address" },
      { id: "contact", label: "Contact Information", type: "text", required: true, placeholder: "Phone or email" },
      { id: "microchip", label: "Microchip Number", type: "text", required: false, placeholder: "If available" },
      { id: "additional_info", label: "Additional Information", type: "textarea", required: false, placeholder: "Any other details" },
      { id: "photos", label: "Photos", type: "file", required: true },
    ],
    defaultTags: ["lost-pet", "los-angeles", "missing"],
  },
  "Chicago": {
    id: "chicago-lost-found",
    city: "Chicago",
    title: "Lost Pet Report - Chicago",
    description: "Report a lost pet in Chicago",
    fields: [
      { id: "pet_name", label: "Pet Name", type: "text", required: true, placeholder: "Enter pet's name" },
      { id: "species", label: "Species", type: "select", required: true, options: ["Dog", "Cat", "Bird", "Rabbit", "Other"] },
      { id: "breed", label: "Breed", type: "text", required: false, placeholder: "Enter breed" },
      { id: "color", label: "Color/Markings", type: "text", required: true, placeholder: "Describe color and markings" },
      { id: "last_seen", label: "Last Seen", type: "date", required: true },
      { id: "last_location", label: "Last Known Location", type: "location", required: true, placeholder: "Neighborhood or address" },
      { id: "contact", label: "Contact Information", type: "text", required: true, placeholder: "Phone or email" },
      { id: "additional_info", label: "Additional Information", type: "textarea", required: false, placeholder: "Any other details" },
      { id: "photos", label: "Photos", type: "file", required: true },
    ],
    defaultTags: ["lost-pet", "chicago", "missing"],
  },
}

// Default template for cities without specific templates
const DEFAULT_TEMPLATE: LostFoundTemplate = {
  id: "default-lost-found",
  city: "Default",
  title: "Lost Pet Report",
  description: "Report a lost pet",
  fields: [
    { id: "pet_name", label: "Pet Name", type: "text", required: true, placeholder: "Enter pet's name" },
    { id: "species", label: "Species", type: "select", required: true, options: ["Dog", "Cat", "Bird", "Rabbit", "Other"] },
    { id: "breed", label: "Breed", type: "text", required: false, placeholder: "Enter breed" },
    { id: "color", label: "Color/Markings", type: "text", required: true, placeholder: "Describe color and markings" },
    { id: "last_seen", label: "Last Seen", type: "date", required: true },
    { id: "last_location", label: "Last Known Location", type: "location", required: true, placeholder: "Address or landmark" },
    { id: "contact", label: "Contact Information", type: "text", required: true, placeholder: "Phone or email" },
    { id: "additional_info", label: "Additional Information", type: "textarea", required: false, placeholder: "Any other details" },
    { id: "photos", label: "Photos", type: "file", required: true },
  ],
  defaultTags: ["lost-pet", "missing"],
}

/**
 * Get Lost & Found template for a city
 */
export function getLostFoundTemplate(city?: string): LostFoundTemplate {
  if (!city) {
    return DEFAULT_TEMPLATE
  }

  // Try exact match first
  if (LOST_FOUND_TEMPLATES[city]) {
    return LOST_FOUND_TEMPLATES[city]
  }

  // Try case-insensitive match
  const cityKey = Object.keys(LOST_FOUND_TEMPLATES).find(
    (key) => key.toLowerCase() === city.toLowerCase()
  )

  if (cityKey) {
    return LOST_FOUND_TEMPLATES[cityKey]
  }

  return DEFAULT_TEMPLATE
}

/**
 * Get all available city templates
 */
export function getAvailableCityTemplates(): string[] {
  return Object.keys(LOST_FOUND_TEMPLATES)
}

/**
 * Create a post from Lost & Found template data
 */
export function createLostFoundPost(
  template: LostFoundTemplate,
  fieldData: Record<string, string | string[]>
): {
  title: string
  content: string
  tags: string[]
} {
  const petName = fieldData.pet_name as string || "Pet"
  const species = fieldData.species as string || "Unknown"
  const lastLocation = fieldData.last_location as string || "Unknown location"
  const lastSeen = fieldData.last_seen as string || "Unknown date"

  const title = `Lost ${species}: ${petName} - Last seen ${lastSeen}`

  let content = `**Lost Pet Report**\n\n`
  content += `**Pet Name:** ${petName}\n`
  content += `**Species:** ${species}\n`

  // Add all field data
  template.fields.forEach((field) => {
    const value = fieldData[field.id]
    if (value && field.id !== "photos") {
      content += `**${field.label}:** ${Array.isArray(value) ? value.join(", ") : value}\n`
    }
  })

  content += `\n**Last Known Location:** ${lastLocation}\n`
  content += `**Last Seen:** ${lastSeen}\n`

  if (fieldData.additional_info) {
    content += `\n**Additional Information:**\n${fieldData.additional_info}\n`
  }

  const tags = [...template.defaultTags]
  if (species) {
    tags.push(species.toLowerCase())
  }

  return {
    title,
    content,
    tags,
  }
}

