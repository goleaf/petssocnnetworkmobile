"use client"

import { getUsers } from '@/lib/storage'
import { calculateAge } from '@/lib/utils/date'

// local copies of analytics keys to access raw events
const VIEWS_KEY = 'profile_analytics_views'
const FOLLOWS_KEY = 'profile_analytics_follows'

type GenderKey = 'male' | 'female' | 'other' | 'unknown'
type AgeBucket = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+'

export type AudienceDemographics = {
  gender: Record<GenderKey, number>
  ages: Record<AgeBucket, number>
  topCountries: Array<{ name: string; count: number }>
  topCities: Array<{ name: string; count: number }>
}

export type HourlyHeatmap = {
  grid: number[][] // [7][24]
  best: Array<{ day: number; hour: number; count: number }>
}

export type GrowthPoint = { date: string; count: number }
export type GrowthMilestone = { date: string; label: string; count: number }

export function getFollowerDemographics(profileId: string): AudienceDemographics {
  const users = getUsers()
  const user = users.find((u) => u.id === profileId)
  if (!user) {
    return {
      gender: { male: 0, female: 0, other: 0, unknown: 0 },
      ages: { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 },
      topCountries: [],
      topCities: [],
    }
  }
  const followerMap = new Map<string, number>()
  const gender: Record<GenderKey, number> = { male: 0, female: 0, other: 0, unknown: 0 }
  const ages: Record<AgeBucket, number> = { '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 }
  const countryCounts: Record<string, number> = {}
  const cityCounts: Record<string, number> = {}

  const followers = users.filter((u) => user.followers.includes(u.id))
  followers.forEach((f) => {
    // gender
    const g = (f.gender || '').toString().toLowerCase()
    if (g === 'male' || g === 'm') gender.male++
    else if (g === 'female' || g === 'f') gender.female++
    else if (g === 'non-binary' || g === 'other') gender.other++
    else gender.unknown++

    // age
    let age: number | null = null
    if (f.dateOfBirth) {
      try { age = calculateAge(f.dateOfBirth) } catch { age = null }
    }
    if (typeof age === 'number') {
      if (age < 18) ages['13-17']++
      else if (age <= 24) ages['18-24']++
      else if (age <= 34) ages['25-34']++
      else if (age <= 44) ages['35-44']++
      else if (age <= 54) ages['45-54']++
      else if (age <= 64) ages['55-64']++
      else ages['65+']++
    }

    // location – prefer country/city fields from formData if available, else parse location string
    const country = (f as any).country || parseCountry(f.location) || 'Unknown'
    const city = (f as any).city || parseCity(f.location) || 'Unknown'
    countryCounts[country] = (countryCounts[country] || 0) + 1
    cityCounts[city] = (cityCounts[city] || 0) + 1
  })

  const topCountries = topN(countryCounts, 5)
  const topCities = topN(cityCounts, 5)
  return { gender, ages, topCountries, topCities }
}

export function getFollowerActivityHeatmap(profileId: string): HourlyHeatmap {
  if (typeof window === 'undefined') return { grid: Array.from({ length: 7 }, () => Array(24).fill(0)), best: [] }
  const users = getUsers()
  const user = users.find((u) => u.id === profileId)
  if (!user) return { grid: Array.from({ length: 7 }, () => Array(24).fill(0)), best: [] }
  const followerIds = new Set(user.followers)

  let raw: any[] = []
  try {
    raw = JSON.parse(localStorage.getItem(VIEWS_KEY) || '[]')
  } catch {}

  const grid = Array.from({ length: 7 }, () => Array(24).fill(0))
  raw
    .filter((r) => r.profileId === profileId)
    .filter((r) => followerIds.has(r.viewerKey))
    .forEach((r) => {
      const d = new Date(r.ts)
      const dow = d.getDay() // 0=Sun..6=Sat
      const hr = d.getHours()
      grid[dow][hr]++
    })
  const flat: Array<{ day: number; hour: number; count: number }> = []
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) flat.push({ day: d, hour: h, count: grid[d][h] })
  flat.sort((a, b) => b.count - a.count)
  const best = flat.slice(0, 6) // top 6 cells
  return { grid, best }
}

export function getFollowerGrowthSeries(profileId: string, days: number = 30): { series: GrowthPoint[]; milestones: GrowthMilestone[] } {
  const users = getUsers()
  const user = users.find((u) => u.id === profileId)
  const currentCount = user?.followers?.length ?? 0

  let events: Array<{ profileId: string; followerId: string; action: string; ts: number }> = []
  if (typeof window !== 'undefined') {
    try { events = JSON.parse(localStorage.getItem(FOLLOWS_KEY) || '[]') } catch {}
  }
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const myFollows = events.filter((e) => e.profileId === profileId && e.action === 'follow' && e.ts >= since)

  // Tally gains per day
  const dayMap: Record<string, number> = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  myFollows.forEach((e) => {
    const key = new Date(e.ts).toISOString().slice(0, 10)
    if (dayMap[key] !== undefined) dayMap[key]++
  })

  const keys = Object.keys(dayMap).sort()
  const totalGained = keys.reduce((acc, k) => acc + (dayMap[k] || 0), 0)
  const base = Math.max(0, currentCount - totalGained)
  let running = base
  const series: GrowthPoint[] = keys.map((k) => {
    running += dayMap[k] || 0
    return { date: k, count: running }
  })

  // Milestones
  const thresholds = [10, 50, 100, 500, 1000]
  const milestones: GrowthMilestone[] = []
  thresholds.forEach((t) => {
    const hit = series.find((p) => p.count >= t)
    if (hit) milestones.push({ date: hit.date, count: hit.count, label: `${t}` })
  })
  return { series, milestones }
}

function parseCountry(loc?: string | null): string | null {
  if (!loc) return null
  const parts = loc.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) return parts[parts.length - 1]
  return null
}

function parseCity(loc?: string | null): string | null {
  if (!loc) return null
  const parts = loc.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 1) return parts[0]
  return null
}

function topN(counts: Record<string, number>, n: number): Array<{ name: string; count: number }> {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const top = entries.slice(0, n)
  const otherCount = entries.slice(n).reduce((acc, [, c]) => acc + c, 0)
  if (otherCount > 0) top.push(['Other', otherCount])
  return top.map(([name, count]) => ({ name, count }))
}
