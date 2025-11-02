/**
 * Admin Wiki Revision Detail API
 * 
 * GET: Get flagged revision details
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const flaggedRevision = await prisma.flaggedRevision.findUnique({
      where: { id },
    })

    if (!flaggedRevision) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(flaggedRevision)
  } catch (error) {
    console.error('Error fetching flagged revision:', error)
    return NextResponse.json(
      { error: 'Failed to fetch flagged revision' },
      { status: 500 }
    )
  }
}
