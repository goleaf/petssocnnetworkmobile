"use client"

/**
 * Minimal translation service abstraction.
 * Replace implementation to call a real provider (Google, DeepL, Microsoft) via server route.
 */

export async function translateText(text: string, from?: string | null, to?: string): Promise<{ text: string; from?: string | null; to?: string }>{
  // Stubbed implementation: echoes with a marker for now
  const marker = to ? `translated → ${to}` : 'translated'
  const translated = `(${marker})\n${text}`
  return { text: translated, from: from || undefined, to }
}

