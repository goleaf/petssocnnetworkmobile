"use client"

// Lightweight haptics helper that works on web and Capacitor when available.
// Falls back to navigator.vibrate on supported devices; fails silently otherwise.

export type HapticIntensity = "light" | "medium" | "heavy"

function vibrate(ms: number): void {
  if (typeof window === "undefined") return
  // Browser haptics (best-effort)
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(ms)
    } catch {
      // ignore
    }
  }
}

export async function hapticImpact(intensity: HapticIntensity = "light"): Promise<void> {
  // Keep it simple and universally safe in the web build: use vibrate only.
  // Native apps (Capacitor) can later replace this with a platform bridge.
  if (intensity === "heavy") vibrate(20)
  else if (intensity === "medium") vibrate(12)
  else vibrate(8)
}
