"use client"

import React, { useState, useCallback, useEffect, useRef } from "react"
import Cropper, { Area, Point } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, RotateCw, RotateCcw, Check, X as XIcon, Sun, Contrast as ContrastIcon, Image as ImageIcon } from "lucide-react"
import { getCroppedImg } from "@/lib/utils/image-crop"

interface AvatarEditorProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImage: string) => void
  minWidth?: number
  minHeight?: number
}

const ASPECT_RATIO = 1 // Square for avatar
const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function AvatarEditor({
  imageSrc,
  isOpen,
  onClose,
  onSave,
  minWidth = 200,
  minHeight = 200,
}: AvatarEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [brightness, setBrightness] = useState(1) // 1 = 100%
  const [contrast, setContrast] = useState(1) // 1 = 100%
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("")
  const [preset, setPreset] = useState<'none' | 'bw' | 'vintage' | 'warm' | 'cool'>('none')
  const cropContainerRef = useRef<HTMLDivElement | null>(null)
  const instructionsId = "avatar-editor-instructions"

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        { brightness, contrast, preset: preset === 'none' ? undefined : preset }
      )

      // Validate cropped image dimensions
      const img = new window.Image()
      img.onload = () => {
        if (img.width < minWidth || img.height < minHeight) {
          alert(
            `Cropped image is too small. Minimum required: ${minWidth}x${minHeight}px. Current: ${img.width}x${img.height}px`
          )
          setIsProcessing(false)
          return
        }
        onSave(croppedImage)
        handleClose()
      }
      img.onerror = () => {
        alert("Failed to process image. Please try again.")
        setIsProcessing(false)
      }
      img.src = croppedImage
    } catch (error) {
      console.error("Error cropping image:", error)
      alert("Failed to crop image. Please try again.")
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setIsProcessing(false)
    setBrightness(1)
    setContrast(1)
    setPreviewDataUrl("")
    onClose()
  }

  // Generate live preview when crop or adjustments change
  useEffect(() => {
    let cancelled = false
    const generate = async () => {
      if (!imageSrc || !croppedAreaPixels) return
      try {
        const dataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, { brightness, contrast, preset: preset === 'none' ? undefined : preset })
        if (!cancelled) setPreviewDataUrl(dataUrl)
      } catch {
        /* ignore preview errors */
      }
    }
    generate()
    return () => {
      cancelled = true
    }
  }, [imageSrc, croppedAreaPixels, rotation, brightness, contrast])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crop Container */}
          <div
            ref={cropContainerRef}
            className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Avatar cropping area"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown + - [ ] Enter"
            aria-describedby={instructionsId}
            onKeyDown={(e) => {
              const NUDGE = e.shiftKey ? 10 : 5
              if (e.key === 'ArrowLeft') { e.preventDefault(); setCrop((c) => ({ x: c.x - NUDGE, y: c.y })) }
              else if (e.key === 'ArrowRight') { e.preventDefault(); setCrop((c) => ({ x: c.x + NUDGE, y: c.y })) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setCrop((c) => ({ x: c.x, y: c.y - NUDGE })) }
              else if (e.key === 'ArrowDown') { e.preventDefault(); setCrop((c) => ({ x: c.x, y: c.y + NUDGE })) }
              else if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom((z) => Math.min(MAX_ZOOM, z + 0.1)) }
              else if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom((z) => Math.max(MIN_ZOOM, z - 0.1)) }
              else if (e.key === '[') { e.preventDefault(); setRotation((r) => r - 90) }
              else if (e.key === ']') { e.preventDefault(); setRotation((r) => r + 90) }
              else if (e.key === 'Enter') { e.preventDefault(); handleSave() }
              // Escape is handled by Dialog
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={ASPECT_RATIO}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
              style={{
                containerStyle: {
                  width: "100%",
                  height: "100%",
                  position: "relative",
                },
                mediaStyle: {
                  filter: (() => {
                    const filters = [`brightness(${brightness})`, `contrast(${contrast})`]
                    if (preset === 'bw') filters.push('grayscale(1)')
                    else if (preset === 'vintage') filters.push('sepia(0.35)', 'saturate(1.1)')
                    else if (preset === 'warm') filters.push('sepia(0.15)', 'saturate(1.05)')
                    else if (preset === 'cool') filters.push('hue-rotate(180deg)', 'saturate(1.05)')
                    return filters.join(' ')
                  })(),
                },
              }}
            />
          </div>
          <p id={instructionsId} className="text-xs text-muted-foreground">
            Keyboard: Arrow keys to nudge image, Shift+Arrow for larger steps, [+]/[-] to zoom, [ [ ] ] to rotate, Enter to apply, Escape to cancel.
          </p>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" /> Zoom
                </label>
                <span className="text-sm text-muted-foreground" aria-live="polite">{Math.round(zoom * 100)}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                onValueChange={(value) => setZoom(value[0])}
                className="w-full"
                aria-label="Zoom"
              />
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => prev - 90)}
                className="flex-1"
                aria-label="Rotate left"
              >
                <RotateCcw className="h-4 w-4 mr-2" /> Rotate Left
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRotation((prev) => prev + 90)}
                className="flex-1"
                aria-label="Rotate right"
              >
                <RotateCw className="h-4 w-4 mr-2" /> Rotate Right
              </Button>
            </div>

            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" /> Brightness
                </label>
                <span className="text-sm text-muted-foreground">{Math.round(brightness * 100)}%</span>
              </div>
              <Slider
                value={[brightness]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={(v) => setBrightness(v[0])}
                className="w-full"
                aria-label="Brightness"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ContrastIcon className="h-4 w-4" /> Contrast
                </label>
                <span className="text-sm text-muted-foreground">{Math.round(contrast * 100)}%</span>
              </div>
              <Slider
                value={[contrast]}
                min={0.5}
                max={1.5}
                step={0.05}
                onValueChange={(v) => setContrast(v[0])}
                className="w-full"
                aria-label="Contrast"
              />
            </div>

            {/* Preset Filters */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Presets
              </div>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'none', label: 'Original' },
                  { key: 'bw', label: 'B&W' },
                  { key: 'vintage', label: 'Vintage' },
                  { key: 'warm', label: 'Warm' },
                  { key: 'cool', label: 'Cool' },
                ] as const).map((p) => (
                  <Button
                    key={p.key}
                    type="button"
                    size="sm"
                    variant={preset === p.key ? 'default' : 'outline'}
                    onClick={() => setPreset(p.key)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Info */}
            <p className="text-xs text-muted-foreground text-center">
              Minimum size: {minWidth}x{minHeight}px
            </p>
          </div>

          {/* Previews */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Preview</div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="h-[200px] w-[200px] rounded-full overflow-hidden bg-muted border">
                  {previewDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewDataUrl} alt="Large preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">200 x 200</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-[100px] w-[100px] rounded-full overflow-hidden bg-muted border">
                  {previewDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewDataUrl} alt="Medium preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">100 x 100</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-[50px] w-[50px] rounded-full overflow-hidden bg-muted border">
                  {previewDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewDataUrl} alt="Small preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">50 x 50</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            aria-label="Cancel editing"
          >
            <XIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !croppedAreaPixels}
            aria-label="Apply cropped avatar"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
