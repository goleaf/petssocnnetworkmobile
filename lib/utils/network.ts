/** Utilities for network/environment detection (best-effort, client-only). */

export type ConnectionInfo = {
  type?: string | null
  effectiveType?: string | null
}

/**
 * Attempts to detect if the device is on Wi‑Fi.
 * Returns true if Wi‑Fi is detected, false if clearly cellular/slow, or null if unknown.
 */
export function isOnWifi(): boolean | null {
  if (typeof window === "undefined") return null
  const nav = (navigator as any)
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection
  if (!conn) return null

  try {
    const type: string | undefined = conn.type
    const effectiveType: string | undefined = conn.effectiveType

    // If the browser exposes a concrete type
    if (type) {
      if (type.toLowerCase() === "wifi") return true
      if (["cellular", "wimax"].includes(type.toLowerCase())) return false
    }

    // Fallback: treat fast effectiveType as likely Wi‑Fi
    if (effectiveType) {
      // effectiveType values commonly: 'slow-2g', '2g', '3g', '4g'
      if (effectiveType === "4g") return true
      return false
    }
  } catch {
    // ignore
  }

  return null
}

export function getConnectionInfo(): ConnectionInfo | null {
  if (typeof window === "undefined") return null
  const nav = (navigator as any)
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection
  if (!conn) return null
  return { type: conn.type ?? null, effectiveType: conn.effectiveType ?? null }
}

/**
 * Best-effort detection for cellular connection.
 * Returns true for explicit cellular types or slow effectiveType; false for Wi‑Fi; null if unknown.
 */
export function isLikelyCellular(): boolean | null {
  if (typeof window === "undefined") return null
  const nav = (navigator as any)
  const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection
  if (!conn) return null
  try {
    const type: string | undefined = conn.type
    const effectiveType: string | undefined = conn.effectiveType
    if (type) {
      if (type.toLowerCase() === "wifi") return false
      if (type.toLowerCase() === "cellular") return true
    }
    if (effectiveType) {
      if (["slow-2g", "2g", "3g"].includes(effectiveType)) return true
      if (effectiveType === "4g") return null // ambiguous without explicit type
    }
  } catch {
    // ignore
  }
  return null
}
