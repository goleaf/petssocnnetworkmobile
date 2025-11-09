import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

export const runtime = "nodejs"

type DerivativeInfo = {
  key: string
  url: string
  width: number
  height: number
  format: "webp" | "jpeg"
}

type ProcessImageResponse = {
  ok: true
  input: { bucket: string; key: string; width: number; height: number; isVertical: boolean }
  outputs: {
    optimized: { webp: DerivativeInfo; jpeg: DerivativeInfo }
    story?: { webp: DerivativeInfo; jpeg: DerivativeInfo }
    thumbnails: {
      small: { webp: DerivativeInfo; jpeg: DerivativeInfo }
      tiny: { webp: DerivativeInfo; jpeg: DerivativeInfo }
    }
  }
} | { ok: false; error: string }

function getS3Client() {
  const config: {
    region: string
    endpoint?: string
    credentials?: { accessKeyId: string; secretAccessKey: string }
    forcePathStyle?: boolean
  } = {
    region: process.env.AWS_REGION || "us-east-1",
  }

  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT
    config.forcePathStyle = true
  }

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  }

  return new S3Client(config)
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "pet-social-network"

function buildPublicUrl(key: string): string {
  const path = key.startsWith("/") ? key.slice(1) : key
  if (process.env.AWS_S3_PUBLIC_URL) {
    const base = process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, "")
    return `${base}/${path}`
  }
  if (process.env.AWS_ENDPOINT) {
    const base = process.env.AWS_ENDPOINT.replace(/\/$/, "")
    return `${base}/${BUCKET_NAME}/${path}`
  }
  const region = process.env.AWS_REGION || "us-east-1"
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${path}`
}

function extractKeyFromUrl(fileUrl: string): string {
  try {
    if (!fileUrl.includes("http")) return fileUrl.replace(/^\//, "")
    const u = new URL(fileUrl)
    const pathname = u.pathname.replace(/^\//, "")
    // Handle typical S3 URL formats
    if (u.hostname === `${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`) {
      return pathname
    }
    if (u.hostname === "s3.amazonaws.com") {
      // s3.amazonaws.com/bucket/key
      const parts = pathname.split("/")
      if (parts[0] === BUCKET_NAME) return parts.slice(1).join("/")
      return pathname
    }
    // Custom endpoint (e.g., DigitalOcean Spaces, MinIO)
    if (process.env.AWS_ENDPOINT && fileUrl.startsWith(process.env.AWS_ENDPOINT)) {
      const prefix = `${new URL(process.env.AWS_ENDPOINT).host}/`
      const afterHost = fileUrl.split(prefix)[1]
      const afterBucket = afterHost?.startsWith(`${BUCKET_NAME}/`)
        ? afterHost.slice(BUCKET_NAME.length + 1)
        : afterHost
      return (afterBucket || pathname).replace(/^\//, "")
    }
    // Fallback: if path begins with bucket, remove it
    if (pathname.startsWith(`${BUCKET_NAME}/`)) {
      return pathname.slice(BUCKET_NAME.length + 1)
    }
    return pathname
  } catch {
    // If parsing fails, assume it's already a key
    return fileUrl.replace(/^\//, "")
  }
}

async function streamToBuffer(stream: any): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0)
  if (Buffer.isBuffer(stream)) return stream
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}

async function uploadBuffer(
  s3: S3Client,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: { processedAt: new Date().toISOString() },
    }),
  )
  return buildPublicUrl(key)
}

export async function POST(req: NextRequest): Promise<NextResponse<ProcessImageResponse>> {
  try {
    const { fileUrl, options } = (await req.json()) as {
      fileUrl: string
      options?: {
        qualityLarge?: number
        qualityThumb?: number
      }
    }

    if (!fileUrl) {
      return NextResponse.json({ ok: false, error: "Missing 'fileUrl'" }, { status: 400 })
    }

    const s3 = getS3Client()
    const key = extractKeyFromUrl(fileUrl)

    // Download original
    const original = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }),
    )
    const inputBuffer = await streamToBuffer(original.Body)

    if (!inputBuffer?.length) {
      return NextResponse.json({ ok: false, error: "Failed to read original image" }, { status: 404 })
    }

    // Read metadata and account for EXIF orientation when determining vertical/horizontal
    const meta = await sharp(inputBuffer, { failOn: "none" }).metadata()
    let width = meta.width || 0
    let height = meta.height || 0
    const orientation = meta.orientation || 1
    if ([5, 6, 7, 8].includes(orientation)) {
      // Rotated 90/270
      ;[width, height] = [height, width]
    }
    const isVertical = height >= width

    // Define qualities
    const qualityLarge = Math.max(40, Math.min(100, options?.qualityLarge ?? 80))
    const qualityThumb = Math.max(40, Math.min(100, options?.qualityThumb ?? 75))

    // Base name for derivatives
    const keyBase = key.replace(/\.[^.]+$/, "")

    // Helper to create variants
    const makeWebp = (img: sharp.Sharp, q: number) => img.webp({ quality: q })
    const makeJpeg = (img: sharp.Sharp, q: number) => img.jpeg({ quality: q, progressive: true, mozjpeg: true })

    // Optimized (ratio preserved, long side <= 1920)
    const optimizedResize = { width: 1920, height: 1920, fit: "inside" as const, withoutEnlargement: true }
    const optWebpBuf = await makeWebp(sharp(inputBuffer).rotate().resize(optimizedResize), qualityLarge).toBuffer()
    const optJpegBuf = await makeJpeg(sharp(inputBuffer).rotate().resize(optimizedResize), qualityLarge).toBuffer()

    const optWebpKey = `${keyBase}-opt.webp`
    const optJpegKey = `${keyBase}-opt.jpg`
    const [optWebpUrl, optJpegUrl] = await Promise.all([
      uploadBuffer(s3, optWebpKey, optWebpBuf, "image/webp"),
      uploadBuffer(s3, optJpegKey, optJpegBuf, "image/jpeg"),
    ])

    // Story crop for vertical images: 1080x1920 (9:16)
    let storyWebp: DerivativeInfo | undefined
    let storyJpeg: DerivativeInfo | undefined
    if (isVertical) {
      const storyResize = { width: 1080, height: 1920, fit: "cover" as const, position: "attention" as const }
      const storyWebpBuf = await makeWebp(sharp(inputBuffer).rotate().resize(storyResize), qualityLarge).toBuffer()
      const storyJpegBuf = await makeJpeg(sharp(inputBuffer).rotate().resize(storyResize), qualityLarge).toBuffer()
      const storyWebpKey = `${keyBase}-story.webp`
      const storyJpegKey = `${keyBase}-story.jpg`
      const [storyWebpUrl, storyJpegUrl] = await Promise.all([
        uploadBuffer(s3, storyWebpKey, storyWebpBuf, "image/webp"),
        uploadBuffer(s3, storyJpegKey, storyJpegBuf, "image/jpeg"),
      ])
      storyWebp = { key: storyWebpKey, url: storyWebpUrl, width: 1080, height: 1920, format: "webp" }
      storyJpeg = { key: storyJpegKey, url: storyJpegUrl, width: 1080, height: 1920, format: "jpeg" }
    }

    // Thumbnails (9:16 crops): small 150x267, tiny 50x89
    const smallResize = { width: 150, height: 267, fit: "cover" as const, position: "attention" as const }
    const tinyResize = { width: 50, height: 89, fit: "cover" as const, position: "attention" as const }

    const [smWebpBuf, smJpegBuf, xsWebpBuf, xsJpegBuf] = await Promise.all([
      makeWebp(sharp(inputBuffer).rotate().resize(smallResize), qualityThumb).toBuffer(),
      makeJpeg(sharp(inputBuffer).rotate().resize(smallResize), qualityThumb).toBuffer(),
      makeWebp(sharp(inputBuffer).rotate().resize(tinyResize), qualityThumb).toBuffer(),
      makeJpeg(sharp(inputBuffer).rotate().resize(tinyResize), qualityThumb).toBuffer(),
    ])

    const smWebpKey = `${keyBase}-sm.webp`
    const smJpegKey = `${keyBase}-sm.jpg`
    const xsWebpKey = `${keyBase}-xs.webp`
    const xsJpegKey = `${keyBase}-xs.jpg`

    const [smWebpUrl, smJpegUrl, xsWebpUrl, xsJpegUrl] = await Promise.all([
      uploadBuffer(s3, smWebpKey, smWebpBuf, "image/webp"),
      uploadBuffer(s3, smJpegKey, smJpegBuf, "image/jpeg"),
      uploadBuffer(s3, xsWebpKey, xsWebpBuf, "image/webp"),
      uploadBuffer(s3, xsJpegKey, xsJpegBuf, "image/jpeg"),
    ])

    // Get actual optimized dimensions (after "inside" resize) to report accurately
    const optMeta = await sharp(optWebpBuf).metadata()
    const outWidth = optMeta.width || width
    const outHeight = optMeta.height || height

    const response: ProcessImageResponse = {
      ok: true,
      input: { bucket: BUCKET_NAME, key, width, height, isVertical },
      outputs: {
        optimized: {
          webp: { key: optWebpKey, url: optWebpUrl, width: outWidth, height: outHeight, format: "webp" },
          jpeg: { key: optJpegKey, url: optJpegUrl, width: outWidth, height: outHeight, format: "jpeg" },
        },
        ...(storyWebp && storyJpeg
          ? {
              story: {
                webp: storyWebp,
                jpeg: storyJpeg,
              },
            }
          : {}),
        thumbnails: {
          small: {
            webp: { key: smWebpKey, url: smWebpUrl, width: 150, height: 267, format: "webp" },
            jpeg: { key: smJpegKey, url: smJpegUrl, width: 150, height: 267, format: "jpeg" },
          },
          tiny: {
            webp: { key: xsWebpKey, url: xsWebpUrl, width: 50, height: 89, format: "webp" },
            jpeg: { key: xsJpegKey, url: xsJpegUrl, width: 50, height: 89, format: "jpeg" },
          },
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("process-image error", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

