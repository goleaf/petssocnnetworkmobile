"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { ensureSkipTarget, fetchAltFromAPI, heuristicAltFromSrc } from "@/lib/a11y"

type ScreenReaderContextValue = {
  enabled: boolean
  toggle: () => void
  setEnabled: (value: boolean) => void
}

const ScreenReaderContext = createContext<ScreenReaderContextValue | undefined>(undefined)

const STORAGE_KEY = "screenReaderMode"

export function ScreenReaderProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(false)
  const liveRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setEnabled(stored === "true")
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch {}
    document.body.dataset.srMode = enabled ? "true" : "false"
    // Announce change politely
    if (liveRef.current) {
      liveRef.current.textContent = enabled ? "Screen reader mode enabled" : "Screen reader mode disabled"
      // Clear after announcement
      const id = setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = ""
      }, 1500)
      return () => clearTimeout(id)
    }
  }, [enabled])

  const applyAltIfMissing = useCallback(async (img: HTMLImageElement) => {
    if (!(img instanceof HTMLImageElement)) return
    if (img.hasAttribute("alt")) return
    const src = img.currentSrc || img.src
    if (!src) return
    // try API, fallback to heuristic
    const apiAlt = await fetchAltFromAPI(src)
    const alt = apiAlt ?? heuristicAltFromSrc(src)
    if (alt === "") {
      img.setAttribute("alt", "")
      img.setAttribute("aria-hidden", "true")
      img.setAttribute("role", "presentation")
    } else {
      img.setAttribute("alt", alt)
      img.setAttribute("aria-label", alt)
      img.setAttribute("role", "img")
    }
  }, [])

  const scanImages = useCallback(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img:not([alt])"))
    imgs.forEach((img) => {
      applyAltIfMissing(img)
    })
  }, [applyAltIfMissing])

  const setupObserver = useCallback(() => {
    if (observerRef.current) return
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) {
            applyAltIfMissing(n)
          } else if (n instanceof HTMLElement) {
            n.querySelectorAll("img").forEach((img) => applyAltIfMissing(img as HTMLImageElement))
          }
        })
      }
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
    observerRef.current = observer
  }, [applyAltIfMissing])

  useEffect(() => {
    if (!enabled) {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      return
    }
    // Ensure skip targets
    ensureSkipTarget(document.getElementById("main-content"))
    ensureSkipTarget(document.getElementById("primary-navigation"))
    // Apply alt text and observe future nodes
    scanImages()
    setupObserver()
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [enabled, scanImages, setupObserver])

  const toggle = useCallback(() => setEnabled((v) => !v), [])

  const value = useMemo<ScreenReaderContextValue>(() => ({ enabled, toggle, setEnabled }), [enabled, toggle])

  return (
    <ScreenReaderContext.Provider value={value}>
      {/* ARIA live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" ref={liveRef} />
      {children}
    </ScreenReaderContext.Provider>
  )
}

export function useScreenReaderMode() {
  const ctx = useContext(ScreenReaderContext)
  if (!ctx) throw new Error("useScreenReaderMode must be used within ScreenReaderProvider")
  return ctx
}

