/**
 * Admin Wiki Revision Content API
 * 
 * GET: Get revision content
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get flagged revision to find revisionId
    const flaggedRevision = await prisma.flaggedRevision.findUnique({
      where: { id },
    })

    if (!flaggedRevision) {
      return NextResponse.json({ error: 'Flagged revision not found' }, { status: 404 })
    }

    // Get the revision
    const revision = await prisma.revision.findUnique({
      where: { id: flaggedRevision.revisionId },
    })

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
    }

    // Extract content from contentJSON
    let content = ''
    if (revision.contentJSON && typeof revision.contentJSON === 'object') {
      const json = revision.contentJSON as any
      if (json.blocks && Array.isArray(json.blocks)) {
        content = json.blocks
          .map((block: any) => block.text || '')
          .join('\n')
      }
    }

    return NextResponse.json({
      id: revision.id,
      content,
      contentJSON: revision.contentJSON,
      createdAt: revision.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching revision:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revision' },
      { status: 500 }
    )
  }
}

