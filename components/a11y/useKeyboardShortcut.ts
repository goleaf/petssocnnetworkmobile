"use client"

import { useEffect, useRef } from "react"
import { useMotorA11y } from "@/components/a11y/motor-accessibility-provider"

type ShortcutOptions = {
  withCtrlOrMeta?: boolean
  withShift?: boolean
  withAlt?: boolean
  enabled?: boolean
}

function isModifierKey(key: string): boolean {
  const k = key.toLowerCase()
  return k === "shift" || k === "control" || k === "ctrl" || k === "meta" || k === "alt"
}

// Normalizes common aliases
function normalizeKey(key: string): string {
  const k = key.length === 1 ? key.toLowerCase() : key
  switch (k) {
    case "arrowup":
      return "arrowup"
    case "arrowdown":
      return "arrowdown"
    case "arrowleft":
      return "arrowleft"
    case "arrowright":
      return "arrowright"
    default:
      return k
  }
}

export function useKeyboardShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) {
  const { stickyKeys, slowKeys, slowKeysDelayMs } = useMotorA11y()
  const { withCtrlOrMeta = false, withShift = false, withAlt = false, enabled = true } = options

  const latchedRef = useRef({ ctrlOrMeta: false, shift: false, alt: false })
  const keydownTimesRef = useRef<Record<string, number>>({})
  const cleanupTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      const k = normalizeKey(e.key)

      // Track modifiers for sticky keys
      if (stickyKeys && isModifierKey(k)) {
        if (k === "shift") latchedRef.current.shift = true
        if (k === "alt") latchedRef.current.alt = true
        if (k === "control" || k === "ctrl" || k === "meta") latchedRef.current.ctrlOrMeta = true
        return
      }

      const hasCtrlOrMeta = e.ctrlKey || e.metaKey || latchedRef.current.ctrlOrMeta
      const hasShift = e.shiftKey || latchedRef.current.shift
      const hasAlt = e.altKey || latchedRef.current.alt

      if (withCtrlOrMeta && !hasCtrlOrMeta) return
      if (withShift && !hasShift) return
      if (withAlt && !hasAlt) return
      if (normalizeKey(key) !== normalizeKey(k)) return

      if (!slowKeys) {
        e.preventDefault()
        handler(e)
        // Clear latched after activation
        latchedRef.current = { ctrlOrMeta: false, shift: false, alt: false }
      } else {
        // Record keydown time and wait for keyup to validate dwell
        keydownTimesRef.current[k] = Date.now()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (!slowKeys) return
      const k = normalizeKey(e.key)
      const downAt = keydownTimesRef.current[k]
      if (!downAt) return

      const hasCtrlOrMeta = e.ctrlKey || e.metaKey || latchedRef.current.ctrlOrMeta
      const hasShift = e.shiftKey || latchedRef.current.shift
      const hasAlt = e.altKey || latchedRef.current.alt

      if (withCtrlOrMeta && !hasCtrlOrMeta) return
      if (withShift && !hasShift) return
      if (withAlt && !hasAlt) return
      if (normalizeKey(key) !== normalizeKey(k)) return

      const heldMs = Date.now() - downAt
      if (heldMs >= slowKeysDelayMs) {
        e.preventDefault()
        handler(e)
        latchedRef.current = { ctrlOrMeta: false, shift: false, alt: false }
      }
      delete keydownTimesRef.current[k]
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      // Best-effort cleanup
      if (cleanupTimerRef.current) window.clearTimeout(cleanupTimerRef.current)
    }
  }, [enabled, key, handler, withCtrlOrMeta, withShift, withAlt, stickyKeys, slowKeys, slowKeysDelayMs])
}

