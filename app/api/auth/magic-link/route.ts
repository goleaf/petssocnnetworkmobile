import { NextRequest, NextResponse } from "next/server"
import { issueMagicLink } from "@/lib/actions/auth"
import { magicLinkRequestSchema } from "@/lib/validations/auth"

/**
 * POST /api/auth/magic-link
 * Request a magic link for passwordless login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = magicLinkRequestSchema.parse(body)
    
    const result = await issueMagicLink(validated.email)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    // In production, never return the token to the client
    // For development, we return it for testing
    return NextResponse.json({
      success: true,
      message: "Magic link sent to your email",
      // Only return token in development
      ...(process.env.NODE_ENV === "development" && result.token ? { token: result.token } : {}),
    })
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to issue magic link" },
      { status: 500 }
    )
  }
}

