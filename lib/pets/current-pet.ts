const CURRENT_PET_KEY = "pet_social_current_pet_id"

export function getCurrentPetId(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(CURRENT_PET_KEY)
  } catch {
    return null
  }
}

export function setCurrentPetId(petId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CURRENT_PET_KEY, petId)
    window.dispatchEvent(new CustomEvent("pet_social_current_pet_changed", { detail: { petId } }))
  } catch {}
}

