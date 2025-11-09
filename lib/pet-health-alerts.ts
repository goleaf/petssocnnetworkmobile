import type { Pet } from './types'
import { getPetById } from './storage'
import { updatePetEncrypted } from './pet-health-storage'
import { createNotification } from './notifications'

export function logWeight(petId: string, dateIso: string, weight: number): Pet | undefined {
  const pet = getPetById(petId)
  if (!pet) return undefined
  const history = Array.isArray(pet.weightHistory) ? [...pet.weightHistory] : []
  // Replace if date exists
  const idx = history.findIndex((e) => e.date === dateIso)
  if (idx !== -1) history[idx] = { date: dateIso, weight }
  else history.push({ date: dateIso, weight })
  const updated: Pet = { ...pet, weightHistory: history }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  updatePetEncrypted(updated)
  return updated
}

export function checkRapidWeightChangeAndAlert(pet: Pet, userId: string, percentThreshold = 10): boolean {
  const hist = Array.isArray(pet.weightHistory) ? [...pet.weightHistory] : []
  if (hist.length < 2) return false
  // Compare last 2 records
  const a = hist[hist.length - 2]!
  const b = hist[hist.length - 1]!
  if (a.weight <= 0) return false
  const change = ((b.weight - a.weight) / a.weight) * 100
  const abs = Math.abs(change)
  if (abs >= percentThreshold) {
    createNotification({
      userId,
      type: 'watch_update',
      targetId: pet.id,
      targetType: 'pet',
      category: 'reminders',
      priority: 'high',
      message: `⚠️ Rapid weight ${change > 0 ? 'gain' : 'loss'} detected for ${pet.name}: ${abs.toFixed(1)}%.`,
      metadata: { petId: pet.id, changePercent: Number(abs.toFixed(1)) },
      channels: ['in_app', 'push']
    })
    return true
  }
  return false
}

