/**
 * Admin Moderation Reports Bulk Action API
 * 
 * POST: Perform bulk actions on multiple reports
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import type { BulkActionRequest } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: BulkActionRequest = await req.json()
    const { reportIds, action, reason, muteDays, escalateToSenior } = body

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: 'reportIds must be a non-empty array' },
        { status: 400 }
      )
    }

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

    // Process each report
    const results = await Promise.all(
      reportIds.map(async (reportId) => {
        try {
          // Get the report
          const report = await prisma.moderationReport.findUnique({
            where: { id: reportId },
          })

          if (!report) {
            return { reportId, success: false, error: 'Report not found' }
          }

          // Determine new status
          let newStatus: string
          if (action === 'approve' || action === 'reject') {
            newStatus = 'closed'
          } else if (escalateToSenior) {
            newStatus = 'triaged'
          } else {
            newStatus = action === 'suspend' ? 'closed' : 'triaged'
          }

          // Update report status
          await prisma.moderationReport.update({
            where: { id: reportId },
            data: {
              status: newStatus,
              assignedTo: user!.id,
            },
          })

          // Prepare metadata
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
            `moderation:bulk:${action}`,
            report.subjectType,
            report.subjectId,
            reason,
            { reportIds, bulkAction: true, escalateToSenior }
          )

          return { reportId, success: true }
        } catch (error) {
          console.error(`Error processing report ${reportId}:`, error)
          return { reportId, success: false, error: 'Failed to process' }
        }
      })
    )

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      ok: true,
      processed: reportIds.length,
      success: successCount,
      failures: failureCount,
      results,
    })
  } catch (error) {
    console.error('Error processing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    )
  }
}

