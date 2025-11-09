"use client"

import { create } from "zustand"
import type { UnitSystem } from "@/lib/i18n/formatting"

type PreferencesState = {
  // When undefined, fall back to locale-based default
  unitSystem?: UnitSystem
  setUnitSystem: (unit: UnitSystem) => void
  clearUnitSystem: () => void
  // Feed behavior
  feedAutoLoad: boolean
  setFeedAutoLoad: (enabled: boolean) => void
}

const STORAGE_KEY = "preference_unit_system"
const FEED_AUTOLOAD_KEY = "preference_feed_auto_load"

export const usePreferences = create<PreferencesState>((set) => ({
  unitSystem:
    typeof window !== "undefined"
      ? ((): UnitSystem | undefined => {
          try {
            const raw = window.localStorage.getItem(STORAGE_KEY)
            if (!raw) return undefined
            return raw === "imperial" || raw === "metric" ? (raw as UnitSystem) : undefined
          } catch {
            return undefined
          }
        })()
      : undefined,
  setUnitSystem: (unit) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, unit)
      }
    } catch {}
    set({ unitSystem: unit })
  },
  clearUnitSystem: () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
    set({ unitSystem: undefined })
  },
  feedAutoLoad:
    typeof window !== "undefined"
      ? (() => {
          try {
            const raw = window.localStorage.getItem(FEED_AUTOLOAD_KEY)
            return raw === "1" || raw === "true"
          } catch {
            return false
          }
        })()
      : false,
  setFeedAutoLoad: (enabled) => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(FEED_AUTOLOAD_KEY, enabled ? "1" : "0")
      }
    } catch {}
    set({ feedAutoLoad: enabled })
  },
}))
