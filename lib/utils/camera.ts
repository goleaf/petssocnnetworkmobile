import { Camera, CameraResultType, CameraSource } from "@capacitor/camera"
import { Filesystem, Directory } from "@capacitor/filesystem"

/**
 * Camera utility functions for capturing photos
 * Used for wiki article image uploads and other image capture needs
 */

export interface CameraPhoto {
  dataUrl: string
  format: string
  saved?: boolean
}

/**
 * Check if Capacitor is available (running in native app)
 */
export function isCapacitorAvailable(): boolean {
  return typeof window !== "undefined" && !!(window as any).Capacitor
}

/**
 * Capture a photo from the camera
 * @param options Camera options (source, quality, etc.)
 * @returns Promise resolving to photo data URL
 */
export async function capturePhoto(
  options?: {
    source?: CameraSource
    quality?: number
    allowEditing?: boolean
  }
): Promise<CameraPhoto> {
  if (!isCapacitorAvailable()) {
    throw new Error("Camera is only available in native app")
  }

  try {
    const image = await Camera.getPhoto({
      quality: options?.quality ?? 90,
      allowEditing: options?.allowEditing ?? true,
      resultType: CameraResultType.DataUrl,
      source: options?.source ?? CameraSource.Camera,
    })

    return {
      dataUrl: image.dataUrl || "",
      format: image.format || "jpeg",
    }
  } catch (error) {
    if (error === "User cancelled photos app") {
      throw new Error("Photo capture was cancelled")
    }
    throw new Error(`Failed to capture photo: ${error}`)
  }
}

/**
 * Pick a photo from the device gallery
 * @param options Camera options
 * @returns Promise resolving to photo data URL
 */
export async function pickPhoto(
  options?: {
    quality?: number
    allowEditing?: boolean
  }
): Promise<CameraPhoto> {
  if (!isCapacitorAvailable()) {
    // Fallback to file input in web
    return new Promise((resolve, reject) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          reject(new Error("No file selected"))
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          resolve({
            dataUrl: event.target?.result as string,
            format: file.type || "jpeg",
          })
        }
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      }
      input.click()
    })
  }

  try {
    const image = await Camera.getPhoto({
      quality: options?.quality ?? 90,
      allowEditing: options?.allowEditing ?? true,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    })

    return {
      dataUrl: image.dataUrl || "",
      format: image.format || "jpeg",
    }
  } catch (error) {
    if (error === "User cancelled photos app") {
      throw new Error("Photo selection was cancelled")
    }
    throw new Error(`Failed to pick photo: ${error}`)
  }
}

/**
 * Save a photo to the device gallery (if needed)
 * Note: This uses Filesystem API - may require additional permissions
 */
export async function savePhotoToGallery(
  dataUrl: string,
  filename: string = `photo_${Date.now()}.jpg`
): Promise<void> {
  if (!isCapacitorAvailable()) {
    throw new Error("Filesystem is only available in native app")
  }

  try {
    // Convert data URL to base64
    const base64Data = dataUrl.split(",")[1]

    await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents,
    })
  } catch (error) {
    throw new Error(`Failed to save photo: ${error}`)
  }
}

