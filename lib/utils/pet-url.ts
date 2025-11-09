import { getUsers, getPets } from "@/lib/storage"

/**
 * Get pet URL path (username/pet-slug)
 */
export function getPetUrl(petId: string): string {
  const pets = getPets()
  const users = getUsers()
  const pet = pets.find((p) => p.id === petId)
  if (!pet) return `/pet/${petId}` // Fallback to old route
  
  const owner = users.find((u) => u.id === pet.ownerId)
  if (!owner) return `/pet/${petId}` // Fallback to old route
  
  const slug = pet.slug || pet.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
  return `/user/${owner.username}/pet/${slug}`
}

/**
 * Get pet URL from pet object (avoids additional lookups)
 */
export function getPetUrlFromPet(pet: any, ownerUsername?: string): string {
  if (!pet) return "#"
  const slug = pet.slug || pet.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
  // If username is provided, use it; otherwise, resolve from storage
  if (ownerUsername && typeof ownerUsername === 'string' && ownerUsername.length > 0) {
    return `/user/${ownerUsername}/pet/${slug}`
  }
  try {
    const users = getUsers()
    const owner = users.find((u) => u.id === pet.ownerId)
    if (owner?.username) {
      return `/user/${owner.username}/pet/${slug}`
    }
  } catch {}
  // Fallback to legacy route if owner cannot be resolved
  return `/pet/${pet.id}`
}
