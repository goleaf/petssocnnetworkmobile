"use client"

import { useEffect } from "react"

/**
 * Subscribe to browser storage events for the provided keys and invoke the handler whenever a change occurs.
 * Useful for keeping multiple tabs or windows in sync with privacy-sensitive data.
 */
export function useStorageListener(keys: string[], handler: () => void) {
  const keySignature = keys.join("|")

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || keys.includes(event.key)) {
        handler()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [handler, keySignature])
}
