import { NextResponse } from "next/server"
import { heuristicAltFromSrc } from "@/lib/a11y"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const src = searchParams.get("src") || ""
  const endpoint = process.env.ALT_TEXT_ENDPOINT || process.env.NEXT_PUBLIC_ALT_TEXT_API

  if (endpoint && src) {
    try {
      const target = (() => {
        try {
          return new URL(endpoint, request.url).toString()
        } catch {
          return endpoint
        }
      })()
      const res = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: src }),
      })
      if (res.ok) {
        const data = (await res.json()) as { alt?: string; caption?: string; description?: string }
        const alt = data.alt || data.caption || data.description
        if (alt && typeof alt === "string") {
          return NextResponse.json({ alt })
        }
      }
    } catch {
      // fall through to heuristic
    }
  }

  const alt = src ? heuristicAltFromSrc(src) : "Image"
  return NextResponse.json({ alt })
}
