"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CountdownStickerData } from "./stickers/types"

interface InteractiveCountdownStickerProps {
  storyId: string
  userId: string
  countdownData: CountdownStickerData
  onSubscribe: () => void
  position: { x: number; y: number }
  scale?: number
}

export function InteractiveCountdownSticker({
  storyId,
  userId,
  countdownData,
  onSubscribe,
  position,
  scale = 1,
}: InteractiveCountdownStickerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const target = new Date(countdownData.targetDate)
      const now = new Date()
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [countdownData.targetDate])

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed)
    if (!isSubscribed) {
      onSubscribe()
    }
  }

  if (!timeRemaining) return null

  return (
    <div
      className="absolute bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-4 shadow-lg min-w-[240px]"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      {countdownData.label && (
        <div className="text-xs font-semibold mb-2 opacity-90">
          {countdownData.label}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <div className="text-2xl font-bold">{timeRemaining.days}</div>
          <div className="text-xs opacity-80">Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeRemaining.hours}</div>
          <div className="text-xs opacity-80">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeRemaining.minutes}</div>
          <div className="text-xs opacity-80">Mins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeRemaining.seconds}</div>
          <div className="text-xs opacity-80">Secs</div>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className={cn(
          "w-full",
          isSubscribed && "bg-white/20 hover:bg-white/30"
        )}
        onClick={handleSubscribe}
      >
        {isSubscribed ? (
          <>
            <BellOff className="h-4 w-4 mr-2" />
            Subscribed
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 mr-2" />
            Remind me
          </>
        )}
      </Button>
    </div>
  )
}
