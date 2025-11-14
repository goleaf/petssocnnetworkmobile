/**
 * Queue Counts API Route
 * 
 * Provides counts for all moderation queues with urgent item detection
 * GET /api/admin/moderation/queue-counts
 */

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/moderation/queue-counts
 * 
 * Returns counts for all moderation queues
 * 
 * Response format:
 * {
 *   queues: {
 *     'new-pages': number,
 *     'flagged-health': number,
 *     'coi-edits': number,
 *     'image-reviews': number
 *   },
 *   totalPending: number,
 *   urgentCount: number,
 *   hasUrgent: boolean
 * }
 */
export async function GET() {
  try {
    // Verify user is authenticated and has moderator role
    const session = await getSession()
    
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    })

    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Forbidden - Moderator access required' },
        { status: 403 }
      )
    }

    // Get counts for each queue type
    const [newPagesCount, flaggedHealthCount, coiEditsCount, imageReviewsCount, urgentCount] = await Promise.all([
      // New pages queue
      prisma.editRequest.count({
        where: {
          status: 'pending',
          isNewPage: true,
        },
      }),
      
      // Flagged health content queue
      prisma.editRequest.count({
        where: {
          status: 'pending',
          isFlaggedHealth: true,
        },
      }),
      
      // COI edits queue
      prisma.editRequest.count({
        where: {
          status: 'pending',
          isCOI: true,
        },
      }),
      
      // Image reviews queue
      prisma.editRequest.count({
        where: {
          status: 'pending',
          hasImages: true,
        },
      }),
      
      // Urgent items across all queues
      prisma.editRequest.count({
        where: {
          status: 'pending',
          priority: 'urgent',
        },
      }),
    ])

    const totalPending = newPagesCount + flaggedHealthCount + coiEditsCount + imageReviewsCount

    return NextResponse.json({
      queues: {
        'new-pages': newPagesCount,
        'flagged-health': flaggedHealthCount,
        'coi-edits': coiEditsCount,
        'image-reviews': imageReviewsCount,
      },
      totalPending,
      urgentCount,
      hasUrgent: urgentCount > 0,
    })
  } catch (error) {
    console.error('Failed to get queue counts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
