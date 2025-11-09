import type { Pet } from './types'
import { getPetById } from './storage'
import { updatePetEncrypted } from './pet-health-storage'

function todayIsoDate(): string {
  const d = new Date()
  d.setHours(0,0,0,0)
  return d.toISOString().split('T')[0]!
}

export function markMedicationDoseGivenToday(petId: string, medicationId: string): Pet | undefined {
  const pet = getPetById(petId)
  if (!pet) return undefined
  const log = { ...(pet.medicationAdherence ?? {}) }
  const dates = Array.isArray(log[medicationId]) ? [...log[medicationId]!] : []
  const today = todayIsoDate()
  if (!dates.includes(today)) dates.push(today)
  const updated: Pet = { ...pet, medicationAdherence: { ...log, [medicationId]: dates } }
  // Persist with encryption preserved
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  updatePetEncrypted(updated)
  return updated
}

export function getMedicationAdherenceCountThisMonth(pet: Pet, medicationId: string): number {
  const dates = pet.medicationAdherence?.[medicationId] ?? []
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  return dates.filter((iso) => {
    const d = new Date(iso)
    return d.getUTCFullYear() === y && d.getUTCMonth() === m
  }).length
}

export function getMedicationAdherencePercentThisMonth(pet: Pet, medicationId: string): number {
  const count = getMedicationAdherenceCountThisMonth(pet, medicationId)
  const now = new Date()
  const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate()
  // Assume daily regimen for a rough adherence percentage in this demo
  return Math.min(100, Math.round((count / daysInMonth) * 100))
}
