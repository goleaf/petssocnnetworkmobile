import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { getServerUserById, serverUsernameExists, updateServerUser } from '@/lib/storage-server'
import { addServerUsernameHistory, isUsernameReservedWithinDays } from '@/lib/server-username-history'
import type { User } from '@/lib/types'
import { revalidatePath } from 'next/cache'

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const sessionUser = await getCurrentUser()
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = params.userId
    if (sessionUser.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => null as any)
    const newUsername: string = (body?.newUsername || '').trim()
    const password: string = body?.password || ''
    if (!newUsername || !password) {
      return NextResponse.json({ error: 'Missing newUsername or password' }, { status: 400 })
    }

    if (!USERNAME_REGEX.test(newUsername)) {
      return NextResponse.json({ error: 'Username must be 3-20 chars, letters, numbers, underscores or hyphens' }, { status: 400 })
    }

    // Validate password against stored user
    const user = getServerUserById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (!user.password || user.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Enforce cooldown
    const last = user.lastUsernameChangeAt ? new Date(user.lastUsernameChangeAt).getTime() : 0
    if (last) {
      const elapsed = Date.now() - last
      if (elapsed < THIRTY_DAYS_MS) {
        const daysLeft = Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000))
        return NextResponse.json({ error: `You can change username again in ${daysLeft} days`, daysLeft }, { status: 429 })
      }
    }

    // Availability check (race-safe)
    if (serverUsernameExists(newUsername)) {
      return NextResponse.json({ error: 'Username is taken' }, { status: 409 })
    }
    // Reserve window: 30 days
    if (isUsernameReservedWithinDays(newUsername, 30, userId)) {
      return NextResponse.json({ error: 'Username is reserved' }, { status: 409 })
    }
    const prev = user.username
    const changedAt = new Date().toISOString()
    // Update user
    const updates: Partial<User> = {
      username: newUsername,
      lastUsernameChangeAt: changedAt,
      usernameHistory: [
        ...(user.usernameHistory ?? []),
        { userId, previousUsername: prev, newUsername, changedAt },
      ] as any,
    }
    updateServerUser(userId, updates)

    // Add to global history
    addServerUsernameHistory({ userId, previousUsername: prev, newUsername, changedAt })

    // Background job placeholder: update posts/comments author usernames if denormalized (not required in this demo)
    // Invalidate cached paths
    try {
      revalidatePath(`/user/${prev}`)
      revalidatePath(`/user/${newUsername}`)
      revalidatePath(`/profile/${prev}`)
      revalidatePath(`/profile/${newUsername}`)
    } catch {}

    return NextResponse.json({ success: true, newUsername })
  } catch (e) {
    console.error('Username change error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
