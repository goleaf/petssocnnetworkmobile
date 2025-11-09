"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { getMediaSettings } from "@/lib/media-settings"
import { isLikelyCellular } from "@/lib/utils/network"
import type { MediaSettings } from "@/lib/types"

export function useMediaPolicy() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<MediaSettings | null>(null)
  const [overrideOnce, setOverrideOnce] = useState(false)

  useEffect(() => {
    if (user) setSettings(getMediaSettings(user.id))
  }, [user])

  const cellularLikely = isLikelyCellular() === true
  const reducedQuality = Boolean(settings && cellularLikely && settings.cellularDataUsage === "reduced")
  const minimalBlocked = Boolean(settings && cellularLikely && settings.cellularDataUsage === "minimal" && !overrideOnce)

  return useMemo(
    () => ({
      settings,
      cellularLikely,
      reducedQuality,
      minimalBlocked,
      allowOnce: () => setOverrideOnce(true),
    }),
    [settings, cellularLikely, reducedQuality, minimalBlocked],
  )
}

