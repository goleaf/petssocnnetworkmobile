"use client"

/**
 * Minimal translation service abstraction.
 * Replace implementation to call a real provider (Google, DeepL, Microsoft) via server route.
 */

export async function translateText(text: string, from?: string | null, to?: string): Promise<{ text: string; from?: string | null; to?: string }>{
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || `Translate failed: ${res.status}`)
    }
    return await res.json()
  } catch (e) {
    // Fallback stub
    const marker = to ? `translated → ${to}` : 'translated'
    return { text: `(${marker})\n${text}`, from: from || undefined, to }
  }
}
