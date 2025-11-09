import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { broadcastEvent } from '@/lib/server/sse'

export const runtime = 'nodejs'

function getEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback
}

function getS3Client() {
  const config: any = {
    region: getEnv('AWS_REGION', 'us-east-1'),
  }
  const endpoint = getEnv('AWS_ENDPOINT')
  if (endpoint) {
    config.endpoint = endpoint
    config.forcePathStyle = true
  }
  const accessKeyId = getEnv('AWS_ACCESS_KEY_ID')
  const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY')
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey }
  }
  return new S3Client(config)
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'pet-social-network'

async function scanImageModeration(_buf: Buffer): Promise<{ safe: boolean; reason?: string }> {
  // Placeholder for antivirus/inappropriate content scanning.
  // Integrate providers like AWS Rekognition, Google Vision, or others here.
  return { safe: true }
}

async function ensureSharp(): Promise<typeof import('sharp') | null> {
  try {
    const sharp = (await import('sharp')).default
    return sharp
  } catch {
    return null
  }
}

async function resizeVariants(buffer: Buffer): Promise<{
  original: Buffer
  large: Buffer
  medium: Buffer
  small: Buffer
  thumbnail: Buffer
  contentType: string
}> {
  const sharp = await ensureSharp()
  const contentType = 'image/jpeg'
  if (!sharp) {
    // Fallback: return the same buffer for all sizes
    return { original: buffer, large: buffer, medium: buffer, small: buffer, thumbnail: buffer, contentType }
  }
  const toJpeg = (s: number) => sharp(buffer).resize({ width: s, height: s, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()
  const original = await sharp(buffer).resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer()
  const [large, medium, small, thumbnail] = await Promise.all([
    toJpeg(400),
    toJpeg(200),
    toJpeg(100),
    toJpeg(50),
  ])
  return { original, large, medium, small, thumbnail, contentType }
}

async function putToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = getS3Client()
  await client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: body, ContentType: contentType }))
  // Construct public URL via AWS_S3_PUBLIC_URL if provided, else default S3 URL
  const publicBase = process.env.AWS_S3_PUBLIC_URL
  if (publicBase) return `${publicBase}/${key}`
  const region = process.env.AWS_REGION || 'us-east-1'
  const endpoint = process.env.AWS_ENDPOINT
  if (endpoint) return `${endpoint}/${BUCKET_NAME}/${key}`
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
}

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const form = await request.formData()
    const file = form.get('photo') as unknown as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file: photo' }, { status: 400 })
    }

    const contentType = file.type || 'application/octet-stream'
    if (!/^image\/(jpeg|png|webp|jpg)$/i.test(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const MAX_BYTES = 10 * 1024 * 1024
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
    }

    // Scan content (placeholder)
    const scan = await scanImageModeration(buffer)
    if (!scan.safe) {
      return NextResponse.json({ error: scan.reason || 'Inappropriate content detected' }, { status: 422 })
    }

    // Generate variants
    const { original, large, medium, small, thumbnail, contentType: outType } = await resizeVariants(buffer)
    const ts = Date.now()
    const baseKey = `users/${userId}/profile/${ts}`

    const [originalUrl, largeUrl, mediumUrl, smallUrl, thumbnailUrl] = await Promise.all([
      putToS3(`${baseKey}/original.jpg`, original, outType),
      putToS3(`${baseKey}/large.jpg`, large, outType),
      putToS3(`${baseKey}/medium.jpg`, medium, outType),
      putToS3(`${baseKey}/small.jpg`, small, outType),
      putToS3(`${baseKey}/thumb.jpg`, thumbnail, outType),
    ])

    // Cache-bust query param
    const bust = `?v=${ts}`
    const urls = {
      original: `${originalUrl}${bust}`,
      large: `${largeUrl}${bust}`,
      medium: `${mediumUrl}${bust}`,
      small: `${smallUrl}${bust}`,
      thumbnail: `${thumbnailUrl}${bust}`,
    }

    // Broadcast to SSE listeners
    broadcastEvent({
      type: 'profilePhotoUpdated',
      userId,
      largeUrl: urls.large,
      allSizes: urls,
      ts,
    })

    // Return URLs; updating user record is done client-side in this demo app
    return NextResponse.json({
      profilePhotoUrl: urls.large,
      urls,
    })
  } catch (error) {
    console.error('Profile photo upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
