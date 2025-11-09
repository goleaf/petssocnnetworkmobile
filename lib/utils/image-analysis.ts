"use client"

/** Lightweight client-side image analysis to estimate quality.
 * Approximates quality from resolution and brightness.
 * Returns a 0-100 score and basic flags.
 */
export interface ImageQualityResult {
  score: number // 0-100
  brightness: number // 0-255 (mean luminance)
  width: number
  height: number
  isLowResolution: boolean
  isPoorLighting: boolean
}

const cache = new Map<string, Promise<ImageQualityResult>>()

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** Heuristic low-res test: under ~1MP or narrow dimension under 720px */
function isLowRes(width: number, height: number): boolean {
  const mp = (width * height) / 1_000_000
  const minDim = Math.min(width, height)
  return mp < 1 || minDim < 720
}

/**
 * Analyze an image URL. Draws downscaled image to canvas to sample brightness.
 * If width/height are provided, avoids re-reading natural sizes onload.
 */
export function analyzeImageQuality(url: string, hinted?: { width?: number; height?: number }): Promise<ImageQualityResult> {
  const key = `${url}|${hinted?.width || 0}x${hinted?.height || 0}`
  const prev = cache.get(key)
  if (prev) return prev

  const work = new Promise<ImageQualityResult>((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const width = hinted?.width || img.naturalWidth || 0
        const height = hinted?.height || img.naturalHeight || 0

        let brightness = 0
        try {
          const canvas = document.createElement("canvas")
          const sampleW = 128
          const aspect = width > 0 && height > 0 ? width / height : 1
          canvas.width = sampleW
          canvas.height = Math.max(1, Math.round(sampleW / (aspect || 1)))
          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
            // Mean luminance using Rec. 709 luma coefficients
            let sum = 0
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i]
              const g = data[i + 1]
              const b = data[i + 2]
              sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
            }
            brightness = sum / (data.length / 4)
          }
        } catch {
          // Ignore canvas errors (e.g. tainted canvas), fall back to 0 brightness
          brightness = 0
        }

        const lowRes = isLowRes(width, height)
        const poorLight = brightness > 0 ? brightness < 55 : false

        // Composite score: resolution (0-50) + brightness (0-50)
        let resScore = 0
        const mp = (width * height) / 1_000_000
        if (mp >= 8) resScore = 50
        else if (mp >= 4) resScore = 40
        else if (mp >= 2) resScore = 30
        else if (mp >= 1) resScore = 20
        else resScore = 10

        let brightScore = 0
        if (brightness > 0) {
          const normalized = clamp((brightness - 55) / (255 - 55), 0, 1)
          brightScore = Math.round(normalized * 50)
        }

        const score = clamp(Math.round(resScore + brightScore), 0, 100)
        resolve({ score, brightness, width, height, isLowResolution: lowRes, isPoorLighting: poorLight })
      }
      img.onerror = () => {
        resolve({ score: 0, brightness: 0, width: hinted?.width || 0, height: hinted?.height || 0, isLowResolution: true, isPoorLighting: true })
      }
      img.src = url
    } catch {
      resolve({ score: 0, brightness: 0, width: hinted?.width || 0, height: hinted?.height || 0, isLowResolution: true, isPoorLighting: true })
    }
  })

  cache.set(key, work)
  return work
}

