"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { uploadImage, uploadImageWithSettings, type ImageUploadResult } from "@/lib/storage-upload"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  onUploadComplete: (result: ImageUploadResult) => void
  onError?: (error: Error) => void
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  className?: string
  disabled?: boolean
  existingImageUrl?: string
  onRemove?: () => void
  label?: string
  showPreview?: boolean
}

/**
 * Image upload component with camera and file picker support
 * Works on both web (file picker) and mobile (camera via Capacitor)
 */
export function ImageUpload({
  onUploadComplete,
  onError,
  folder = "articles",
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  className,
  disabled = false,
  existingImageUrl,
  onRemove,
  label,
  showPreview = true,
}: ImageUploadProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        return
      }

      // Validate file size
      if (file.size > maxSize) {
        const errorMsg = `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB`
        setError(errorMsg)
        onError?.(new Error(errorMsg))
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          setPreview(dataUrl)
        }
      }
      reader.readAsDataURL(file)

      // Upload file
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)

      try {
        // Simulate progress (real progress would need XHR with progress events)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 100)

        const result = user
          ? await uploadImageWithSettings(file, user.id, folder)
          : await uploadImage(file, folder)
        clearInterval(progressInterval)
        setUploadProgress(100)

        onUploadComplete(result)
        setError(null)
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed")
        setError(error.message)
        onError?.(error)
        setPreview(null)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [allowedTypes, maxSize, folder, onUploadComplete, onError]
  )

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCameraClick = async () => {
    if (typeof window === "undefined") return

    try {
      // Check if Capacitor is available (mobile)
      const { Camera } = await import("@capacitor/camera")
      const { Capacitor } = await import("@capacitor/core")

      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Camera on mobile
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: "base64",
        })

        // Convert base64 to blob then file
        const byteCharacters = atob(image.base64String || "")
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: image.format === "png" ? "image/png" : "image/jpeg" })
        const file = new File([blob], `camera-${Date.now()}.${image.format || "jpg"}`, {
          type: blob.type || "image/jpeg",
        })

        handleFile(file)
      } else {
        // Fallback to file input if not on native platform
        fileInputRef.current?.click()
      }
    } catch (err) {
      // Fallback to file input if camera fails
      console.error("Camera error:", err)
      fileInputRef.current?.click()
    }
  }

  const handleFilePickerClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onRemove?.()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {/* Preview */}
        {showPreview && preview && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border bg-muted">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-muted-foreground text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Buttons */}
        {!preview && !isUploading && (
          <div className="flex gap-2">
            {isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCameraClick}
                disabled={disabled || isUploading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleFilePickerClick}
              disabled={disabled || isUploading}
              className={isMobile ? "flex-1" : "w-full"}
            >
              {isMobile ? (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Gallery
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Maximum size: {Math.round(maxSize / 1024 / 1024)}MB. Allowed types:{" "}
        {allowedTypes.map((t) => t.split("/")[1]).join(", ")}
      </p>
    </div>
  )
}
