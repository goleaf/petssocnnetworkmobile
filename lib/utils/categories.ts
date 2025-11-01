export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "uncategorized"
}

export interface NormalizeCategoryOptions {
  fallback?: string
}

export function normalizeCategoryList(
  categories: unknown,
  options: NormalizeCategoryOptions = {},
): string[] {
  let values: string[] = []

  if (Array.isArray(categories)) {
    values = categories as string[]
  } else if (typeof categories === "string") {
    values = categories.split(",")
  } else if (categories != null) {
    values = [String(categories)]
  }

  const seen = new Set<string>()
  const normalized: string[] = []

  values.forEach((raw) => {
    if (typeof raw !== "string") return
    const trimmed = raw.trim().replace(/\s+/g, " ")
    if (!trimmed) return

    const key = trimmed.toLowerCase()
    if (seen.has(key)) return

    seen.add(key)
    normalized.push(trimmed)
  })

  if (normalized.length === 0 && options.fallback) {
    normalized.push(options.fallback)
  }

  return normalized
}

export function formatCategoryLabel(category: string): string {
  const trimmed = category.trim()
  if (!trimmed) return ""

  const hasMixedCase = /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed)
  const isAllCaps = /^[A-Z0-9\s-&]+$/.test(trimmed)

  if (hasMixedCase || isAllCaps) {
    return trimmed
  }

  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase())
}
