/**
 * POST /api/pets/create - Create a new pet profile
 * Requirements: 1.1, 1.4, 1.5
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth-server"
import { createPet } from "@/lib/services/pet-service"
import { createPetSchema } from "@/lib/schemas/pet-schema"
import { checkUpdateRateLimit } from "@/lib/utils/pet-rate-limit"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
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
    const validatedData = createPetSchema.parse(body)

    // Get user info for slug generation
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { username: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create pet
    const pet = await createPet(session.userId, user.username, validatedData)

    return NextResponse.json(
      {
        success: true,
        pet: {
          id: pet.id,
          slug: pet.slug,
          name: pet.name,
          species: pet.species,
          primaryPhotoUrl: pet.primaryPhotoUrl,
        },
        message: "Pet profile created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating pet:", error)

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
