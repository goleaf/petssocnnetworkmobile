/**
 * Admin Wiki Experts API
 * 
 * GET: Get list of experts with optional status filter
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'pending' | 'verified' | 'expired' | null

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }

    // Get expert profiles
    const expertProfiles = await prisma.expertProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Map to response format
    const experts = expertProfiles.map((profile) => ({
      userId: profile.userId,
      credential: profile.credential,
      licenseNo: profile.licenseNo,
      region: profile.region,
      status: profile.status,
      verifiedAt: profile.verifiedAt?.toISOString() || null,
      expiresAt: profile.expiresAt?.toISOString() || null,
    }))

    return NextResponse.json({ experts })
  } catch (error) {
    console.error('Error fetching experts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch experts' },
      { status: 500 }
    )
  }
}

