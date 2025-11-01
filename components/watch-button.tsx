"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { useAuth } from "@/lib/auth"

interface WatchButtonProps {
  targetId: string
  targetType: "post" | "wiki"
  initialWatching?: boolean
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost" | "secondary"
}

export function WatchButton({
  targetId,
  targetType,
  initialWatching = false,
  className,
  size = "sm",
  variant = "outline",
}: WatchButtonProps) {
  const { user } = useAuth()
  const [watching, setWatching] = useState(initialWatching)
  const [isLoading, setIsLoading] = useState(false)

  if (!user) {
    return null
  }

  const handleToggleWatch = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/watch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          targetId,
          targetType,
          watchEvents: ["update", "comment", "reaction"],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle watch")
      }

      const data = await response.json()
      setWatching(data.watching)
    } catch (error) {
      console.error("Error toggling watch:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleToggleWatch}
      variant={watching ? "default" : variant}
      size={size}
      disabled={isLoading}
      className={className}
    >
      {watching ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
      {watching ? "Watching" : "Watch"}
    </Button>
  )
}

