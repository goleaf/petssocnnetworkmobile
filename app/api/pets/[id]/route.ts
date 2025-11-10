/**
 * Pet API Routes
 * GET /api/pets/[id] - Get pet by ID with privacy checks
 * PATCH /api/pets/[id] - Update pet profile
 * DELETE /api/pets/[id] - Delete pet profile
 * Requirements: 1.4, 1.5, 7.3, 7.4, 8.1-8.8
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth-server"
import {
  getPetById,
  updatePet,
  deletePet,
  calculatePetStats,
} from "@/lib/services/pet-service"
import { updatePetSchema } from "@/lib/schemas/pet-schema"
import { canViewPet, canEditPet } from "@/lib/utils/pet-privacy"
import { checkUpdateRateLimit } from "@/lib/utils/pet-rate-limit"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/pets/[id] - Get pet profile with privacy checks
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get pet
    const pet = await getPetById(id)
    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    // Get current user session (optional for public pets)
    const session = await getSession()
    const viewerId = session?.userId || null

    // Check privacy permissions
    if (!canViewPet(pet, viewerId)) {
      return NextResponse.json(
        { error: "You don't have permission to view this pet" },
        { status: 403 }
      )
    }

    // Get owner information
    const owner = await prisma.user.findUnique({
      where: { id: pet.ownerId },
      select: {
        id: true,
        username: true,
        displayName: true,
        profilePhoto: true,
      },
    })

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 })
    }

    // Calculate stats
    const stats = await calculatePetStats(id)

    // Check permissions
    const canEdit = viewerId ? canEditPet(pet, viewerId) : false
    const canFollow = viewerId ? viewerId !== pet.ownerId : false
    const isFollowing = viewerId
      ? (pet.followers as string[])?.includes(viewerId)
      : false

    return NextResponse.json({
      success: true,
      pet,
      owner,
      stats,
      permissions: {
        canEdit,
        canFollow,
        isFollowing,
      },
    })
  } catch (error) {
    console.error("Error fetching pet:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/pets/[id] - Update pet profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get authenticated user
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = checkUpdateRateLimit(session.userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updatePetSchema.parse(body)

    // Update pet (permission check is done inside updatePet)
    const updatedPet = await updatePet(id, session.userId, validatedData)

    return NextResponse.json({
      success: true,
      pet: updatedPet,
      message: "Pet profile updated successfully",
    })
  } catch (error) {
    console.error("Error updating pet:", error)

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
      if (error.message === "Pet not found") {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message === "Unauthorized to edit this pet") {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pets/[id] - Delete pet profile (soft delete with cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get authenticated user
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete pet (permission check is done inside deletePet)
    // This will soft delete the pet and cascade to related records
    await deletePet(id, session.userId)

    return NextResponse.json({
      success: true,
      message: "Pet profile deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting pet:", error)

    if (error instanceof Error) {
      if (error.message === "Pet not found") {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message === "Unauthorized to delete this pet") {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
