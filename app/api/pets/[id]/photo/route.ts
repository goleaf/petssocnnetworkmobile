/**
 * POST /api/pets/[id]/photo - Upload pet photo
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { getPetById } from "@/lib/services/pet-service"
import { canEditPet } from "@/lib/utils/pet-privacy"
import { checkUploadRateLimit } from "@/lib/utils/pet-rate-limit"
import { uploadPhoto, PHOTO_CONSTANTS } from "@/lib/services/photo-service"
import { prisma } from "@/lib/prisma"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: petId } = await params

    // Get authenticated user
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkUploadRateLimit(session.userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil(rateLimit.retryAfterMs / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      )
    }

    // Get pet and check permissions
    const pet = await getPetById(petId)
    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    if (!canEditPet(pet, session.userId)) {
      return NextResponse.json(
        { error: "You don't have permission to edit this pet" },
        { status: 403 }
      )
    }

    // Get existing photo count
    const existingPhotoCount = await prisma.petPhoto.count({
      where: { petId },
    })

    if (existingPhotoCount >= PHOTO_CONSTANTS.MAX_PHOTOS_PER_PET) {
      return NextResponse.json(
        {
          error: `Maximum ${PHOTO_CONSTANTS.MAX_PHOTOS_PER_PET} photos allowed per pet`,
        },
        { status: 400 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const caption = formData.get("caption") as string | null
    const isPrimary = formData.get("isPrimary") === "true"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Convert File to Buffer for processing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process photo
    const { processed } = await uploadPhoto(
      {
        file: buffer,
        petId,
        caption: caption || undefined,
        isPrimary,
      },
      existingPhotoCount
    )

    // Generate URLs for the processed images
    // In a real implementation, these would be uploaded to cloud storage
    // For now, we'll use placeholder URLs that would be replaced by actual storage URLs
    const timestamp = Date.now()
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "https://storage.example.com"
    
    const thumbnailUrl = `${baseUrl}/pets/${petId}/photos/thumbnail-${timestamp}.jpg`
    const mediumUrl = `${baseUrl}/pets/${petId}/photos/medium-${timestamp}.jpg`
    const largeUrl = `${baseUrl}/pets/${petId}/photos/large-${timestamp}.jpg`
    const thumbnailWebpUrl = `${baseUrl}/pets/${petId}/photos/thumbnail-${timestamp}.webp`
    const mediumWebpUrl = `${baseUrl}/pets/${petId}/photos/medium-${timestamp}.webp`
    const largeWebpUrl = `${baseUrl}/pets/${petId}/photos/large-${timestamp}.webp`

    // TODO: Upload processed buffers to actual storage
    // This would involve calling your storage service (S3, Cloudinary, etc.)
    // For example:
    // await uploadBufferToStorage(processed.sizes.thumbnail.jpeg, thumbnailUrl)
    // await uploadBufferToStorage(processed.sizes.medium.jpeg, mediumUrl)
    // etc.

    // If this is set as primary, unset other primary photos
    if (isPrimary) {
      await prisma.petPhoto.updateMany({
        where: {
          petId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    // Get next order value
    const maxOrder = await prisma.petPhoto.findFirst({
      where: { petId },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const nextOrder = (maxOrder?.order ?? -1) + 1

    // Create photo record in database
    const photo = await prisma.petPhoto.create({
      data: {
        petId,
        url: largeUrl,
        thumbnailUrl,
        mediumUrl,
        largeUrl,
        webpThumbnailUrl: thumbnailWebpUrl,
        webpMediumUrl: mediumWebpUrl,
        webpLargeUrl: largeWebpUrl,
        caption: caption || null,
        isPrimary: isPrimary || existingPhotoCount === 0, // First photo is always primary
        order: nextOrder,
      },
    })

    // Update pet's primary photo URL if this is primary
    if (photo.isPrimary) {
      await prisma.pet.update({
        where: { id: petId },
        data: {
          primaryPhotoUrl: largeUrl,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        photo: {
          id: photo.id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          mediumUrl: photo.mediumUrl,
          largeUrl: photo.largeUrl,
          webpUrls: {
            thumbnail: photo.webpThumbnailUrl,
            medium: photo.webpMediumUrl,
            large: photo.webpLargeUrl,
          },
          caption: photo.caption,
          isPrimary: photo.isPrimary,
          order: photo.order,
        },
        message: "Photo uploaded successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error uploading photo:", error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
