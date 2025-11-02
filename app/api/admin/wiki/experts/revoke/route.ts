/**
 * Admin Wiki Experts Revoke API
 * 
 * POST: Revoke an expert's verification
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
        { error: 'Only Admin and Moderator can revoke experts' },
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

    // Update expert profile
    const updated = await prisma.expertProfile.update({
      where: { userId },
      data: {
        status: 'revoked',
      },
    })

    // Write audit log
    await writeAudit({
      actorId: user!.id,
      action: 'expert:revoke',
      targetType: 'expert_profile',
      targetId: userId,
      reason: `Expert revoked by ${user!.email}`,
      metadata: {
        previousStatus: existing.status,
        credential: updated.credential,
      },
    })

    return NextResponse.json({
      ok: true,
      expert: {
        userId: updated.userId,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('Error revoking expert:', error)
    return NextResponse.json(
      { error: 'Failed to revoke expert' },
      { status: 500 }
    )
  }
}

