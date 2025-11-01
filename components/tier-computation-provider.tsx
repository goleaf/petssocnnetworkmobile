"use client"

import { useTierComputation } from "@/lib/hooks/use-tier-computation"

export function TierComputationProvider({ children }: { children: React.ReactNode }) {
  useTierComputation()
  return <>{children}</>
}

