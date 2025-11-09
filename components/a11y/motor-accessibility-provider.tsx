"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

export type MotorA11ySettings = {
  stickyKeys: boolean
  slowKeys: boolean
  slowKeysDelayMs: number
  clickDelayMs: number
  largeTouchTargets: boolean
}

type MotorA11yContextValue = MotorA11ySettings & {
  setStickyKeys: (v: boolean) => void
  setSlowKeys: (v: boolean) => void
  setSlowKeysDelayMs: (ms: number) => void
  setClickDelayMs: (ms: number) => void
  setLargeTouchTargets: (v: boolean) => void
}

const DEFAULTS: MotorA11ySettings = {
  stickyKeys: false,
  slowKeys: false,
  slowKeysDelayMs: 300,
  clickDelayMs: 0,
  largeTouchTargets: false,
}

const STORAGE_KEY = "motorA11ySettings"

const MotorA11yContext = createContext<MotorA11yContextValue | undefined>(undefined)

export function MotorAccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MotorA11ySettings>(DEFAULTS)
  const lastClickRef = useRef<number>(0)

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MotorA11ySettings>
        setSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  // Apply/unapply large touch targets via body class
  useEffect(() => {
    if (typeof document === "undefined") return
    const cls = "a11y-large-targets"
    if (settings.largeTouchTargets) {
      document.body.classList.add(cls)
    } else {
      document.body.classList.remove(cls)
    }
  }, [settings.largeTouchTargets])

  // Global click guard to enforce click delay between activations
  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (e: MouseEvent) => {
      const delay = settings.clickDelayMs
      if (!delay || delay <= 0) return
      const now = Date.now()
      const since = now - (lastClickRef.current || 0)
      if (since < delay) {
        // Block accidental rapid clicks
        e.stopImmediatePropagation()
        e.preventDefault()
        return
      }
      lastClickRef.current = now
    }
    // Use capture to intercept before React handlers
    window.addEventListener("click", handler, { capture: true })
    return () => window.removeEventListener("click", handler, { capture: true } as any)
  }, [settings.clickDelayMs])

  const setStickyKeys = useCallback((v: boolean) => setSettings((s) => ({ ...s, stickyKeys: v })), [])
  const setSlowKeys = useCallback((v: boolean) => setSettings((s) => ({ ...s, slowKeys: v })), [])
  const setSlowKeysDelayMs = useCallback((ms: number) => setSettings((s) => ({ ...s, slowKeysDelayMs: Math.max(0, Math.min(2000, Math.round(ms))) })), [])
  const setClickDelayMs = useCallback((ms: number) => setSettings((s) => ({ ...s, clickDelayMs: Math.max(0, Math.min(2000, Math.round(ms))) })), [])
  const setLargeTouchTargets = useCallback((v: boolean) => setSettings((s) => ({ ...s, largeTouchTargets: v })), [])

  const value = useMemo<MotorA11yContextValue>(
    () => ({
      ...settings,
      setStickyKeys,
      setSlowKeys,
      setSlowKeysDelayMs,
      setClickDelayMs,
      setLargeTouchTargets,
    }),
    [settings, setStickyKeys, setSlowKeys, setSlowKeysDelayMs, setClickDelayMs, setLargeTouchTargets]
  )

  return <MotorA11yContext.Provider value={value}>{children}</MotorA11yContext.Provider>
}

export function useMotorA11y() {
  const ctx = useContext(MotorA11yContext)
  if (!ctx) throw new Error("useMotorA11y must be used within MotorAccessibilityProvider")
  return ctx
}

