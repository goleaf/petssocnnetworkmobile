export function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export function filenameFromSrc(src: string): string {
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost")
    const pathname = url.pathname
    const last = pathname.split("/").filter(Boolean).pop() || "image"
    return decodeURIComponent(last)
  } catch {
    const parts = src.split("/")
    return decodeURIComponent(parts[parts.length - 1] || "image")
  }
}

export function heuristicAltFromSrc(src: string): string {
  const file = filenameFromSrc(src)
  if (!file) return "Image"
  const base = file.replace(/\.[a-zA-Z0-9]+$/, "")
  if (/placeholder|spacer|blank/i.test(base)) return ""
  if (/avatar|profile/i.test(src)) return "User avatar"
  if (/logo/i.test(src)) return "Logo"
  const withSpaces = base
    .replace(/[\-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
  return withSpaces ? titleCase(withSpaces) : "Image"
}

export async function fetchAltFromAPI(src: string): Promise<string | null> {
  try {
    // Optional API route inside the app; falls back if unavailable
    const res = await fetch(`/api/a11y/alt-text?src=${encodeURIComponent(src)}`)
    if (!res.ok) return null
    const data = (await res.json()) as { alt?: string }
    return typeof data.alt === "string" ? data.alt : null
  } catch {
    return null
  }
}

export function ensureSkipTarget(el: HTMLElement | null): void {
  if (!el) return
  if (!el.getAttribute("tabindex")) {
    el.setAttribute("tabindex", "-1")
  }
}
