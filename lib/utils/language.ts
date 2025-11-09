/**
 * Language utilities for posts
 */
import type { BlogPost } from "@/lib/types"

const NAME_TO_CODE: Record<string, string> = {
  english: 'en', spanish: 'es', french: 'fr', german: 'de', italian: 'it', portuguese: 'pt', russian: 'ru', japanese: 'ja', korean: 'ko', chinese: 'zh', arabic: 'ar', hindi: 'hi', turkish: 'tr', hebrew: 'he', indonesian: 'id', malay: 'ms', thai: 'th', vietnamese: 'vi', ukrainian: 'uk', greek: 'el', romanian: 'ro', hungarian: 'hu', bulgarian: 'bg', czech: 'cs', slovak: 'sk', croatian: 'hr', slovenian: 'sl', serbian: 'sr', estonian: 'et', latvian: 'lv', lithuanian: 'lt', farsi: 'fa', persian: 'fa', urdu: 'ur'
}

export function detectPostLanguage(post: BlogPost): string | null {
  // Prefer explicit field
  // @ts-ignore - BlogPost may not have language in older data
  const explicit = (post as any).language as string | undefined
  if (explicit && typeof explicit === 'string') {
    return explicit.toLowerCase()
  }
  // Look for tag like 'lang:xx' or 'language:xx'
  const fromTag = post.tags?.find((t) => /^(lang|language):[a-zA-Z-]{2,}$/.test(t))
  if (fromTag) {
    const code = fromTag.split(":")[1].toLowerCase()
    return code
  }
  // Look for plain language name tag (e.g., 'english')
  const nameTag = post.tags?.find((t) => NAME_TO_CODE[t.toLowerCase()])
  if (nameTag) {
    return NAME_TO_CODE[nameTag.toLowerCase()]
  }
  return null
}

export function isPreferredLanguage(code: string | null, preferred: string[] | undefined): boolean {
  if (!code || !preferred || preferred.length === 0) return false
  return preferred.includes(code.toLowerCase())
}

