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
  moderationId?: string
  isFlagged?: boolean
  blurOnWarning?: boolean
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

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format")
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

  // Moderate the uploaded image
  let moderationId: string | undefined
  let isFlagged = false
  let blurOnWarning = true

  try {
    const { ContentModerationService, queueMediaForModeration } = await import("./moderation")
    const moderationService = new ContentModerationService({
      autoModerate: true,
      blurOnWarning: true,
    })

    const moderationResult = await moderationService.moderateMedia(fileUrl, "image")
    
    const moderation = await queueMediaForModeration(
      fileUrl,
      "image",
      moderationResult,
      {
        width: dimensions.width,
        height: dimensions.height,
        fileSize: file.size,
      }
    )

    moderationId = moderation.id
    isFlagged = moderationResult.flagged
    blurOnWarning = moderation.blurOnWarning
  } catch (error) {
    // If moderation fails, log but don't block upload
    console.error("Moderation error:", error)
  }

  return {
    url: fileUrl,
    width: dimensions.width,
    height: dimensions.height,
    size: file.size,
    mimeType: file.type,
    moderationId,
    isFlagged,
    blurOnWarning,
  }
}

/**
 * Upload image honoring user media settings (downscale/compress when HQ uploads disabled).
 */
export async function uploadImageWithSettings(
  file: File,
  userId: string,
  folder: string = "articles",
): Promise<ImageUploadResult> {
  try {
    const { getMediaSettings } = await import("./media-settings")
    const { downscaleImageFile } = await import("./utils/image")
    const settings = getMediaSettings(userId)
    let working = file

    if (!settings.highQualityUploads) {
      // Downscale to 1920px max dimension and moderate quality for bandwidth saving
      working = await downscaleImageFile(file, { maxWidth: 1920, maxHeight: 1920, quality: 0.8, format: 'image/webp' })
    }

    return await uploadImage(working, folder)
  } catch (e) {
    // Fallback to normal upload if settings or transform fail
    return await uploadImage(file, folder)
  }
}

/**
 * Upload video file (similar to uploadImage but for videos)
 */
export async function uploadVideo(
  file: File,
  folder: string = "videos"
): Promise<{
  url: string
  size: number
  mimeType: string
  moderationId?: string
  isFlagged?: boolean
  blurOnWarning?: boolean
  duration?: number
}> {
  // Validate file type
  if (!file.type.startsWith("video/")) {
    throw new Error("File must be a video")
  }

  // Validate file size (max 100MB for videos)
  const MAX_SIZE = 100 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error("Video size must be less than 100MB")
  }

  // Generate unique filename
  const extension = file.name.split(".").pop() || "mp4"
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

  // Moderate the uploaded video
  let moderationId: string | undefined
  let isFlagged = false
  let blurOnWarning = true
  let duration: number | undefined

  try {
    // Get video duration (simplified - in production use video element or API)
    duration = await getVideoDuration(file)

    const { ContentModerationService, queueMediaForModeration } = await import("./moderation")
    const moderationService = new ContentModerationService({
      autoModerate: true,
      blurOnWarning: true,
    })

    const moderationResult = await moderationService.moderateMedia(fileUrl, "video")
    
    const moderation = await queueMediaForModeration(
      fileUrl,
      "video",
      moderationResult,
      {
        fileSize: file.size,
        duration,
      }
    )

    moderationId = moderation.id
    isFlagged = moderationResult.flagged
    blurOnWarning = moderation.blurOnWarning
  } catch (error) {
    // If moderation fails, log but don't block upload
    console.error("Moderation error:", error)
  }

  return {
    url: fileUrl,
    size: file.size,
    mimeType: file.type,
    moderationId,
    isFlagged,
    blurOnWarning,
    duration,
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
 * Upload video and enqueue server-side transcode when HQ uploads are disabled.
 */
export async function uploadVideoWithSettings(
  file: File,
  userId: string,
  folder: string = "videos",
  preset: 'mobile' | 'sd' | 'hd' = 'mobile',
) {
  const { getMediaSettings } = await import('./media-settings')
  const settings = getMediaSettings(userId)
  const result = await uploadVideo(file, folder)

  if (!settings.highQualityUploads) {
    try {
      await fetch('/api/upload/transcode-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fileUrl: result.url, preset }),
      })
    } catch (e) {
      // non-fatal
      console.error('Failed to enqueue transcode', e)
    }
  }

  return result
}

/**
 * Get video duration from a file
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load video"))
    }

    video.src = url
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

  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Invalid response format")
  }

  const data = await response.json()
  return data.downloadUrl
}
