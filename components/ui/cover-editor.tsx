"use client"

import React, { useState, useCallback } from "react"
import Cropper, { Area, Point } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, Check, X as XIcon } from "lucide-react"
import { getCroppedImg } from "@/lib/utils/image-crop"

interface CoverEditorProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImage: string) => void
  minWidth?: number
  minHeight?: number
}

const ASPECT_RATIO = 3 / 1
const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function CoverEditor({
  imageSrc,
  isOpen,
  onClose,
  onSave,
  minWidth = 1200,
  minHeight = 400,
}: CoverEditorProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0)

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
    setCroppedAreaPixels(null)
    setIsProcessing(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cover Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative w-full h-[360px] bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT_RATIO}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={false}
              style={{
                containerStyle: { width: "100%", height: "100%", position: "relative" },
              }}
              restrictPosition={false}
            />
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" /> Zoom
              </label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.1}
              onValueChange={(v) => setZoom(v[0])}
            />
            <p className="text-xs text-muted-foreground text-center">Aspect ratio locked to 3:1. Minimum {minWidth}x{minHeight}px.</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
            <XIcon className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Apply
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

