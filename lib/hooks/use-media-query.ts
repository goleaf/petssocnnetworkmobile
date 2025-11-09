"use client"

import { useEffect, useState } from "react"

/**
 * useMediaQuery
 * React hook to subscribe to a window matchMedia query.
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (): boolean => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return false
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(getMatches)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return
    const media = window.matchMedia(query)

    const onChange = () => setMatches(media.matches)
    onChange()

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [query])

  return matches
}

/**
 * Convenience hook for Tailwind's default `md` breakpoint (min-width: 768px).
 */
export function useIsMdUp(): boolean {
  return useMediaQuery("(min-width: 768px)")
}

