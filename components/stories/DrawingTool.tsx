"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Pen, Minus, Highlighter, Sparkles, Eraser } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StoryOverlay } from "@/lib/types"

interface DrawingToolProps {
  width: number
  height: number
  onDrawingComplete: (overlay: StoryOverlay) => void
}

type DrawingToolType = "pen" | "marker" | "highlighter" | "neon" | "eraser"

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

interface Point {
  x: number
  y: number
}

export function DrawingTool({
  width,
  height,
  onDrawingComplete,
}: DrawingToolProps) {
  const [tool, setTool] = useState<DrawingToolType>("pen")
  const [color, setColor] = useState("#ffffff")
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  const [paths, setPaths] = useState<
    Array<{
      points: Point[]
      color: string
      size: number
      tool: DrawingToolType
    }>
  >([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctxRef.current = ctx
    redrawCanvas()
  }, [width, height])

  useEffect(() => {
    redrawCanvas()
  }, [paths])

  const redrawCanvas = () => {
    const ctx = ctxRef.current
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    paths.forEach((path) => {
      if (path.points.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = path.color
      ctx.lineWidth = path.size
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      // Apply tool-specific effects
      switch (path.tool) {
        case "marker":
          ctx.globalAlpha = 0.7
          break
        case "highlighter":
          ctx.globalAlpha = 0.4
          ctx.lineWidth = path.size * 2
          break
        case "neon":
          ctx.shadowBlur = 10
          ctx.shadowColor = path.color
          ctx.globalAlpha = 0.9
          break
        case "eraser":
          ctx.globalCompositeOperation = "destination-out"
          break
        default:
          ctx.globalAlpha = 1
          ctx.shadowBlur = 0
          ctx.globalCompositeOperation = "source-over"
      }

      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y)
      }
      ctx.stroke()

      // Reset context
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      ctx.globalCompositeOperation = "source-over"
    })
  }

  const getPointerPosition = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDrawing(true)
    const point = getPointerPosition(e)
    setCurrentPath([point])
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return

    const point = getPointerPosition(e)
    const newPath = [...currentPath, point]
    setCurrentPath(newPath)

    // Draw current stroke
    const ctx = ctxRef.current
    if (!ctx || currentPath.length === 0) return

    ctx.beginPath()
    ctx.strokeStyle = tool === "eraser" ? "#000000" : color
    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Apply tool-specific effects
    switch (tool) {
      case "marker":
        ctx.globalAlpha = 0.7
        break
      case "highlighter":
        ctx.globalAlpha = 0.4
        ctx.lineWidth = brushSize * 2
        break
      case "neon":
        ctx.shadowBlur = 10
        ctx.shadowColor = color
        ctx.globalAlpha = 0.9
        break
      case "eraser":
        ctx.globalCompositeOperation = "destination-out"
        break
      default:
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
        ctx.globalCompositeOperation = "source-over"
    }

    const lastPoint = currentPath[currentPath.length - 1]
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    // Reset context
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = "source-over"
  }

  const handlePointerUp = () => {
    if (isDrawing && currentPath.length > 1) {
      setPaths([
        ...paths,
        {
          points: currentPath,
          color: tool === "eraser" ? "#000000" : color,
          size: brushSize,
          tool,
        },
      ])
    }
    setIsDrawing(false)
    setCurrentPath([])
  }

  const handleComplete = () => {
    // Convert canvas to SVG path
    const pathData = paths
      .map((path) => {
        if (path.points.length < 2) return ""
        const d = path.points
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
          .join(" ")
        return d
      })
      .join(" ")

    const overlay: StoryOverlay = {
      id: `drawing-${Date.now()}`,
      type: "drawing",
      color,
      data: {
        path: pathData,
        strokeWidth: brushSize,
        opacity: tool === "marker" ? 0.7 : tool === "highlighter" ? 0.4 : 1,
      },
    }

    onDrawingComplete(overlay)
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Drawing Controls */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <div className="bg-black/70 rounded-lg p-2 flex gap-2">
          {/* Tool Selector */}
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-white", tool === "pen" && "bg-white/20")}
            onClick={() => setTool("pen")}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-white", tool === "marker" && "bg-white/20")}
            onClick={() => setTool("marker")}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-white", tool === "highlighter" && "bg-white/20")}
            onClick={() => setTool("highlighter")}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-white", tool === "neon" && "bg-white/20")}
            onClick={() => setTool("neon")}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-white", tool === "eraser" && "bg-white/20")}
            onClick={() => setTool("eraser")}
          >
            <Eraser className="h-4 w-4" />
          </Button>

          {/* Color Picker */}
          {tool !== "eraser" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: color }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className={cn(
                        "w-10 h-10 rounded-full border-2",
                        color === c ? "border-blue-500" : "border-gray-300"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Brush Size Slider */}
      <div className="absolute bottom-24 left-0 right-0 px-8">
        <div className="bg-black/70 rounded-lg p-4">
          <div className="text-white text-sm mb-2">Brush Size: {brushSize}px</div>
          <Slider
            value={[brushSize]}
            onValueChange={([value]) => setBrushSize(value)}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Done Button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <Button
          onClick={handleComplete}
          className="bg-white text-black hover:bg-gray-200"
        >
          Done Drawing
        </Button>
      </div>
    </div>
  )
}
