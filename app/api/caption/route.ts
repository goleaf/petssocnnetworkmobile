import { NextResponse } from "next/server"

// Simple image captioning endpoint using Hugging Face Inference API.
// Accepts JSON: { image: string } where image is a URL or a data URL (base64).
// Returns: { alt?: string, caption?: string }.

const DEFAULT_MODEL = process.env.ALT_TEXT_HF_MODEL || "Salesforce/blip-image-captioning-large"
const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY

export const runtime = "nodejs"

async function readImageBytes(image: string): Promise<Uint8Array | null> {
  try {
    if (image.startsWith("data:")) {
      // data URL
      const base64 = image.split(",")[1] || ""
      const buf = Buffer.from(base64, "base64")
      return new Uint8Array(buf)
    }
    // Assume it is a URL
    const res = await fetch(image)
    if (!res.ok) return null
    const arr = new Uint8Array(await res.arrayBuffer())
    return arr
  } catch {
    return null
  }
}

async function captionWithHF(bytes: Uint8Array): Promise<string | null> {
  if (!HF_TOKEN) return null
  try {
    const endpoint = `https://api-inference.huggingface.co/models/${DEFAULT_MODEL}`
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "content-type": "application/octet-stream",
      },
      body: bytes,
      // Disable cache since images vary
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = (await res.json()) as any
    // Common HF response shape: [{ generated_text: "..." }]
    if (Array.isArray(data) && data[0]?.generated_text) {
      return String(data[0].generated_text)
    }
    // Some models return { generated_text: "..." }
    if (data?.generated_text) return String(data.generated_text)
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { image } = (await request.json()) as { image?: string }
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing 'image'" }, { status: 400 })
    }
    const bytes = await readImageBytes(image)
    if (!bytes) {
      return NextResponse.json({ error: "Could not read image" }, { status: 400 })
    }
    const caption = await captionWithHF(bytes)
    if (caption) {
      return NextResponse.json({ alt: caption, caption })
    }
    // If HF not configured or failed, return a soft response; caller may fallback.
    return NextResponse.json({ alt: null, caption: null })
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
