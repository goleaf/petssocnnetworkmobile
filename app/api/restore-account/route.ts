import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token || token.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Missing token" },
        { status: 400 }
      )
    }

    // Validate restore token
    const restoreRecord = await prisma.deletionRestoreToken.findUnique({
      where: { token: token.trim() }
    })

    if (!restoreRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired restore token" },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (restoreRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.deletionRestoreToken.delete({
        where: { id: restoreRecord.id }
      })
      
      return NextResponse.json(
        { success: false, error: "Restore token has expired" },
        { status: 410 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: restoreRecord.userId },
      select: { id: true, email: true, deletionScheduledAt: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // Clear deletionScheduledAt and deletionReason fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletionScheduledAt: null,
        deletionReason: null
      }
    })

    // Delete the restore token (one-time use)
    await prisma.deletionRestoreToken.delete({
      where: { id: restoreRecord.id }
    })

    // Send confirmation email
    console.info(`[account] Account restored for ${user.email}. Deletion cancelled.`)

    return NextResponse.json({
      success: true,
      message: "Account successfully restored"
    })
  } catch (error) {
    console.error("[account] Error restoring account:", error)
    return NextResponse.json(
      { success: false, error: "Failed to restore account" },
      { status: 500 }
    )
  }
}
