import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import { broadcastEvent } from '@/lib/server/sse'
import { getServerUserById, updateServerUser } from '@/lib/storage-server'
import { deleteCached } from '@/lib/scalability/cache-layer'
import { computeProfileCompletionForServer } from '@/lib/utils/profile-compute'

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
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  // Construct public URL via AWS_S3_PUBLIC_URL if provided, else default S3 URL
  const publicBase = process.env.AWS_S3_PUBLIC_URL
  if (publicBase) return `${publicBase}/${key}`
  const region = process.env.AWS_REGION || 'us-east-1'
  const endpoint = process.env.AWS_ENDPOINT
  if (endpoint) return `${endpoint}/${BUCKET_NAME}/${key}`
  return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`
}

export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params
    // Best-effort lookup for previous avatar cleanup; may be undefined for new users
    const existingUser = getServerUserById(userId)
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
      putToS3(`${baseKey}_original.jpg`, original, outType),
      putToS3(`${baseKey}_large.jpg`, large, outType),
      putToS3(`${baseKey}_medium.jpg`, medium, outType),
      putToS3(`${baseKey}_small.jpg`, small, outType),
      putToS3(`${baseKey}_thumb.jpg`, thumbnail, outType),
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

    // Update user record with new large avatar URL (canonical)
    const updatedAvatar = `${largeUrl}${bust}`
    const u = getServerUserById(userId)
    updateServerUser(userId, { avatar: updatedAvatar, cachedCompletionPercent: u ? computeProfileCompletionForServer({ ...(u as any), avatar: updatedAvatar } as any) : undefined } as any)
    try { await deleteCached(`profile:${userId}`) } catch {}

    // Attempt to delete previous avatar objects if they match expected path
    try {
      const prev = existingUser?.avatar
      if (prev) {
        const client = getS3Client()
        const keyFromUrl = (u: string) => {
          try {
            const url = new URL(u)
            const pathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
            return pathname
          } catch {
            // handle path-like endpoint style
            return u.replace(/^https?:\/\//, '').replace(/^.*?\//, '')
          }
        }
        const prevPath = keyFromUrl(prev)
        // Support both folder-style and underscore-style keys
        const matchUnderscore = prevPath.match(/^(.*\/users\/[^/]+\/profile\/)\d+_(original|large|medium|small|thumb)\.jpg/)
        const matchFolder = prevPath.match(/^(.*\/users\/[^/]+\/profile\/)\d+\/(original|large|medium|small|thumb)\.jpg/)
        let prefix = ''
        if (matchUnderscore) {
          // strip trailing size segment
          prefix = prevPath.replace(/_(original|large|medium|small|thumb)\.jpg.*$/, '')
        } else if (matchFolder) {
          prefix = prevPath.replace(/\/(original|large|medium|small|thumb)\.jpg.*$/, '')
        }
        if (prefix) {
          const keys = [
            `${prefix}_original.jpg`,
            `${prefix}_large.jpg`,
            `${prefix}_medium.jpg`,
            `${prefix}_small.jpg`,
            `${prefix}_thumb.jpg`,
            // legacy folder-style fallbacks
            `${prefix}/original.jpg`,
            `${prefix}/large.jpg`,
            `${prefix}/medium.jpg`,
            `${prefix}/small.jpg`,
            `${prefix}/thumb.jpg`,
          ]
          await Promise.all(
            keys.map((Key) =>
              client
                .send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key }))
                .catch(() => undefined),
            ),
          )
        }
      }
    } catch {}

    // Broadcast to SSE listeners
    broadcastEvent({
      type: 'profilePhotoUpdated',
      userId,
      largeUrl: urls.large,
      allSizes: urls,
      ts,
    })

    // Return URLs
    return NextResponse.json({ profilePhotoUrl: urls.large, urls })
  } catch (error) {
    console.error('Profile photo upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await context.params
    const viewer = await getCurrentUser()
    if (!viewer || viewer.id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }
    const user = getServerUserById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Archive previous avatar variants if present
    const prev = user.avatar
    const client = getS3Client()
    let archivedUrls: string[] = []
    if (prev) {
      const keyFromUrl = (u: string) => {
        try {
          const url = new URL(u)
          const pathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
          return pathname
        } catch {
          return u.replace(/^https?:\/\//, '').replace(/^.*?\//, '')
        }
      }
      const prevPath = keyFromUrl(prev)
      const matchUnderscore = prevPath.match(/^(.*\/users\/[^/]+\/profile\/)\d+_(original|large|medium|small|thumb)\.jpg/)
      const matchFolder = prevPath.match(/^(.*\/users\/[^/]+\/profile\/)\d+\/(original|large|medium|small|thumb)\.jpg/)
      let prefix = ''
      let isFolder = false
      if (matchUnderscore) {
        prefix = prevPath.replace(/_(original|large|medium|small|thumb)\.jpg.*$/, '')
        isFolder = false
      } else if (matchFolder) {
        prefix = prevPath.replace(/\/(original|large|medium|small|thumb)\.jpg.*$/, '')
        isFolder = true
      }
      if (prefix) {
        const ts = Date.now()
        const sizes = ['original','large','medium','small','thumb']
        const keys = isFolder
          ? sizes.map((s) => `${prefix}/${s}.jpg`)
          : sizes.map((s) => `${prefix}_${s}.jpg`)
        // Copy to archive and then delete originals
        const archiveBase = `archive/users/${userId}/profile/${ts}`
        await Promise.all(
          keys.map(async (Key, idx) => {
            const destKey = `${archiveBase}_${sizes[idx]}.jpg`
            try {
              await client.send(new CopyObjectCommand({ Bucket: BUCKET_NAME, CopySource: `${BUCKET_NAME}/${Key}`, Key: destKey }))
              archivedUrls.push(process.env.AWS_S3_PUBLIC_URL ? `${process.env.AWS_S3_PUBLIC_URL}/${destKey}` : (process.env.AWS_ENDPOINT ? `${process.env.AWS_ENDPOINT}/${BUCKET_NAME}/${destKey}` : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${destKey}`))
            } catch {}
            try { await client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key })) } catch {}
          })
        )
      }
    }

    // Generate default avatar (SVG with first initial)
    const initial = (user.fullName || user.username || 'U').trim().charAt(0).toUpperCase() || 'U'
    const bg = '#e5e7eb' // gray-200
    const fg = '#111827' // gray-900
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">\n  <rect width="400" height="400" fill="${bg}"/>\n  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="180" fill="${fg}">${initial}</text>\n</svg>`
    const buf = Buffer.from(svg, 'utf-8')
    const ts = Date.now()
    const defKey = `users/${userId}/profile/default_${ts}.svg`
    const client2 = getS3Client()
    await client2.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: defKey, Body: buf, ContentType: 'image/svg+xml' }))
    const defaultUrl = process.env.AWS_S3_PUBLIC_URL
      ? `${process.env.AWS_S3_PUBLIC_URL}/${defKey}`
      : (process.env.AWS_ENDPOINT ? `${process.env.AWS_ENDPOINT}/${BUCKET_NAME}/${defKey}` : `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${defKey}`)

    // Update user avatar to default and refresh cached completion
    const u2 = getServerUserById(userId)
    updateServerUser(userId, { avatar: defaultUrl, cachedCompletionPercent: u2 ? computeProfileCompletionForServer({ ...(u2 as any), avatar: defaultUrl } as any) : undefined } as any)

    // Broadcast event so clients update immediately
    broadcastEvent({ type: 'profilePhotoUpdated', userId, largeUrl: defaultUrl, allSizes: { original: defaultUrl, large: defaultUrl, medium: defaultUrl, small: defaultUrl, thumbnail: defaultUrl }, ts })

    // Invalidate profile cache
    try { await deleteCached(`profile:${userId}`) } catch {}

    return NextResponse.json({ profilePhotoUrl: defaultUrl, archived: archivedUrls })
  } catch (error) {
    console.error('Profile photo delete failed', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
