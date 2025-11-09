import { NextResponse, NextRequest } from 'next/server'
import { getServerUserByUsername } from '@/lib/storage-server'
import { getServerUsernameHistory } from '@/lib/server-username-history'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const segments = pathname.split('/') // ['', 'en', 'user', 'bob', 'edit']
  const findIndex = (key: string) => segments.findIndex((s) => s === key)

  let typeIndex = findIndex('user')
  if (typeIndex === -1) typeIndex = findIndex('profile')
  if (typeIndex === -1) {
    return NextResponse.next()
  }

  const usernameIndex = typeIndex + 1
  if (usernameIndex >= segments.length) {
    return NextResponse.next()
  }

  const username = segments[usernameIndex]
  if (!username) return NextResponse.next()

  // If current username exists, no redirect
  const existing = getServerUserByUsername(username)
  if (existing) {
    return NextResponse.next()
  }

  // Lookup recent rename (within 30 days)
  const history = getServerUsernameHistory()
  const record = history
    .filter((r) => r.previousUsername.toLowerCase() === username.toLowerCase())
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0]

  if (!record) return NextResponse.next()

  const changedAt = new Date(record.changedAt).getTime()
  if (Date.now() - changedAt > THIRTY_DAYS_MS) {
    // No longer redirect after 30 days
    return NextResponse.next()
  }

  // Redirect to new username, preserving route suffix and adding banner param
  const newSegments = [...segments]
  newSegments[usernameIndex] = record.newUsername
  const newPath = newSegments.join('/') || '/'
  const url = new URL(newPath + (search || ''), request.url)
  url.searchParams.set('renamed_from', username)
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: [
    '/user/:path*',
    '/profile/:path*',
    // Locale-prefixed
    '/:locale/user/:path*',
    '/:locale/profile/:path*',
  ],
}

