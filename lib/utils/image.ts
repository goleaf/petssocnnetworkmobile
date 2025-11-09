/** Lightweight image downscaling/compression in browser using Canvas. */

export interface DownscaleOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0..1 for lossy formats
  format?: 'image/webp' | 'image/jpeg' | 'image/png'
}

export async function downscaleImageFile(
  file: File,
  opts: DownscaleOptions = {},
): Promise<File> {
  const maxWidth = opts.maxWidth ?? 1920
  const maxHeight = opts.maxHeight ?? 1920
  const quality = opts.quality ?? 0.8
  const format: DownscaleOptions['format'] = opts.format ?? 'image/webp'

  const img = await loadImageFromFile(file)

  const { width, height } = calculateContainSize(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight)

  // If the image is already within bounds and format conversion not needed, return original
  const keepFormat = file.type === format
  if (img.naturalWidth <= width && img.naturalHeight <= height && keepFormat) {
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unsupported')
  ctx.drawImage(img, 0, 0, width, height)

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode image'))),
      format,
      quality,
    )
  })

  const ext = format === 'image/png' ? 'png' : format === 'image/jpeg' ? 'jpg' : 'webp'
  const name = `${file.name.replace(/\.[^.]+$/, '')}-compressed.${ext}`
  return new File([blob], name, { type: blob.type })
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function calculateContainSize(srcW: number, srcH: number, maxW: number, maxH: number): { width: number; height: number } {
  const scale = Math.min(maxW / srcW, maxH / srcH, 1)
  return { width: Math.round(srcW * scale), height: Math.round(srcH * scale) }
}

