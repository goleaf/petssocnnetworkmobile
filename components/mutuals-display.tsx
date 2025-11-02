"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getMutualConnections, getMutualConnectionsCount } from "@/lib/utils/mutuals"
import type { User } from "@/lib/types"
import { useStorageListener } from "@/lib/hooks/use-storage-listener"

interface MutualsDisplayProps {
  currentUserId: string
  targetUser: User
  maxDisplay?: number
  className?: string
}

export function MutualsDisplay({
  currentUserId,
  targetUser,
  maxDisplay = 2,
  className = "",
}: MutualsDisplayProps) {
  const [mutuals, setMutuals] = useState<User[]>([])
  const [totalMutualsCount, setTotalMutualsCount] = useState(0)

  const loadMutuals = () => {
    const mutualConnections = getMutualConnections(currentUserId, targetUser.id, maxDisplay)
    const count = getMutualConnectionsCount(currentUserId, targetUser.id)
    setMutuals(mutualConnections)
    setTotalMutualsCount(count)
  }

  useEffect(() => {
    loadMutuals()
  }, [currentUserId, targetUser.id, maxDisplay])

  useStorageListener(["pet_social_users"], loadMutuals)

  if (mutuals.length === 0) {
    return null
  }

  const displayMutuals = mutuals.slice(0, maxDisplay)
  const remainingCount = totalMutualsCount > maxDisplay ? totalMutualsCount - maxDisplay : 0

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <span>Followed by </span>
      {displayMutuals.map((mutual, index) => (
        <span key={mutual.id}>
          <Link
            href={`/user/${mutual.username}`}
            className="hover:underline text-primary font-medium"
          >
            {mutual.fullName}
          </Link>
          {index < displayMutuals.length - 1 && (
            <span>{displayMutuals.length === 2 ? " & " : ", "}</span>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-muted-foreground">
          {" "}and {remainingCount} {remainingCount === 1 ? "other" : "others"}
        </span>
      )}
    </div>
  )
}

