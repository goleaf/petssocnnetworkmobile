"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { PrivacyCircle } from "./types"

interface PrivacyCircleState {
  lastSelectedCircle: PrivacyCircle
  setLastSelectedCircle: (circle: PrivacyCircle) => void
}

export const usePrivacyCircle = create<PrivacyCircleState>()(
  persist(
    (set) => ({
      lastSelectedCircle: "followers-only",
      setLastSelectedCircle: (circle) => set({ lastSelectedCircle: circle }),
    }),
    {
      name: "privacy-circle-storage",
    }
  )
)

