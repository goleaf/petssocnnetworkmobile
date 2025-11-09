import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { serverUsernameExists } from "@/lib/storage-server"

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")?.trim() || ""

  if (!username) {
    return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 })
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false, error: "Username must be 3-20 characters and can include letters, numbers, underscores, or hyphens." }, { status: 200 })
  }

  const exists = serverUsernameExists(username)
  return NextResponse.json({ available: !exists })
}
