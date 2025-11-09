"use client"

import { clearCache } from "@/lib/offline-cache"
import {
  getUserConversations,
  getDirectMessagesByConversation,
  replaceMessagesForConversation,
} from "@/lib/storage"
import { getDraftsByUserId, deleteDraft } from "@/lib/drafts"

export type DMRetention = "never" | "30d" | "90d" | "1y"
export type DraftRetention = "never" | "7d" | "30d"
export type SearchHistoryPolicy = "session" | "weekly" | "monthly" | "manual"
export type CacheClearInterval = "never" | "weekly" | "monthly"

export interface DataRetentionSettings {
  userId: string
  deleteDMsOlderThan: DMRetention
  deleteDraftsOlderThan: DraftRetention
  clearSearchHistory: SearchHistoryPolicy
  clearCacheEvery: CacheClearInterval
  // Internal bookkeeping for last runs
  lastApplied?: {
    dms?: string
    drafts?: string
    searchHistory?: string
    cache?: string
  }
  updatedAt: string
}

const STORAGE_KEY_PREFIX = "data_retention_settings_"

const nowIso = () => new Date().toISOString()

function defaultSettings(userId: string): DataRetentionSettings {
  return {
    userId,
    deleteDMsOlderThan: "never",
    deleteDraftsOlderThan: "never",
    clearSearchHistory: "manual",
    clearCacheEvery: "never",
    lastApplied: {},
    updatedAt: nowIso(),
  }
}

export function getDataRetentionSettings(userId: string): DataRetentionSettings {
  const defaults = defaultSettings(userId)
  if (typeof window === "undefined" || !userId) return defaults
  const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
  if (!raw) return defaults
  try {
    const parsed = JSON.parse(raw) as DataRetentionSettings
    return {
      ...defaults,
      ...parsed,
      lastApplied: { ...(defaults.lastApplied ?? {}), ...(parsed.lastApplied ?? {}) },
    }
  } catch {
    return defaults
  }
}

export function saveDataRetentionSettings(settings: DataRetentionSettings) {
  if (typeof window === "undefined") return
  const normalized: DataRetentionSettings = {
    ...settings,
    lastApplied: { ...(settings.lastApplied ?? {}) },
    updatedAt: nowIso(),
  }
  window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${settings.userId}`, JSON.stringify(normalized))
}

function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000
}

function retentionToCutoff(ret: DMRetention | DraftRetention): number | null {
  const now = Date.now()
  switch (ret) {
    case "never":
      return null
    case "7d":
      return now - daysToMs(7)
    case "30d":
      return now - daysToMs(30)
    case "90d":
      return now - daysToMs(90)
    case "1y":
      return now - daysToMs(365)
    default:
      return null
  }
}

function intervalToMs(interval: CacheClearInterval | Exclude<SearchHistoryPolicy, "session">): number | null {
  switch (interval) {
    case "weekly":
      return daysToMs(7)
    case "monthly":
      return daysToMs(30)
    case "never":
    case "manual":
      return null
    default:
      return null
  }
}

async function pruneDirectMessages(userId: string, setting: DMRetention): Promise<boolean> {
  const cutoff = retentionToCutoff(setting)
  if (cutoff == null) return false
  const conversations = getUserConversations(userId)
  if (conversations.length === 0) return false
  let changed = false
  for (const conv of conversations) {
    const before = getDirectMessagesByConversation(conv.id)
    const after = before.filter((m) => {
      const t = new Date(m.createdAt).getTime()
      return Number.isFinite(t) && t >= cutoff
    })
    if (after.length !== before.length) {
      replaceMessagesForConversation(conv.id, after)
      changed = true
    }
  }
  return changed
}

async function pruneDrafts(userId: string, setting: DraftRetention): Promise<boolean> {
  const cutoff = retentionToCutoff(setting)
  if (cutoff == null) return false
  const drafts = getDraftsByUserId(userId)
  let changed = false
  for (const d of drafts) {
    const t = new Date(d.lastSaved || d.createdAt).getTime()
    if (Number.isFinite(t) && t < cutoff) {
      deleteDraft(d.id)
      changed = true
    }
  }
  return changed
}

function clearSearchHistoryIfNeeded(policy: SearchHistoryPolicy, lastAppliedAt?: string): boolean {
  if (typeof window === "undefined") return false
  const SEARCH_HISTORY_KEY = "search_history"
  const now = Date.now()
  if (policy === "manual") return false
  if (policy === "session") {
    // Clear every session start
    window.localStorage.removeItem(SEARCH_HISTORY_KEY)
    return true
  }
  const interval = intervalToMs(policy)
  if (interval == null) return false
  const last = lastAppliedAt ? new Date(lastAppliedAt).getTime() : 0
  if (!last || now - last >= interval) {
    window.localStorage.removeItem(SEARCH_HISTORY_KEY)
    return true
  }
  return false
}

async function clearCacheIfNeeded(policy: CacheClearInterval, lastAppliedAt?: string): Promise<boolean> {
  const now = Date.now()
  const interval = intervalToMs(policy)
  if (interval == null) return false
  const last = lastAppliedAt ? new Date(lastAppliedAt).getTime() : 0
  if (!last || now - last >= interval) {
    try {
      await clearCache()
    } catch {}
    return true
  }
  return false
}

export async function runDataRetentionForUser(userId: string): Promise<void> {
  if (!userId || typeof window === "undefined") return
  const settings = getDataRetentionSettings(userId)

  const last = settings.lastApplied ?? {}

  const dmsChanged = await pruneDirectMessages(userId, settings.deleteDMsOlderThan)
  if (dmsChanged) last.dms = nowIso()

  const draftsChanged = await pruneDrafts(userId, settings.deleteDraftsOlderThan)
  if (draftsChanged) last.drafts = nowIso()

  const clearedSearch = clearSearchHistoryIfNeeded(settings.clearSearchHistory, last.searchHistory)
  if (clearedSearch) last.searchHistory = nowIso()

  const clearedCache = await clearCacheIfNeeded(settings.clearCacheEvery, last.cache)
  if (clearedCache) last.cache = nowIso()

  saveDataRetentionSettings({ ...settings, lastApplied: last })
}

