import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { broadcastEvent } from '@/lib/server/sse'
import { deleteCached } from '@/lib/scalability/cache-layer'
import { getServerUserById, updateServerUser } from '@/lib/storage-server'
import { computeProfileCompletionForServer } from '@/lib/utils/profile-compute'

export const runtime = 'nodejs'

function getS3Client() {
  const config: any = { region: process.env.AWS_REGION || 'us-east-1' }
  if (process.env.AWS_ENDPOINT) { config.endpoint = process.env.AWS_ENDPOINT; config.forcePathStyle = true }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
  }
  return new S3Client(config)
}
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'pet-social-network'

async function ensureSharp(): Promise<typeof import('sharp') | null> {
  try { return (await import('sharp')).default } catch { return null }
}

async function scanImageModeration(_buf: Buffer): Promise<{ safe: boolean; reason?: string }> {
  // Placeholder hook: integrate AWS Rekognition/Google Vision provider here for production
  return { safe: true }
}

async function resizeVariants(buffer: Buffer): Promise<{ original: Buffer; large: Buffer; medium: Buffer; small: Buffer; contentType: string }> {
  const sharp = await ensureSharp()
  const contentType = 'image/jpeg'
  if (!sharp) { return { original: buffer, large: buffer, medium: buffer, small: buffer, contentType } }
  const original = await sharp(buffer).resize({ width: 2000, height: 667, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer()
  const large = await sharp(buffer).resize({ width: 1200, height: 400, fit: 'cover', position: 'centre' }).jpeg({ quality: 88 }).toBuffer()
  const medium = await sharp(buffer).resize({ width: 900, height: 300, fit: 'cover', position: 'centre' }).jpeg({ quality: 88 }).toBuffer()
  const small = await sharp(buffer).resize({ width: 600, height: 200, fit: 'cover', position: 'centre' }).jpeg({ quality: 88 }).toBuffer()
  return { original, large, medium, small, contentType }
}

async function putToS3(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = getS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
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
    if (!file) return NextResponse.json({ error: 'Missing file: photo' }, { status: 400 })

    const contentType = file.type || 'application/octet-stream'
    if (!/^image\/(jpeg|png|webp|jpg)$/i.test(contentType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const MAX_BYTES = 15 * 1024 * 1024
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 })
    }

    // Optional moderation scan hook
    const scan = await scanImageModeration(buffer)
    if (!scan.safe) {
      return NextResponse.json({ error: scan.reason || 'Inappropriate content detected' }, { status: 422 })
    }

    // Resize variants
    const { original, large, medium, small, contentType: outType } = await resizeVariants(buffer)
    const ts = Date.now()
    const baseKey = `users/${userId}/cover/${ts}`
    const [originalUrl, largeUrl, mediumUrl, smallUrl] = await Promise.all([
      putToS3(`${baseKey}/original.jpg`, original, outType),
      putToS3(`${baseKey}/large.jpg`, large, outType),
      putToS3(`${baseKey}/medium.jpg`, medium, outType),
      putToS3(`${baseKey}/small.jpg`, small, outType),
    ])
    const bust = `?v=${ts}`
    const urls = { original: `${originalUrl}${bust}`, large: `${largeUrl}${bust}`, medium: `${mediumUrl}${bust}`, small: `${smallUrl}${bust}` }

    // Update cached completion (cover affects it)
    const u = getServerUserById(userId)
    if (u) updateServerUser(userId, { cachedCompletionPercent: computeProfileCompletionForServer({ ...(u as any), coverPhoto: urls.large } as any) } as any)
    broadcastEvent({ type: 'coverPhotoUpdated', userId, largeUrl: urls.large, allSizes: urls, ts })
    try { await deleteCached(`profile:${userId}`) } catch {}

    return NextResponse.json({ coverPhotoUrl: urls.large, urls })
  } catch (error) {
    console.error('Cover photo upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
