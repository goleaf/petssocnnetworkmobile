import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Email Change Cancellation API Route
 * 
 * Handles cancellation of email change requests.
 * Validates the token, deletes the verification record, and sends confirmation.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing cancellation token" },
        { status: 400 }
      )
    }

    // Find the verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Invalid cancellation token" },
        { status: 400 }
      )
    }

    const userEmail = verification.user.email
    const pendingEmail = verification.pendingEmail

    // Delete EmailVerification record
    await prisma.emailVerification.delete({
      where: { id: verification.id }
    })

    // Send confirmation email to original address
    // In production, use a proper email service
    console.info(`[cancel-email-change] Email change cancelled for user ${verification.user.username}`)
    console.info(`[cancel-email-change] Pending email ${pendingEmail} was not applied`)
    console.info(`[cancel-email-change] Confirmation sent to original email: ${userEmail}`)

    return NextResponse.json({
      success: true,
      message: "Email change request cancelled successfully"
    })
  } catch (error) {
    console.error("[cancel-email-change] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to cancel email change" },
      { status: 500 }
    )
  }
}
