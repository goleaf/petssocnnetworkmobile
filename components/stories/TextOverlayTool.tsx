"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StoryOverlay } from "@/lib/types"

interface TextOverlayToolProps {
  overlay: StoryOverlay
  onUpdate: (updates: Partial<StoryOverlay>) => void
  onDelete: () => void
}

const FONTS = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier", value: "'Courier New', monospace" },
  { name: "Comic Sans", value: "'Comic Sans MS', cursive" },
  { name: "Impact", value: "Impact, fantasy" },
  { name: "Brush Script", value: "'Brush Script MT', cursive" },
  { name: "Palatino", value: "'Palatino Linotype', serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
]

const COLORS = [
  "#ffffff",
  "#000000",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8800",
  "#8800ff",
  "#ff0088",
  "#00ff88",
  "#88ff00",
  "#0088ff",
  "#ff8888",
  "#88ff88",
  "#8888ff",
  "#ffaa00",
  "#aa00ff",
  "#00aaff",
]

export function TextOverlayTool({
  overlay,
  onUpdate,
  onDelete,
}: TextOverlayToolProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [alignment, setAlignment] = useState<"left" | "center" | "right">(
    "center"
  )
  const textRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Touch/mouse handlers for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - (overlay.x || 0.5) * (containerRef.current?.offsetWidth || 420),
      y: e.clientY - (overlay.y || 0.5) * (containerRef.current?.offsetHeight || 747),
    })
    e.preventDefault()
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - dragStart.x) / rect.width
    const y = (e.clientY - dragStart.y) / rect.height
    onUpdate({
      x: Math.max(0.1, Math.min(0.9, x)),
      y: Math.max(0.1, Math.min(0.9, y)),
    })
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // Pinch-to-resize and rotation (simplified for desktop)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.95 : 1.05
      onUpdate({
        scale: Math.max(0.5, Math.min(3, (overlay.scale || 1) * delta)),
      })
    } else if (e.shiftKey) {
      // Rotate
      e.preventDefault()
      const delta = e.deltaY > 0 ? -5 : 5
      onUpdate({
        rotation: ((overlay.rotation || 0) + delta) % 360,
      })
    }
  }

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: PointerEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - dragStart.x) / rect.width
        const y = (e.clientY - dragStart.y) / rect.height
        onUpdate({
          x: Math.max(0.1, Math.min(0.9, x)),
          y: Math.max(0.1, Math.min(0.9, y)),
        })
      }
      const handleGlobalUp = () => setIsDragging(false)
      window.addEventListener("pointermove", handleGlobalMove)
      window.addEventListener("pointerup", handleGlobalUp)
      return () => {
        window.removeEventListener("pointermove", handleGlobalMove)
        window.removeEventListener("pointerup", handleGlobalUp)
      }
    }
  }, [isDragging, dragStart])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        ref={textRef}
        className={cn(
          "absolute cursor-move select-none",
          isDragging && "opacity-70"
        )}
        style={{
          left: `${(overlay.x || 0.5) * 100}%`,
          top: `${(overlay.y || 0.5) * 100}%`,
          transform: `translate(-50%, -50%) scale(${overlay.scale || 1}) rotate(${overlay.rotation || 0}deg)`,
          color: overlay.color || "#ffffff",
          fontSize: `${overlay.fontSize || 32}px`,
          fontFamily: overlay.fontFamily || "Arial",
          textAlign: alignment,
          textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          whiteSpace: "nowrap",
          maxWidth: "80%",
        }}
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <Input
            value={overlay.text || ""}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditing(false)
            }}
            autoFocus
            className="bg-transparent border-none text-inherit font-inherit text-center"
            style={{
              fontSize: "inherit",
              fontFamily: "inherit",
              color: "inherit",
            }}
          />
        ) : (
          <span>{overlay.text || "Tap to edit"}</span>
        )}
      </div>

      {/* Editing Controls */}
      {!isEditing && (
        <div
          className="absolute"
          style={{
            left: `${(overlay.x || 0.5) * 100}%`,
            top: `${((overlay.y || 0.5) * 100) - 15}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="flex gap-2 bg-black/70 rounded-lg p-2">
            {/* Font Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white h-8">
                  Font
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-1">
                  {FONTS.map((font) => (
                    <button
                      key={font.value}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded hover:bg-gray-100",
                        overlay.fontFamily === font.value && "bg-gray-200"
                      )}
                      style={{ fontFamily: font.value }}
                      onClick={() => onUpdate({ fontFamily: font.value })}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white h-8">
                  <div
                    className="w-4 h-4 rounded border border-white"
                    style={{ backgroundColor: overlay.color || "#ffffff" }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-10 h-10 rounded border-2",
                        overlay.color === color
                          ? "border-blue-500"
                          : "border-gray-300"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onUpdate({ color })}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Alignment */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white h-8"
              onClick={() => {
                const next =
                  alignment === "left"
                    ? "center"
                    : alignment === "center"
                      ? "right"
                      : "left"
                setAlignment(next)
              }}
            >
              {alignment === "left" && <AlignLeft className="h-4 w-4" />}
              {alignment === "center" && <AlignCenter className="h-4 w-4" />}
              {alignment === "right" && <AlignRight className="h-4 w-4" />}
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 h-8"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
