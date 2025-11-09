import { initializeStorage, addPet, getPetsByOwnerId } from '@/lib/storage'
import type { Pet, Vaccination } from '@/lib/types'
import { runPetHealthReminderSweep } from '@/lib/pet-notifications'
import { getNotificationsByUserId } from '@/lib/notifications'

describe('Integration: Vaccination tracking with reminders', () => {
  beforeEach(() => {
    initializeStorage()
  })

  it('creates a reminder notification when vaccination is due soon', () => {
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]!
    const pet: Pet = {
      id: `pet_vacc_${Date.now()}`,
      ownerId: '1',
      name: 'Vax Pup',
      species: 'dog',
      followers: [],
      vaccinations: [
        { id: 'v1', name: 'Rabies', date: new Date().toISOString().split('T')[0]!, nextDue: tomorrow } as Vaccination,
      ],
    }
    addPet(pet)

    runPetHealthReminderSweep('1')
    const notifications = getNotificationsByUserId('1')
    const match = notifications.find(n => (n.category ?? 'reminders') === 'reminders' && n.message?.includes('vaccination is due'))
    expect(match).toBeTruthy()
  })
})

