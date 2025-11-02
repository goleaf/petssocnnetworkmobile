/**
 * Admin Wiki Experts Extend API
 * 
 * POST: Extend an expert's verification expiration date
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
        { error: 'Only Admin and Moderator can extend experts' },
        { status: 403 }
      )
    }

    const { userId, months } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    if (!months || typeof months !== 'number' || months < 1) {
      return NextResponse.json(
        { error: 'Valid number of months required' },
        { status: 400 }
      )
    }

    // Check if expert profile exists
    const existing = await prisma.expertProfile.findUnique({
      where: { userId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Expert profile not found' }, { status: 404 })
    }

    // Calculate new expiration date
    const currentExpiresAt = existing.expiresAt || new Date()
    const newExpiresAt = new Date(currentExpiresAt)
    newExpiresAt.setMonth(newExpiresAt.getMonth() + months)

    // Update expert profile
    const updated = await prisma.expertProfile.update({
      where: { userId },
      data: {
        expiresAt: newExpiresAt,
        // If expired, set back to verified
        status: existing.status === 'expired' ? 'verified' : existing.status,
      },
    })

    // Write audit log
    await writeAudit({
      actorId: user!.id,
      action: 'expert:extend',
      targetType: 'expert_profile',
      targetId: userId,
      reason: `Expert verification extended by ${months} months by ${user!.email}`,
      metadata: {
        months,
        previousExpiresAt: existing.expiresAt?.toISOString(),
        newExpiresAt: newExpiresAt.toISOString(),
        credential: updated.credential,
      },
    })

    return NextResponse.json({
      ok: true,
      expert: {
        userId: updated.userId,
        expiresAt: updated.expiresAt?.toISOString(),
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('Error extending expert:', error)
    return NextResponse.json(
      { error: 'Failed to extend expert' },
      { status: 500 }
    )
  }
}

