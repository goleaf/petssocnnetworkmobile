export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const isBase64 = /;base64$/.test(header) || /;base64/.test(header)
  const contentTypeMatch = header.match(/data:(.*?);/)
  const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream'
  const byteString = isBase64 ? atob(data) : decodeURIComponent(data)
  const ia = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  return new Blob([ia], { type: contentType })
}

export async function compressDataUrl(
  dataUrl: string,
  options: { maxBytes?: number; maxDimension?: number; outputType?: 'image/jpeg' | 'image/webp' }
): Promise<Blob> {
  const { maxBytes = 2 * 1024 * 1024, maxDimension = 1000, outputType = 'image/jpeg' } = options || {}

  const img = await createImage(dataUrl)
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight))
  const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  // Quick path at quality 0.9
  let qualityLow = 0.4
  let qualityHigh = 0.95
  let quality = 0.9
  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, quality))
  if (!blob) throw new Error('Failed to encode image')
  if (blob.size <= maxBytes) return blob

  // Binary search for acceptable quality
  for (let i = 0; i < 8; i++) {
    qualityHigh = quality
    quality = (qualityLow + qualityHigh) / 2
    const trial = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, quality))
    if (!trial) break
    blob = trial
    if (blob.size <= maxBytes) {
      // try to increase a bit
      qualityLow = quality
    } else {
      // need smaller
      qualityHigh = quality
    }
  }

  if (!blob) throw new Error('Failed to encode image')
  // If still too big, downscale further proportionally and retry once
  if (blob.size > maxBytes) {
    const ratio = Math.sqrt(maxBytes / blob.size)
    const w = Math.max(1, Math.floor(targetWidth * ratio))
    const h = Math.max(1, Math.floor(targetHeight * ratio))
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const fallback = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, 0.8))
    if (fallback) blob = fallback
  }

  return blob
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (e) => reject(e)
    image.src = url
  })
}

