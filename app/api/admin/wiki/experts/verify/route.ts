/**
 * Admin Wiki Experts Verify API
 * 
 * POST: Verify an expert (set status=verified, verifiedAt=now, expiresAt=+1y)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator'])) {
      return NextResponse.json(
        { error: 'Only Admin and Moderator can verify experts' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if expert profile exists
    const existing = await prisma.expertProfile.findUnique({
      where: { userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Expert profile not found' }, { status: 404 })
    }

    // Calculate expiration date (1 year from now)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    // Update expert profile
    const updated = await prisma.expertProfile.update({
      where: { userId },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
        expiresAt,
      },
    })

    // Write audit log
    await writeAudit({
      actorId: user!.id,
      action: 'expert:verify',
      targetType: 'expert_profile',
      targetId: userId,
      reason: `Expert verified by ${user!.email}`,
      metadata: {
        credential: updated.credential,
        expiresAt: expiresAt.toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      expert: {
        userId: updated.userId,
        status: updated.status,
        verifiedAt: updated.verifiedAt?.toISOString(),
        expiresAt: updated.expiresAt?.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error verifying expert:', error)
    return NextResponse.json(
      { error: 'Failed to verify expert' },
      { status: 500 }
    )
  }
}

