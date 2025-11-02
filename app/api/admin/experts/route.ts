/**
 * Admin Experts API
 * 
 * GET: Get list of verified experts
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get verified expert profiles
    const expertProfiles = await prisma.expertProfile.findMany({
      where: {
        status: 'verified',
      },
      take: 100,
    })

    // For now, return expert profile IDs
    // In production, you'd join with User table to get names/emails
    const experts = expertProfiles.map((profile) => ({
      id: profile.userId,
      name: null,
      email: null, // Would need to join with users table
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

