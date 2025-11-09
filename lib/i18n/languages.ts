"use client"

/**
 * Language helper utilities
 * - Returns a curated list of common languages (ISO 639-1 codes)
 * - Localizes display names via Intl.DisplayNames when available
 */

export interface LanguageOption {
  code: string // e.g., 'en'
  name: string // localized display name
}

// Curated list of common languages (ISO 639-1)
const COMMON_LANGUAGE_CODES: string[] = [
  'en','es','fr','de','it','pt','ru','ja','ko','zh','ar','hi','nl','pl','sv','no','da','fi','tr','he','id','ms','th','vi','uk','el','ro','hu','bg','cs','sk','hr','sl','sr','et','lv','lt','fa','ur','bn','ta','te','ml','mr','gu','kn','pa'
]

export function getCommonLanguages(locale: string = 'en-US'): LanguageOption[] {
  let dn: Intl.DisplayNames | null = null
  try {
    // @ts-ignore - older TS dom types may not have DisplayNames
    dn = new Intl.DisplayNames([locale], { type: 'language' })
  } catch {
    dn = null
  }
  const items = COMMON_LANGUAGE_CODES.map((code) => ({
    code,
    name: dn ? (dn.of(code) || code) : code,
  }))
  return items.sort((a, b) => a.name.localeCompare(b.name))
}

