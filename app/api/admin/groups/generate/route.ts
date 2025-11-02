import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/admin/groups/generate
 * Generate many groups in the system
 * 
 * NOTE: This API route currently cannot work because groups are stored in localStorage (client-side only).
 * Use the admin page at /admin/groups/generate instead, which runs the generation client-side.
 * 
 * This endpoint is kept for future use when storage is migrated to server-side.
 * 
 * Query parameters:
 * - groupsPerAnimal: number (default: 50) - Number of groups per animal type
 * - animalType: string (optional) - Generate groups for specific animal type only
 * - count: number (optional) - Number of groups to generate (when animalType is specified)
 */
export async function POST(request: NextRequest) {
  // NOTE: Groups are stored in localStorage (client-side only)
  // This endpoint cannot work until storage is migrated to server-side
  return NextResponse.json(
    {
      error: "This endpoint requires client-side execution",
      message: "Groups are stored in localStorage. Please use the admin page at /admin/groups/generate instead.",
      redirect: "/admin/groups/generate",
    },
    { status: 400 }
  )
}

