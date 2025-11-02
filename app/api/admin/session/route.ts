import { NextResponse } from "next/server"
import { getCurrentUser, getSession } from "@/lib/auth-server"
import crypto from "crypto"

/**
 * GET /api/admin/session
 * Returns user session data with roles array and CSRF token for client-side role checks
 * 
 * Security:
 * - Same-origin only (default browser security)
 * - Cache-Control: no-store to prevent caching
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    const session = await getSession()
    
    if (!user || !session) {
      return NextResponse.json(
        { user: null, csrfToken: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      )
    }

    // Generate CSRF token based on session
    const csrfToken = session.userId + "-" + crypto.randomBytes(16).toString("hex")

    // Return user data with roles array
    const response = {
      user: {
        id: user.id,
        email: user.email,
        roles: [user.role || "user"], // Convert single role to array
      },
      csrfToken,
    }
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error getting admin session:", error)
    return NextResponse.json(
      { user: null, csrfToken: null },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}

