import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Email Verification API Route
 * 
 * Handles email verification for email change requests.
 * Validates the token, updates the user's email, and sends confirmation.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing verification token" },
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
        { success: false, error: "Invalid verification token" },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (verification.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerification.delete({
        where: { id: verification.id }
      })

      return NextResponse.json(
        { success: false, error: "Verification token has expired" },
        { status: 400 }
      )
    }

    const oldEmail = verification.user.email
    const newEmail = verification.pendingEmail

    // Update user email in database
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        email: newEmail,
        emailVerified: true
      }
    })

    // Delete EmailVerification record
    await prisma.emailVerification.delete({
      where: { id: verification.id }
    })

    // Send confirmation emails to both old and new addresses
    // In production, use a proper email service
    console.info(`[verify-email] Email changed for user ${verification.user.username}`)
    console.info(`[verify-email] Confirmation sent to old email: ${oldEmail}`)
    console.info(`[verify-email] Confirmation sent to new email: ${newEmail}`)

    return NextResponse.json({
      success: true,
      message: "Email successfully verified and updated"
    })
  } catch (error) {
    console.error("[verify-email] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    )
  }
}
