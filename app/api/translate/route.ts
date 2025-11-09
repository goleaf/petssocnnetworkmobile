import { NextResponse } from "next/server"

type Provider = 'deepl' | 'azure' | 'google'

function getProvider(): Provider | null {
  if (process.env.DEEPL_API_KEY) return 'deepl'
  if (process.env.AZURE_TRANSLATOR_KEY && process.env.AZURE_TRANSLATOR_REGION) return 'azure'
  if (process.env.GOOGLE_TRANSLATE_API_KEY) return 'google'
  return null
}

export async function POST(req: Request) {
  try {
    const { text, from, to, provider }: { text: string; from?: string | null; to?: string; provider?: Provider } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const target = to || 'en'
    const chosen = provider || getProvider()

    if (!chosen) {
      // Fallback stub when no provider configured
      const marker = to ? `translated → ${target}` : 'translated'
      return NextResponse.json({ text: `(${marker})\n${text}`, from: from ?? undefined, to: target }, { status: 200 })
    }

    if (chosen === 'deepl') {
      const url = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate'
      const params = new URLSearchParams()
      params.set('auth_key', process.env.DEEPL_API_KEY!)
      params.set('text', text)
      params.set('target_lang', target.toUpperCase())
      if (from) params.set('source_lang', from.toUpperCase())
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params })
      if (!r.ok) {
        const body = await r.text()
        return NextResponse.json({ error: 'DeepL request failed', details: body }, { status: 502 })
      }
      const data = await r.json()
      const translated = data?.translations?.[0]?.text || ''
      return NextResponse.json({ text: translated, from: from ?? undefined, to: target })
    }

    if (chosen === 'azure') {
      const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com/translate'
      const url = `${endpoint}?api-version=3.0&to=${encodeURIComponent(target)}${from ? `&from=${encodeURIComponent(from)}` : ''}`
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_TRANSLATOR_KEY!,
          'Ocp-Apim-Subscription-Region': process.env.AZURE_TRANSLATOR_REGION!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ Text: text }])
      })
      if (!r.ok) {
        const body = await r.text()
        return NextResponse.json({ error: 'Azure request failed', details: body }, { status: 502 })
      }
      const data = await r.json()
      const translated = data?.[0]?.translations?.[0]?.text || ''
      return NextResponse.json({ text: translated, from: from ?? undefined, to: target })
    }

    if (chosen === 'google') {
      const key = process.env.GOOGLE_TRANSLATE_API_KEY!
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target, source: from || undefined, format: 'text' })
      })
      if (!r.ok) {
        const body = await r.text()
        return NextResponse.json({ error: 'Google request failed', details: body }, { status: 502 })
      }
      const data = await r.json()
      const translated = data?.data?.translations?.[0]?.translatedText || ''
      return NextResponse.json({ text: translated, from: from ?? undefined, to: target })
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Translation failed', details: e?.message || String(e) }, { status: 500 })
  }
}

