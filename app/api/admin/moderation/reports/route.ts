/**
 * Admin Moderation Reports API
 * 
 * GET: List reports (with filters: type, status, age, reporter reputation)
 * POST: Create a new report
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'
import type { ReportType, ReportStatus, ReportAge, ReporterReputation } from '@/lib/types'

function getAgeFilter(age?: ReportAge) {
  if (!age || age === 'all') return undefined
  
  const now = new Date()
  let startDate: Date
  
  switch (age) {
    case 'last-hour':
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case 'last-day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'last-week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'last-month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      return undefined
  }
  
  return { gte: startDate }
}

// Helper to determine reporter reputation (simplified - can be enhanced)
function getReporterReputation(reporterId: string): ReporterReputation {
  // TODO: Implement actual reputation calculation based on:
  // - Previous report accuracy
  // - User account age
  // - User activity level
  // For now, return 'medium' as default
  return 'medium'
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!hasRole(user, ['Admin', 'Moderator'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type') as ReportType | null
    const status = url.searchParams.get('status') as ReportStatus | null
    const age = url.searchParams.get('age') as ReportAge | null
    const reporterReputation = url.searchParams.get('reporterReputation') as ReporterReputation | null

    // Build where clause
    const where: any = {}
    
    if (type && type !== 'all') {
      where.reason = type
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    const ageFilter = getAgeFilter(age)
    if (ageFilter) {
      where.createdAt = ageFilter
    }

    const items = await prisma.moderationReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    // Enhance reports with additional data
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        // Get reporter reputation
        const rep = getReporterReputation(item.reporterId)
        
        // Filter by reporter reputation if specified
        if (reporterReputation && reporterReputation !== 'all' && rep !== reporterReputation) {
          return null
        }

        // Fetch subject content preview (simplified - can be enhanced based on subjectType)
        let subjectContent: string | undefined
        try {
          // TODO: Fetch actual content based on subjectType and subjectId
          // For now, return a placeholder
          subjectContent = `[${item.subjectType}:${item.subjectId}]`
        } catch (e) {
          // Ignore errors fetching content
        }

        // Build evidence array (can be enhanced to fetch actual media)
        const evidence: any[] = []
        
        // Build actor history from actions
        const actorHistory = item.actions.map((action) => ({
          id: action.id,
          actorId: action.actorId,
          action: action.type,
          timestamp: action.createdAt.toISOString(),
          details: action.reason || undefined,
        }))

        return {
          ...item,
          type: item.reason as ReportType, // Map reason to type
          reporterReputation: rep,
          subjectContent,
          evidence,
          actorHistory,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          actions: item.actions.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
            metadata: a.metadata as any,
          })),
        }
      })
    )

    // Filter out nulls (from reputation filtering)
    const filteredItems = enhancedItems.filter((item) => item !== null)

    return NextResponse.json({ items: filteredItems })
  } catch (error) {
    console.error('Error fetching reports:', error)
    // Return empty array if DB not available
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: Request) {
  try {
    // Allow creating a report from anywhere (you can add auth later)
    const body = await req.json()
    
    const { reporterId, subjectType, subjectId, reason } = body

    if (!reporterId || !subjectType || !subjectId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const item = await prisma.moderationReport.create({
      data: {
        reporterId,
        subjectType,
        subjectId,
        reason,
        status: 'open',
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}

