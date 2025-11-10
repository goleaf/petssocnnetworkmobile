/**
 * DELETE /api/pets/[id]/photo/[photoId] - Delete pet photo
 * Requirements: 3.6
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { getPetById } from "@/lib/services/pet-service"
import { canEditPet } from "@/lib/utils/pet-privacy"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: petId, photoId } = await params

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

    // Get photo
    const photo = await prisma.petPhoto.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    if (photo.petId !== petId) {
      return NextResponse.json(
        { error: "Photo does not belong to this pet" },
        { status: 400 }
      )
    }

    const wasPrimary = photo.isPrimary

    // Delete photo from database
    await prisma.petPhoto.delete({
      where: { id: photoId },
    })

    // If this was the primary photo, set another photo as primary
    if (wasPrimary) {
      const nextPhoto = await prisma.petPhoto.findFirst({
        where: { petId },
        orderBy: { order: "asc" },
      })

      if (nextPhoto) {
        await prisma.petPhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        })

        // Update pet's primary photo URL
        await prisma.pet.update({
          where: { id: petId },
          data: {
            primaryPhotoUrl: nextPhoto.url,
          },
        })
      } else {
        // No more photos, clear primary photo URL
        await prisma.pet.update({
          where: { id: petId },
          data: {
            primaryPhotoUrl: null,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting photo:", error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
