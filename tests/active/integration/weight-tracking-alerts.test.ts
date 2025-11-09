import { initializeStorage, addPet } from '@/lib/storage'
import type { Pet } from '@/lib/types'
import { logWeight, checkRapidWeightChangeAndAlert } from '@/lib/pet-health-alerts'
import { getNotificationsByUserId } from '@/lib/notifications'

describe('Integration: Weight tracking with rapid change alerts', () => {
  beforeEach(() => initializeStorage())

  it('triggers alert when weight change exceeds threshold', () => {
    const pet: Pet = {
      id: `pet_weight_${Date.now()}`,
      ownerId: '1',
      name: 'Scale Pup',
      species: 'dog',
      followers: [],
      weightHistory: [],
    }
    addPet(pet)

    const day1 = new Date()
    day1.setDate(day1.getDate() - 7)
    const day1Iso = day1.toISOString().split('T')[0]!
    const todayIso = new Date().toISOString().split('T')[0]!

    logWeight(pet.id, day1Iso, 10)
    const updated = logWeight(pet.id, todayIso, 12)!
    const alerted = checkRapidWeightChangeAndAlert(updated, '1', 10)
    expect(alerted).toBe(true)

    const notifs = getNotificationsByUserId('1')
    const found = notifs.find(n => (n.category ?? 'reminders') === 'reminders' && n.message?.includes('Rapid weight'))
    expect(found).toBeTruthy()
  })
})

