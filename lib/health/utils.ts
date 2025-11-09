import { addYears, isValid } from 'date-fns'

export function getVaccinationNextDue(givenDateIso: string, interval: '1y' | '3y'): string {
  const base = new Date(givenDateIso)
  const years = interval === '3y' ? 3 : 1
  if (!isValid(base)) throw new Error('Invalid date')
  const result = addYears(base, years)
  // Handle Feb 29 -> Feb 28 on non-leap year for predictable due dates
  if (base.getMonth() === 1 && base.getDate() === 29 && result.getMonth() === 2 && result.getDate() === 1) {
    // Move back to Feb 28
    result.setMonth(1, 28)
  }
  const y = result.getFullYear()
  const m = String(result.getMonth() + 1).padStart(2, '0')
  const d = String(result.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export type MedicationFrequency = 'daily' | 'twice_daily' | 'weekly' | `every_${number}_hours`

export function generateMedicationSchedule(startIso: string, frequency: MedicationFrequency, occurrences: number): string[] {
  const out: string[] = []
  let t = new Date(startIso).getTime()
  if (!Number.isFinite(t)) throw new Error('Invalid start time')
  const push = () => out.push(new Date(t).toISOString())
  push()
  let stepMs: number
  if (frequency === 'daily') stepMs = 24 * 60 * 60 * 1000
  else if (frequency === 'twice_daily') stepMs = 12 * 60 * 60 * 1000
  else if (frequency === 'weekly') stepMs = 7 * 24 * 60 * 60 * 1000
  else if (frequency.startsWith('every_') && frequency.endsWith('_hours')) {
    const hours = Number.parseInt(frequency.split('_')[1] || '0', 10)
    if (!Number.isFinite(hours) || hours <= 0) throw new Error('Invalid frequency hours')
    stepMs = hours * 60 * 60 * 1000
  } else {
    throw new Error('Unsupported frequency')
  }
  for (let i = 1; i < occurrences; i++) {
    t += stepMs
    push()
  }
  return out
}

export type WeightEntry = { date: string; weight: number }
export type WeightTrend = 'gain' | 'loss' | 'stable'

export function analyzeWeightTrend(history: WeightEntry[], stableThresholdPercent = 3): WeightTrend {
  const ordered = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (ordered.length < 2) return 'stable'
  const start = ordered[0]!
  const end = ordered[ordered.length - 1]!
  if (start.weight <= 0) return 'stable'
  const change = ((end.weight - start.weight) / start.weight) * 100
  if (Math.abs(change) < stableThresholdPercent) return 'stable'
  return change > 0 ? 'gain' : 'loss'
}

export function getHealthyWeightRangeByBreed(breed: string): { min: number; max: number; unit: 'lb' } {
  const key = breed.trim().toLowerCase()
  // Approximate typical adult ranges
  const table: Record<string, { min: number; max: number }> = {
    'golden retriever': { min: 55, max: 75 },
    'labrador retriever': { min: 55, max: 80 },
    'german shepherd': { min: 50, max: 90 },
    'beagle': { min: 20, max: 30 },
    'maine coon': { min: 9, max: 18 },
  }
  const found = table[key]
  if (found) return { ...found, unit: 'lb' }
  // Fallback broad range
  return { min: 5, max: 200, unit: 'lb' }
}

