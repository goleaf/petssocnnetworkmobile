/**
 * PATCH /api/pets/[id]/photos/reorder - Reorder pet photos
 * Requirements: 3.6
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth-server"
import { getPetById } from "@/lib/services/pet-service"
import { canEditPet } from "@/lib/utils/pet-privacy"
import {
  validatePhotoOrder,
  generatePhotoOrder,
} from "@/lib/services/photo-service"
import { prisma } from "@/lib/prisma"

const reorderSchema = z.object({
  photoIds: z.array(z.string()).min(1, "At least one photo ID is required"),
})

export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json()
    const { photoIds } = reorderSchema.parse(body)

    // Get existing photos
    const existingPhotos = await prisma.petPhoto.findMany({
      where: { petId },
      select: { id: true },
    })

    const existingPhotoIds = existingPhotos.map((p: { id: string }) => p.id)

    // Validate photo order
    const validation = validatePhotoOrder(photoIds, existingPhotoIds)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Generate new order values
    const orderMap = generatePhotoOrder(photoIds)

    // Update photo orders in database
    const updatePromises = photoIds.map((photoId, index) =>
      prisma.petPhoto.update({
        where: { id: photoId },
        data: { order: orderMap[photoId] },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: "Photos reordered successfully",
    })
  } catch (error) {
    console.error("Error reordering photos:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
