import { generateMedicationSchedule } from '@/lib/health/utils'

describe('Medication schedule generation', () => {
  const start = '2024-06-01T08:00:00.000Z'

  it('daily produces 24h steps', () => {
    const list = generateMedicationSchedule(start, 'daily', 3)
    expect(list).toHaveLength(3)
    expect(list[0]).toBe(start)
    expect(new Date(list[1]).getTime() - new Date(list[0]).getTime()).toBe(24*60*60*1000)
    expect(new Date(list[2]).getTime() - new Date(list[1]).getTime()).toBe(24*60*60*1000)
  })

  it('twice daily produces 12h steps', () => {
    const list = generateMedicationSchedule(start, 'twice_daily', 4)
    expect(list).toHaveLength(4)
    expect(new Date(list[1]).getTime() - new Date(list[0]).getTime()).toBe(12*60*60*1000)
  })

  it('every_8_hours produces 8h steps', () => {
    const list = generateMedicationSchedule(start, 'every_8_hours', 5)
    expect(new Date(list[1]).getTime() - new Date(list[0]).getTime()).toBe(8*60*60*1000)
  })

  it('weekly produces 7d steps', () => {
    const list = generateMedicationSchedule(start, 'weekly', 2)
    expect(new Date(list[1]).getTime() - new Date(list[0]).getTime()).toBe(7*24*60*60*1000)
  })
})

