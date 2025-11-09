/**
 * Admin Wiki Revision Rollback API
 * 
 * POST: Rollback article to stable revision
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/session'
import { hasRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import { getWikiRevisionsByArticleIdAction } from '@/lib/actions/wiki'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { reason } = await req.json()

    // Get flagged revision
    const flaggedRevision = await prisma.flaggedRevision.findUnique({
      where: { id },
    })

    if (!flaggedRevision) {
      return NextResponse.json({ error: 'Flagged revision not found' }, { status: 404 })
    }

    // Get article
    const article = await prisma.article.findUnique({
      where: { id: flaggedRevision.articleId },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Find latest stable revision using action (mocked in tests)
    const revisions = await getWikiRevisionsByArticleIdAction(article.id)
    const stableRevision = (revisions || []).find((r: any) => r.status === 'stable')
    if (!stableRevision) {
      return NextResponse.json({ error: 'No stable revision found' }, { status: 404 })
    }

    // Create a new revision based on stable revision (rollback)
    const rollbackRevision = await prisma.revision.create({
      data: {
        articleId: article.id,
        rev: (await prisma.revision.count({ where: { articleId: article.id } })) + 1,
        authorId: user!.id,
        summary: reason || 'Rolled back to stable revision',
        contentJSON: stableRevision.contentJSON,
        infoboxJSON: stableRevision.infoboxJSON,
        approvedById: user!.id,
        approvedAt: new Date(),
      },
    })

    // Update flagged revision status
    await prisma.flaggedRevision.update({
      where: { id },
      data: {
        status: 'rolled-back',
      },
    })

    // Write audit log
    await writeAudit(
      user!.id,
      'wiki:rollback',
      'revision',
      flaggedRevision.revisionId,
      reason || 'Rolled back to stable revision'
    )

    return NextResponse.json({ ok: true, revision: rollbackRevision })
  } catch (error) {
    console.error('Error rolling back revision:', error)
    return NextResponse.json(
      { error: 'Failed to rollback revision' },
      { status: 500 }
    )
  }
}
