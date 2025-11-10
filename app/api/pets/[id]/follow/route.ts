/**
 * POST /api/pets/[id]/follow - Follow/unfollow a pet
 * Requirements: 8.7, 8.8
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { getPetById, followPet, unfollowPet } from "@/lib/services/pet-service"
import { canViewPet } from "@/lib/utils/pet-privacy"
import { createNotification } from "@/lib/notifications"
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

    // Get pet
    const pet = await getPetById(petId)
    if (!pet) {
      return NextResponse.json({ error: "Pet not found" }, { status: 404 })
    }

    // Check if user can view this pet
    if (!canViewPet(pet, session.userId)) {
      return NextResponse.json(
        { error: "You don't have permission to view this pet" },
        { status: 403 }
      )
    }

    // Can't follow your own pet
    if (pet.ownerId === session.userId) {
      return NextResponse.json(
        { error: "You cannot follow your own pet" },
        { status: 400 }
      )
    }

    // Check if already following
    const followers = (pet.followers as string[]) || []
    const isFollowing = followers.includes(session.userId)

    if (isFollowing) {
      // Unfollow
      await unfollowPet(petId, session.userId)

      return NextResponse.json({
        success: true,
        action: "unfollowed",
        message: `You unfollowed ${pet.name}`,
      })
    } else {
      // Follow
      await followPet(petId, session.userId)

      // Get follower info for notification
      const follower = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          username: true,
          displayName: true,
        },
      })

      const followerName = follower?.displayName || follower?.username || "Someone"

      // Send notification to pet owner
      createNotification({
        userId: pet.ownerId,
        type: "follow",
        actorId: session.userId,
        targetId: petId,
        targetType: "pet",
        message: `${followerName} started following ${pet.name}`,
        priority: "low",
        category: "social",
        channels: ["in_app"],
        metadata: {
          actorName: followerName,
          petName: pet.name,
        },
      })

      return NextResponse.json({
        success: true,
        action: "followed",
        message: `You are now following ${pet.name}`,
      })
    }
  } catch (error) {
    console.error("Error following/unfollowing pet:", error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
