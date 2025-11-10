"use client"

import { useState, useRef, useEffect } from "react"
import { X, MapPin, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StoryOverlay } from "@/lib/types"
import type {
  PollStickerData,
  QuestionStickerData,
  CountdownStickerData,
  LocationStickerData,
  GifStickerData,
} from "./stickers/types"

interface StickerOverlayProps {
  sticker: StoryOverlay
  containerWidth: number
  containerHeight: number
  onUpdate: (updates: Partial<StoryOverlay>) => void
  onDelete: () => void
  isSelected?: boolean
  onSelect?: () => void
}

export function StickerOverlay({
  sticker,
  containerWidth,
  containerHeight,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
}: StickerOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  const x = (sticker.x || 0.5) * containerWidth
  const y = (sticker.y || 0.5) * containerHeight
  const scale = sticker.scale || 1
  const rotation = sticker.rotation || 0

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - x,
      y: e.clientY - y,
    })
    onSelect?.()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - x,
      y: touch.clientY - y,
    })
    onSelect?.()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      onUpdate({
        x: newX / containerWidth,
        y: newY / containerHeight,
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return

      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y

      onUpdate({
        x: newX / containerWidth,
        y: newY / containerHeight,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchend", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchend", handleMouseUp)
      }
    }
  }, [isDragging, dragStart, containerWidth, containerHeight, onUpdate])

  // Handle pinch-to-resize
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleWheel = (e: WheelEvent) => {
      if (!isSelected) return

      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Resize
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const newScale = Math.max(0.5, Math.min(3, scale + delta))
        onUpdate({ scale: newScale })
      } else if (e.shiftKey) {
        // Rotate
        const delta = e.deltaY > 0 ? -5 : 5
        onUpdate({ rotation: rotation + delta })
      }
    }

    element.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      element.removeEventListener("wheel", handleWheel)
    }
  }, [isSelected, scale, rotation, onUpdate])

  const renderStickerContent = () => {
    // Emoji or text sticker
    if (sticker.text && sticker.data?.stickerType === "emoji") {
      return (
        <div className="text-6xl select-none">
          {sticker.text}
        </div>
      )
    }

    // Mention sticker
    if (sticker.text && sticker.data?.stickerType === "mention") {
      return (
        <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
          {sticker.text}
        </div>
      )
    }

    // Hashtag sticker
    if (sticker.text && sticker.data?.stickerType === "hashtag") {
      return (
        <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium">
          {sticker.text}
        </div>
      )
    }

    // GIF sticker
    if (sticker.type === "gif" && sticker.data) {
      const gifData = sticker.data as GifStickerData
      return (
        <img
          src={gifData.url}
          alt={gifData.title || "GIF"}
          className="max-w-[200px] max-h-[200px] rounded-lg"
        />
      )
    }

    // Location sticker
    if (sticker.type === "location" && sticker.data) {
      const locationData = sticker.data as LocationStickerData
      return (
        <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-3 rounded-2xl flex items-center gap-2 max-w-[250px]">
          <MapPin className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-medium truncate">{locationData.name}</div>
            {locationData.address && (
              <div className="text-xs opacity-80 truncate">
                {locationData.address}
              </div>
            )}
          </div>
        </div>
      )
    }

    // Poll sticker
    if (sticker.type === "poll" && sticker.data) {
      const pollData = sticker.data as PollStickerData
      return (
        <div className="bg-white/90 backdrop-blur-sm text-black p-4 rounded-2xl min-w-[250px] max-w-[300px]">
          <div className="font-bold mb-3 text-sm">{pollData.question}</div>
          <div className="space-y-2">
            {pollData.options.map((option) => (
              <div
                key={option.id}
                className="bg-gray-200 rounded-full px-4 py-2 text-sm font-medium"
              >
                {option.text}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Question sticker
    if (sticker.type === "question" && sticker.data) {
      const questionData = sticker.data as QuestionStickerData
      return (
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-4 rounded-2xl min-w-[250px] max-w-[300px]">
          <div className="text-xs font-medium mb-2 opacity-80">
            ASK ME ANYTHING
          </div>
          <div className="font-medium">{questionData.prompt}</div>
        </div>
      )
    }

    // Countdown sticker
    if (sticker.type === "countdown" && sticker.data) {
      const countdownData = sticker.data as CountdownStickerData
      const targetDate = new Date(countdownData.targetDate)
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      return (
        <div className="bg-black/70 backdrop-blur-sm text-white p-4 rounded-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            {countdownData.label && (
              <div className="text-xs font-medium opacity-80">
                {countdownData.label}
              </div>
            )}
          </div>
          <div className="text-3xl font-bold">
            {days}d {hours}h
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div
      ref={elementRef}
      className={cn(
        "absolute cursor-move select-none",
        isSelected && "ring-2 ring-white ring-offset-2 ring-offset-black/50"
      )}
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: "center",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {renderStickerContent()}

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
