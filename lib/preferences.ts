"use client"

import { create } from "zustand"
import type { UnitSystem } from "@/lib/i18n/formatting"

type PreferencesState = {
  // When undefined, fall back to locale-based default
  unitSystem?: UnitSystem
  setUnitSystem: (unit: UnitSystem) => void
  clearUnitSystem: () => void
}

const STORAGE_KEY = "preference_unit_system"

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
}))

