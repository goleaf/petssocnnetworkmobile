import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-server"

/**
 * GET /api/auth/session
 * Get current user session (for client-side use)
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

