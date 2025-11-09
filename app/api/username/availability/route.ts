import { NextRequest, NextResponse } from 'next/server'
import { serverUsernameExists } from '@/lib/storage-server'
import { isUsernameReservedWithinDays } from '@/lib/server-username-history'

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = (searchParams.get('username') || '').trim()

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json({ available: false, reason: 'invalid' })
  }

  // Check current users
  if (serverUsernameExists(username)) {
    return NextResponse.json({ available: false, reason: 'taken' })
  }

  // Check 30-day reservation window
  if (isUsernameReservedWithinDays(username, 30)) {
    return NextResponse.json({ available: false, reason: 'reserved' })
  }

  return NextResponse.json({ available: true })
}
