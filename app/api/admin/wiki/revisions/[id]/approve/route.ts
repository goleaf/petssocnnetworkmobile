/**
 * Admin Wiki Revision Approve API
 * 
 * POST: Approve a flagged revision
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import { isExpertVerifiedAction } from '@/lib/actions/expert'

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    // Only Experts, Moderators, and Admins can approve stable revisions
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json(
        { error: 'Only Experts and Moderators can approve stable revisions' },
        { status: 403 }
      )
    }

    // If user is an Expert (not Admin/Moderator), check if they're verified and not expired
    if (hasRole(user, ['Expert']) && !hasRole(user, ['Admin', 'Moderator'])) {
      const isVerified = await isExpertVerifiedAction(user!.id)
      if (!isVerified) {
        return NextResponse.json(
          { error: 'Your expert verification has expired or been revoked' },
          { status: 403 }
        )
      }
    }

    const fr = await prisma.flaggedRevision.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user!.id,
      },
    })

    await writeAudit({
      actorId: user!.id,
      action: 'wiki:approve-stable',
      targetType: 'revision',
      targetId: fr.revisionId,
      reason: `Approved flagged revision ${id}`,
    })

    return NextResponse.json({ ok: true, revision: fr })
  } catch (error) {
    console.error('Error approving revision:', error)
    return NextResponse.json(
      { error: 'Failed to approve revision' },
      { status: 500 }
    )
  }
}

