/**
 * Storage upload utility for handling image uploads to cloud storage
 * Supports signed URLs for secure uploads
 */

export interface UploadConfig {
  bucket: string
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  endpoint?: string // For S3-compatible services
  pathPrefix?: string // e.g., "uploads/articles/"
}

export interface SignedUploadUrlResponse {
  uploadUrl: string
  fileUrl: string // Final URL after upload
  expiresIn: number // Expiration time in seconds
}

export interface ImageUploadResult {
  url: string
  width: number
  height: number
  size: number
  mimeType: string
}

/**
 * Get a signed upload URL from the server
 */
export async function getSignedUploadUrl(
  fileName: string,
  fileType: string,
  fileSize: number,
  folder: string = "articles"
): Promise<SignedUploadUrlResponse> {
  const response = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      fileType,
      fileSize,
      folder,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get upload URL" }))
    throw new Error(error.message || "Failed to get signed upload URL")
  }

  return response.json()
}

/**
 * Upload a file to storage using a signed URL
 */
export async function uploadFileToStorage(
  file: File,
  signedUrl: string
): Promise<void> {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`)
  }
}

/**
 * Complete upload pipeline: get signed URL and upload file
 */
export async function uploadImage(
  file: File,
  folder: string = "articles"
): Promise<ImageUploadResult> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }

  // Validate file size (max 10MB)
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error("Image size must be less than 10MB")
  }

  // Get file dimensions
  const dimensions = await getImageDimensions(file)

  // Generate unique filename
  const extension = file.name.split(".").pop() || "jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`

  // Get signed upload URL
  const { uploadUrl, fileUrl } = await getSignedUploadUrl(
    fileName,
    file.type,
    file.size,
    folder
  )

  // Upload file to storage
  await uploadFileToStorage(file, uploadUrl)

  return {
    url: fileUrl,
    width: dimensions.width,
    height: dimensions.height,
    size: file.size,
    mimeType: file.type,
  }
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image"))
    }

    img.src = url
  })
}

/**
 * Get a signed download URL for viewing images
 */
export async function getSignedDownloadUrl(fileUrl: string): Promise<string> {
  const response = await fetch("/api/upload/download-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrl }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get download URL" }))
    throw new Error(error.message || "Failed to get signed download URL")
  }

  const data = await response.json()
  return data.downloadUrl
}

