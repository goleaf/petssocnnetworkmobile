/**
 * Admin Moderation Report Action API
 * 
 * POST: Act on a report (approve, reject, warn, mute, suspend)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, reason, muteDays, escalateToSenior } = await req.json()
    
    // Validate action type
    const validActions = ['approve', 'reject', 'warn', 'mute', 'shadowban', 'suspend']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate muteDays for mute action
    if (action === 'mute' && (!muteDays || muteDays < 1)) {
      return NextResponse.json(
        { error: 'muteDays is required and must be at least 1 for mute action' },
        { status: 400 }
      )
    }

    // Determine new status based on action
    let newStatus: string
    if (action === 'approve' || action === 'reject') {
      newStatus = 'closed'
    } else if (escalateToSenior) {
      newStatus = 'triaged' // Keep triaged when escalating
    } else {
      newStatus = action === 'suspend' ? 'closed' : 'triaged'
    }

    // Update report status
    const report = await prisma.moderationReport.update({
      where: { id },
      data: {
        status: newStatus,
        assignedTo: user!.id,
      },
    })

    // Prepare metadata for moderation action
    const metadata: any = {}
    if (action === 'mute' && muteDays) {
      metadata.muteDays = muteDays
    }
    if (escalateToSenior) {
      metadata.escalateToSenior = true
    }

    // Create moderation action
    await prisma.moderationAction.create({
      data: {
        reportId: report.id,
        actorId: user!.id,
        type: action,
        reason,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      },
    })

    // Write audit log
    await writeAudit(
      user!.id,
      `moderation:${action}`,
      report.subjectType,
      report.subjectId,
      reason
    )

    return NextResponse.json({ ok: true, report })
  } catch (error) {
    console.error('Error acting on report:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}

