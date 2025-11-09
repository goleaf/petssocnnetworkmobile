"use client"

import type {
  AutoPlayVideosPreference,
  CellularDataUsage,
  CaptionLanguagePreference,
  MediaSettings,
} from "./types"
import { isOnWifi } from "./utils/network"

const STORAGE_PREFIX = "media_settings_"

function nowIso(): string {
  return new Date().toISOString()
}

export function createDefaultMediaSettings(userId: string): MediaSettings {
  return {
    userId,
    // Accessibility-first: default video autoplay off
    autoPlayVideos: "never",
    autoPlayGifs: true,
    // Default to high quality so existing uploads remain unchanged
    highQualityUploads: true,
    // Reasonable default that still loads media on cellular
    cellularDataUsage: "reduced",
    // Accessibility defaults
    showCaptions: true,
    captionLanguage: "auto",
    audioDescriptions: false,
    flashWarnings: true,
    updatedAt: nowIso(),
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function normalizeSettings(settings: MediaSettings): MediaSettings {
  const copy: MediaSettings = { ...settings }
  const allowedVideo: AutoPlayVideosPreference[] = ["always", "wifi", "never"]
  if (!allowedVideo.includes(copy.autoPlayVideos)) copy.autoPlayVideos = "always"
  const allowedCell: CellularDataUsage[] = ["unrestricted", "reduced", "minimal"]
  if (!allowedCell.includes(copy.cellularDataUsage)) copy.cellularDataUsage = "reduced"
  const allowedCaption: CaptionLanguagePreference[] = ["auto", "en", "es"]
  if (copy.captionLanguage && !allowedCaption.includes(copy.captionLanguage)) copy.captionLanguage = "auto"
  if (typeof copy.showCaptions !== "boolean") copy.showCaptions = true
  if (typeof copy.audioDescriptions !== "boolean") copy.audioDescriptions = false
  if (typeof copy.flashWarnings !== "boolean") copy.flashWarnings = true
  return copy
}

export function getMediaSettings(userId: string): MediaSettings {
  const defaults = createDefaultMediaSettings(userId)
  if (typeof window === "undefined" || !userId) return defaults
  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`)
  const parsed = safeParse<Partial<MediaSettings>>(raw, {})
  const merged: MediaSettings = normalizeSettings({
    ...defaults,
    ...parsed,
    userId,
    updatedAt: parsed.updatedAt ?? defaults.updatedAt,
  })
  return merged
}

export function saveMediaSettings(next: MediaSettings): void {
  if (typeof window === "undefined") return
  const normalized = normalizeSettings({ ...next, updatedAt: nowIso() })
  window.localStorage.setItem(`${STORAGE_PREFIX}${normalized.userId}`, JSON.stringify(normalized))
}

/**
 * Helper for components to decide if videos should autoplay given current conditions.
 * Conservative behavior: if Wi‑Fi is required but cannot be detected, returns false.
 */
export function resolveShouldAutoplayVideos(settings: MediaSettings): boolean {
  switch (settings.autoPlayVideos) {
    case "always":
      return true
    case "never":
      return false
    case "wifi": {
      const wifi = isOnWifi()
      return wifi === true
    }
    default:
      return true
  }
}
