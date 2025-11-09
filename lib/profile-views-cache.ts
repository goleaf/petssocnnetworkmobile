import { getCached, setCached } from '@/lib/scalability/cache-layer'

function hourKey(date = new Date()): string {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  const h = `${d.getHours()}`.padStart(2, '0')
  return `${y}${m}${day}${h}`
}

export async function incrementProfileViewCached(userId: string, at: Date = new Date()): Promise<void> {
  const key = `profile:views-hourly:${userId}:${hourKey(at)}`
  const current = (await getCached<number>(key)) || 0
  const next = current + 1
  // keep for 7 days
  await setCached(key, next, 7 * 24 * 3600)
}

export async function getProfileViewsHourlySeries(userId: string, hours: number = 24): Promise<Array<{ hour: string; count: number }>> {
  const out: Array<{ hour: string; count: number }> = []
  const now = new Date()
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(now.getHours() - i, 0, 0, 0)
    const key = `profile:views-hourly:${userId}:${hourKey(d)}`
    const count = (await getCached<number>(key)) || 0
    out.push({ hour: d.toISOString().slice(0, 13) + ':00', count })
  }
  return out
}

