import { NextRequest, NextResponse } from 'next/server'

function absoluteUrl(base: string, path?: string | null): string | null {
  if (!path) return null
  try {
    const u = new URL(path, base)
    return u.toString()
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url')
    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    const target = new URL(url)
    const res = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PawSocialLinkPreview/1.0)'
      },
      redirect: 'follow',
      // Next.js edge fetch caches by default if configured; keep straightforward here
    })
    const html = await res.text()

    // Simple Open Graph + fallback parsing
    const pick = (re: RegExp) => {
      const m = html.match(re)
      return m?.[1]?.trim() || null
    }
    const title = pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      pick(/<title[^>]*>([^<]+)<\/title>/i) ||
      pick(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["'][^>]*>/i)

    const description = pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)

    const image = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    const siteName = pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i) || target.hostname

    // Favicon
    const iconHref = pick(/<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    const favicon = absoluteUrl(target.origin, iconHref) || absoluteUrl(target.origin, '/favicon.ico')

    const imageAbs = absoluteUrl(target.origin, image)

    return NextResponse.json({
      url: target.toString(),
      title,
      description,
      image: imageAbs,
      siteName,
      favicon,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 })
  }
}

