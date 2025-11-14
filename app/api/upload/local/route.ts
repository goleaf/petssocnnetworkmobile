import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "articles"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only image and video files are allowed" },
        { status: 400 }
      )
    }

    // Validate file size
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024
    if ((isImage && file.size > MAX_IMAGE_SIZE) || (isVideo && file.size > MAX_VIDEO_SIZE)) {
      return NextResponse.json(
        { error: isImage ? "Image size must be less than 10MB" : "Video size must be less than 100MB" },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split(".").pop() || "jpg"
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${randomStr}-${sanitizedName}`

    // Save file
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const fileUrl = `/uploads/${folder}/${fileName}`

    return NextResponse.json({
      url: fileUrl,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
