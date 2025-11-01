export type MediaQuality = "uhd" | "qhd" | "hd" | "sd" | "unknown"

export const STREAMING_PROVIDER_PATTERN = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com)/i

export const MEDIA_QUALITY_BADGE: Record<MediaQuality, { label: string; badgeClassName: string }> = {
  uhd: { label: "4K UHD", badgeClassName: "bg-purple-600 text-white border-transparent" },
  qhd: { label: "QHD", badgeClassName: "bg-indigo-600 text-white border-transparent" },
  hd: { label: "Full HD", badgeClassName: "bg-emerald-600 text-white border-transparent" },
  sd: { label: "Below HD", badgeClassName: "bg-amber-500 text-black border-transparent" },
  unknown: { label: "Unknown", badgeClassName: "bg-slate-600 text-white border-transparent" },
}

export function classifyMediaQuality(width?: number, height?: number): MediaQuality {
  if (!width || !height) return "unknown"
  if (width >= 3840 && height >= 2160) return "uhd"
  if (width >= 2560 && height >= 1440) return "qhd"
  if (width >= 1920 && height >= 1080) return "hd"
  return "sd"
}

export function formatMediaDuration(duration?: number): string {
  if (!duration || !Number.isFinite(duration)) return ""
  const totalSeconds = Math.max(0, Math.round(duration))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function isStreamingProvider(url: string): boolean {
  return STREAMING_PROVIDER_PATTERN.test(url)
}
