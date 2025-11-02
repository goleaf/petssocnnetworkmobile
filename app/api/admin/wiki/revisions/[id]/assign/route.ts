/**
 * Admin Wiki Revision Assign API
 * 
 * POST: Assign revision to expert
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { expertId } = await req.json()

    if (!expertId) {
      return NextResponse.json({ error: 'Expert ID required' }, { status: 400 })
    }

    // Verify expert exists and is verified
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
    })

    if (!expertProfile || expertProfile.status !== 'verified') {
      return NextResponse.json({ error: 'Expert not found or not verified' }, { status: 404 })
    }

    // Update flagged revision
    const flaggedRevision = await prisma.flaggedRevision.update({
      where: { id },
      data: {
        assignedTo: expertId,
      },
    })

    return NextResponse.json({ ok: true, revision: flaggedRevision })
  } catch (error) {
    console.error('Error assigning revision:', error)
    return NextResponse.json(
      { error: 'Failed to assign revision' },
      { status: 500 }
    )
  }
}
