import { NextRequest, NextResponse } from "next/server"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
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

  // Optional: Custom endpoint for S3-compatible services
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
const DOWNLOAD_EXPIRATION = 3600 // 1 hour in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileUrl } = body

    if (!fileUrl) {
      return NextResponse.json(
        { error: "Missing required field: fileUrl" },
        { status: 400 }
      )
    }

    // Extract file path from URL
    let filePath: string
    try {
      // Handle different URL formats
      if (fileUrl.includes(`/${BUCKET_NAME}/`)) {
        filePath = fileUrl.split(`/${BUCKET_NAME}/`)[1]
      } else if (fileUrl.includes("s3.amazonaws.com/")) {
        filePath = fileUrl.split("s3.amazonaws.com/")[1]
      } else if (process.env.AWS_ENDPOINT && fileUrl.includes(process.env.AWS_ENDPOINT)) {
        filePath = fileUrl.replace(`${process.env.AWS_ENDPOINT}/${BUCKET_NAME}/`, "")
      } else {
        // Assume it's already a file path
        filePath = fileUrl
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid file URL format" },
        { status: 400 }
      )
    }

    // Create S3 client and command
    const s3Client = getS3Client()
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    })

    // Generate signed download URL
    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: DOWNLOAD_EXPIRATION,
    })

    return NextResponse.json({
      downloadUrl,
      expiresIn: DOWNLOAD_EXPIRATION,
    })
  } catch (error) {
    console.error("Error generating download URL:", error)
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    )
  }
}

