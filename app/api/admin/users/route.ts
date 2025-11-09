import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/auth-server"
import { getServerUsers } from "@/lib/storage-server"
import type { User, UserRole, UserStatus } from "@/lib/types"

/**
 * GET /api/admin/users
 * Returns paginated list of users with search and filters
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin permission
    const currentUser = await getCurrentUser()
    if (!currentUser || !(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      )
    }

    const url = new URL((request as any).url || 'http://localhost')
    const searchParams = (request as any).nextUrl?.searchParams || url.searchParams
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Get all users
    let users = getServerUsers()

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchLower) ||
          user.handle?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.fullName?.toLowerCase().includes(searchLower)
      )
    }

    // Apply role filter
    if (role) {
      users = users.filter((user) => {
        const userRoles = user.roles || (user.role ? [user.role] : [])
        return userRoles.includes(role as UserRole)
      })
    }

    // Apply status filter
    if (status) {
      users = users.filter((user) => user.status === (status as UserStatus))
    }

    // Apply sorting
    users.sort((a, b) => {
      let aValue: string | number | undefined
      let bValue: string | number | undefined

      switch (sortBy) {
        case "id":
          aValue = a.id
          bValue = b.id
          break
        case "handle":
          aValue = a.handle || a.username
          bValue = b.handle || b.username
          break
        case "email":
          aValue = a.email
          bValue = b.email
          break
        case "reputation":
          aValue = a.reputation || 0
          bValue = b.reputation || 0
          break
        case "strikes":
          aValue = a.strikes || 0
          bValue = b.strikes || 0
          break
        case "status":
          aValue = a.status || "active"
          bValue = b.status || "active"
          break
        case "createdAt":
          aValue = a.createdAt || a.joinedAt
          bValue = b.createdAt || b.joinedAt
          break
        case "lastSeen":
          aValue = a.lastSeen || ""
          bValue = b.lastSeen || ""
          break
        default:
          aValue = a.createdAt || a.joinedAt
          bValue = b.createdAt || b.joinedAt
      }

      if (aValue === undefined) return 1
      if (bValue === undefined) return -1

      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue))

      return sortOrder === "asc" ? comparison : -comparison
    })

    // Apply pagination
    const total = users.length
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = users.slice(start, end)

    // Format response
    const formattedUsers = paginatedUsers.map((user) => ({
      id: user.id,
      handle: user.handle || user.username,
      email: user.email,
      roles: user.roles || (user.role ? [user.role] : []),
      reputation: user.reputation || 0,
      strikes: user.strikes || 0,
      status: user.status || "active",
      createdAt: user.createdAt || user.joinedAt,
      lastSeen: user.lastSeen || null,
      moderationCaseId: user.moderationCaseId || null,
    }))

    return NextResponse.json(
      {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
