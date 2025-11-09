import type { Pet, User } from '@/lib/types'

export function canViewHealth(pet: Pet, user: User | null, viaShareToken: boolean): boolean {
  if (user && user.id === pet.ownerId) return true
  if (user && Array.isArray(pet.coOwners)) {
    const entry = pet.coOwners.find((c) => c.userId === user.id)
    if (entry?.permissions?.viewHealth) return true
  }
  if (viaShareToken) return true
  return false
}

export function canEditHealth(pet: Pet, user: User | null): boolean {
  if (user && user.id === pet.ownerId) return true
  if (user && Array.isArray(pet.coOwners)) {
    const entry = pet.coOwners.find((c) => c.userId === user.id)
    if (entry?.permissions?.editHealth || entry?.permissions?.editProfile) return true
  }
  return false
}

export function pickHealthFields(pet: Pet) {
  const {
    healthRecords,
    vaccinations,
    medications,
    allergies,
    allergySeverities,
    conditions,
    vetInfo,
    insurance,
    microchipId,
    microchipCompany,
    microchipRegistrationStatus,
    microchipCertificateUrl,
    weightHistory,
  } = pet
  return {
    healthRecords, vaccinations, medications, allergies, allergySeverities, conditions,
    vetInfo, insurance, microchipId, microchipCompany, microchipRegistrationStatus, microchipCertificateUrl,
    weightHistory,
  }
}

