import { initializeStorage, addPet, getPetById } from '@/lib/storage'
import type { Pet, Medication } from '@/lib/types'
import { markMedicationDoseGivenToday, getMedicationAdherenceCountThisMonth, getMedicationAdherencePercentThisMonth } from '@/lib/pet-medication'

describe('Integration: Medication logging with adherence tracking', () => {
  beforeEach(() => {
    initializeStorage()
  })

  it('logs doses and computes adherence percent for current month', () => {
    const today = new Date().toISOString().split('T')[0]!
    const pet: Pet = {
      id: `pet_med_${Date.now()}`,
      ownerId: '1',
      name: 'Meds Pup',
      species: 'dog',
      followers: [],
      medications: [
        { id: 'm1', name: 'DailyMed', dosage: '5mg', frequency: 'daily', startDate: today } as Medication,
      ],
    }
    addPet(pet)

    // mark dose twice
    markMedicationDoseGivenToday(pet.id, 'm1')
    markMedicationDoseGivenToday(pet.id, 'm1')

    const updated = getPetById(pet.id)!
    const count = getMedicationAdherenceCountThisMonth(updated, 'm1')
    expect(count).toBeGreaterThanOrEqual(1)

    const percent = getMedicationAdherencePercentThisMonth(updated, 'm1')
    expect(percent).toBeGreaterThan(0)
    expect(percent).toBeLessThanOrEqual(100)
  })
})

