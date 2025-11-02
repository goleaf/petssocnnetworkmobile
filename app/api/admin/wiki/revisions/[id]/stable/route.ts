/**
 * Admin Wiki Stable Revision API
 * 
 * GET: Get stable revision for comparison
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

    // Get flagged revision to find articleId
    const flaggedRevision = await prisma.flaggedRevision.findUnique({
      where: { id },
    })

    if (!flaggedRevision) {
      return NextResponse.json({ error: 'Flagged revision not found' }, { status: 404 })
    }

    // Get article to find stable revision
    const article = await prisma.article.findUnique({
      where: { id: flaggedRevision.articleId },
      include: {
        revisions: {
          where: {
            approvedAt: { not: null },
          },
          orderBy: { approvedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Get the most recently approved revision as stable
    const stableRevision = article.revisions[0]

    if (!stableRevision) {
      return NextResponse.json({ error: 'No stable revision found' }, { status: 404 })
    }

    // Extract content from contentJSON
    let content = ''
    if (stableRevision.contentJSON && typeof stableRevision.contentJSON === 'object') {
      const json = stableRevision.contentJSON as any
      if (json.blocks && Array.isArray(json.blocks)) {
        content = json.blocks
          .map((block: any) => block.text || '')
          .join('\n')
      }
    }

    return NextResponse.json({
      id: stableRevision.id,
      content,
      contentJSON: stableRevision.contentJSON,
      createdAt: stableRevision.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching stable revision:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stable revision' },
      { status: 500 }
    )
  }
}

