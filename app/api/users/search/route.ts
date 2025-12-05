import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { getServerUsers } from "@/lib/storage-server"

/**
 * GET /api/users/search
 * Search users for mentions (followers and friends)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "10", 10)

    const users = getServerUsers()
    const currentUser = users.find((u) => u.id === session.user.id)

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get followers and following (friends are mutual follows)
    const followers = new Set(currentUser.followers || [])
    const following = new Set(currentUser.following || [])
    const blockedUsers = new Set(currentUser.blockedUsers || [])
    const mutedUsers = new Set(currentUser.mutedUsers || [])

    // Filter users: followers, following, or mutual friends
    let filteredUsers = users.filter((user) => {
      // Exclude self
      if (user.id === session.user.id) return false
      
      // Exclude blocked and muted users
      if (blockedUsers.has(user.id) || mutedUsers.has(user.id)) return false
      
      // Exclude users who have disabled search visibility
      if (user.showInSearch === false) return false
      
      // Include if they're a follower or we're following them
      return followers.has(user.id) || following.has(user.id)
    })

    // Apply search query if provided
    if (query.trim()) {
      const lowerQuery = query.toLowerCase().trim()
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(lowerQuery) ||
          user.fullName.toLowerCase().includes(lowerQuery)
      )
    }

    // Sort by relevance: mutual friends first, then by username
    filteredUsers.sort((a, b) => {
      const aIsMutual = followers.has(a.id) && following.has(a.id)
      const bIsMutual = followers.has(b.id) && following.has(b.id)
      
      if (aIsMutual && !bIsMutual) return -1
      if (!aIsMutual && bIsMutual) return 1
      
      return a.username.localeCompare(b.username)
    })

    // Limit results
    const results = filteredUsers.slice(0, limit).map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar,
    }))

    return NextResponse.json({ users: results })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    )
  }
}
