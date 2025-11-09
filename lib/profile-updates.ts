"use client"

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { updateUser } from '@/lib/storage'

const CHANNEL = 'pet-social-profile-updates'

export type ProfileUpdateEvent =
  | {
      type: 'profilePhotoUpdated'
      userId: string
      largeUrl: string
      allSizes: { original: string; large: string; medium: string; small: string; thumbnail: string }
      ts: number
    }
  | {
      type: 'coverPhotoUpdated'
      userId: string
      largeUrl: string
      allSizes: { original: string; large: string; medium: string; small: string }
      ts: number
    }

export function emitLocalProfilePhotoUpdated(evt: ProfileUpdateEvent) {
  if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') return
  const bc = new window.BroadcastChannel(CHANNEL)
  try { bc.postMessage(evt) } finally { bc.close() }
}

export const emitLocalCoverPhotoUpdated = emitLocalProfilePhotoUpdated

export function useProfileUpdates(onEvent: (evt: ProfileUpdateEvent) => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // BroadcastChannel (same-origin tabs)
    let bc: BroadcastChannel | null = null
    if (typeof window.BroadcastChannel !== 'undefined') {
      bc = new window.BroadcastChannel(CHANNEL)
      bc.onmessage = (e) => {
        const data = e.data as ProfileUpdateEvent
        if (data?.type === 'profilePhotoUpdated') onEvent(data)
      }
    }

    // Server-Sent Events (server -> clients)
    let ev: EventSource | null = null
    if (typeof window !== 'undefined' && typeof (window as any).EventSource !== 'undefined') {
      ev = new (window as any).EventSource('/api/events')
      ev.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse((e as any).data) as ProfileUpdateEvent
          if (data?.type === 'profilePhotoUpdated') onEvent(data)
        } catch {}
      }
    }

    return () => {
      try { ev?.close() } catch {}
      if (bc) {
        try { bc.close() } catch {}
      }
    }
  }, [onEvent])
}

// Convenience reaction that patches auth user and local storage
export function useApplyProfilePhotoUpdates() {
  const auth = useAuth()
  useProfileUpdates((evt) => {
    // Patch auth store if it's the current user
    if (evt.type === 'profilePhotoUpdated') {
      if (auth.user?.id === evt.userId) {
        useAuth.setState((state) => ({ user: state.user ? { ...state.user, avatar: evt.largeUrl } : state.user }))
      }
      updateUser(evt.userId, { avatar: evt.largeUrl } as any)
    } else if (evt.type === 'coverPhotoUpdated') {
      if (auth.user?.id === evt.userId) {
        useAuth.setState((state) => ({ user: state.user ? { ...state.user, coverPhoto: evt.largeUrl } : state.user }))
      }
      updateUser(evt.userId, { coverPhoto: evt.largeUrl } as any)
    }
  })
}
