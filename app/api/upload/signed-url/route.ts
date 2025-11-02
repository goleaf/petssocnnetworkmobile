import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Initialize S3 client
function getS3Client() {
  const config: {
    region: string
    endpoint?: string
    credentials?: {
      accessKeyId: string
      secretAccessKey: string
    }
    forcePathStyle?: boolean
  } = {
    region: process.env.AWS_REGION || "us-east-1",
  }

  // Optional: Custom endpoint for S3-compatible services (e.g., DigitalOcean Spaces, MinIO)
  if (process.env.AWS_ENDPOINT) {
    config.endpoint = process.env.AWS_ENDPOINT
    config.forcePathStyle = true
  }

  // Credentials (optional if using IAM roles)
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  }

  return new S3Client(config)
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "pet-social-network"
const UPLOAD_EXPIRATION = 3600 // 1 hour in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileName, fileType, fileSize, folder = "articles" } = body

    // Validation
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    // Generate file path
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${folder}/${timestamp}-${sanitizedFileName}`

    // Create S3 client and command
    const s3Client = getS3Client()
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      ContentType: fileType,
      // Optional: Add metadata
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    })

    // Generate signed URL
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: UPLOAD_EXPIRATION,
    })

    // Generate the final file URL (public or signed download URL)
    let fileUrl: string
    if (process.env.AWS_S3_PUBLIC_URL) {
      // Use custom public URL (e.g., CDN)
      fileUrl = `${process.env.AWS_S3_PUBLIC_URL}/${filePath}`
    } else if (process.env.AWS_ENDPOINT) {
      // Use custom endpoint URL
      fileUrl = `${process.env.AWS_ENDPOINT}/${BUCKET_NAME}/${filePath}`
    } else {
      // Standard S3 URL
      fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${filePath}`
    }

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      expiresIn: UPLOAD_EXPIRATION,
    })
  } catch (error) {
    console.error("Error generating signed URL:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}

