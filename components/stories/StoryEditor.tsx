"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Type,
  Pencil,
  Sparkles,
  Eraser,
  Undo2,
  Redo2,
  X,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sticker,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StoryOverlay } from "@/lib/types"
import { TextOverlayTool } from "@/components/stories/TextOverlayTool"
import { DrawingTool } from "@/components/stories/DrawingTool"
import { FilterCarousel } from "@/components/stories/FilterCarousel"
import { StickerPanel } from "@/components/stories/StickerPanel"
import { StickerOverlay } from "@/components/stories/StickerOverlay"

interface StoryEditorProps {
  mediaUrl: string
  mediaType: "image" | "video"
  onSave: (overlays: StoryOverlay[], filter?: string, filterIntensity?: number) => void
  onCancel: () => void
}

type EditorMode = "none" | "text" | "drawing" | "filter" | "sticker"

export function StoryEditor({
  mediaUrl,
  mediaType,
  onSave,
  onCancel,
}: StoryEditorProps) {
  const [mode, setMode] = useState<EditorMode>("none")
  const [overlays, setOverlays] = useState<StoryOverlay[]>([])
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>()
  const [filterIntensity, setFilterIntensity] = useState(100)
  const [history, setHistory] = useState<StoryOverlay[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const addToHistory = (newOverlays: StoryOverlay[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newOverlays])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1)
      setOverlays([...history[historyIndex - 1]])
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1)
      setOverlays([...history[historyIndex + 1]])
    }
  }

  const handleAddOverlay = (overlay: StoryOverlay) => {
    const newOverlays = [...overlays, overlay]
    setOverlays(newOverlays)
    addToHistory(newOverlays)
  }

  const handleUpdateOverlay = (id: string, updates: Partial<StoryOverlay>) => {
    const newOverlays = overlays.map((o) =>
      o.id === id ? { ...o, ...updates } : o
    )
    setOverlays(newOverlays)
    addToHistory(newOverlays)
  }

  const handleDeleteOverlay = (id: string) => {
    const newOverlays = overlays.filter((o) => o.id !== id)
    setOverlays(newOverlays)
    addToHistory(newOverlays)
  }

  const handleSave = () => {
    onSave(overlays, selectedFilter, filterIntensity)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={onCancel}
        >
          <X className="h-6 w-6" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo2 className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={handleSave}
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="w-full max-w-[420px] aspect-[9/16] relative">
          {/* Media with filter */}
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              className={cn(
                "w-full h-full object-cover",
                selectedFilter && `filter-${selectedFilter}`
              )}
              style={{
                filter: selectedFilter
                  ? `opacity(${filterIntensity / 100})`
                  : undefined,
              }}
              muted
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Story"
              className={cn(
                "w-full h-full object-cover",
                selectedFilter && `filter-${selectedFilter}`
              )}
              style={{
                filter: selectedFilter
                  ? `opacity(${filterIntensity / 100})`
                  : undefined,
              }}
            />
          )}

          {/* Drawing Canvas */}
          {mode === "drawing" && (
            <DrawingTool
              width={420}
              height={747}
              onDrawingComplete={(drawingOverlay: StoryOverlay) => {
                handleAddOverlay(drawingOverlay)
                setMode("none")
              }}
            />
          )}

          {/* Text Overlays */}
          {overlays
            .filter((o) => o.type === "text")
            .map((overlay) => (
              <TextOverlayTool
                key={overlay.id}
                overlay={overlay}
                onUpdate={(updates: Partial<StoryOverlay>) => handleUpdateOverlay(overlay.id, updates)}
                onDelete={() => handleDeleteOverlay(overlay.id)}
              />
            ))}

          {/* Drawing Overlays */}
          {overlays
            .filter((o) => o.type === "drawing")
            .map((overlay) => (
              <div
                key={overlay.id}
                className="absolute inset-0 pointer-events-none"
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 420 747"
                  preserveAspectRatio="none"
                >
                  <path
                    d={overlay.data?.path || ""}
                    stroke={overlay.color || "#fff"}
                    strokeWidth={overlay.data?.strokeWidth || 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    opacity={overlay.data?.opacity || 1}
                  />
                </svg>
              </div>
            ))}

          {/* Sticker Overlays */}
          {overlays
            .filter((o) => 
              o.type === "sticker" || 
              o.type === "gif" || 
              o.type === "location" || 
              o.type === "poll" || 
              o.type === "question" || 
              o.type === "countdown"
            )
            .map((overlay) => (
              <StickerOverlay
                key={overlay.id}
                sticker={overlay}
                containerWidth={420}
                containerHeight={747}
                onUpdate={(updates) => handleUpdateOverlay(overlay.id, updates)}
                onDelete={() => handleDeleteOverlay(overlay.id)}
                isSelected={selectedOverlayId === overlay.id}
                onSelect={() => setSelectedOverlayId(overlay.id)}
              />
            ))}
        </div>
      </div>

      {/* Filter Carousel */}
      {mode === "filter" && (
        <div className="absolute bottom-32 left-0 right-0">
          <FilterCarousel
            selectedFilter={selectedFilter}
            onFilterSelect={setSelectedFilter}
          />
          {selectedFilter && (
            <div className="px-8 mt-4">
              <Slider
                value={[filterIntensity]}
                onValueChange={([value]) => setFilterIntensity(value)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="text-white text-center text-sm mt-2">
                Intensity: {filterIntensity}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticker Panel */}
      {mode === "sticker" && (
        <StickerPanel
          onAddSticker={(sticker) => {
            handleAddOverlay(sticker)
            setMode("none")
          }}
          onClose={() => setMode("none")}
        />
      )}

      {/* Bottom Toolbar */}
      <div className="p-4 flex items-center justify-around">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-white flex flex-col gap-1",
            mode === "text" && "bg-white/20"
          )}
          onClick={() => {
            if (mode === "text") {
              setMode("none")
            } else {
              setMode("text")
              // Add a new text overlay
              handleAddOverlay({
                id: `text-${Date.now()}`,
                type: "text",
                text: "Tap to edit",
                x: 0.5,
                y: 0.5,
                color: "#ffffff",
                fontSize: 32,
                fontFamily: "Arial",
                scale: 1,
                rotation: 0,
              })
            }
          }}
        >
          <Type className="h-6 w-6" />
          <span className="text-xs">Text</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-white flex flex-col gap-1",
            mode === "drawing" && "bg-white/20"
          )}
          onClick={() => setMode(mode === "drawing" ? "none" : "drawing")}
        >
          <Pencil className="h-6 w-6" />
          <span className="text-xs">Draw</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-white flex flex-col gap-1",
            mode === "sticker" && "bg-white/20"
          )}
          onClick={() => setMode(mode === "sticker" ? "none" : "sticker")}
        >
          <Sticker className="h-6 w-6" />
          <span className="text-xs">Sticker</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-white flex flex-col gap-1",
            mode === "filter" && "bg-white/20"
          )}
          onClick={() => setMode(mode === "filter" ? "none" : "filter")}
        >
          <Sparkles className="h-6 w-6" />
          <span className="text-xs">Filter</span>
        </Button>
      </div>
    </div>
  )
}
