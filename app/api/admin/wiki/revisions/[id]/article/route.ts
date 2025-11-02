/**
 * Admin Wiki Article API
 * 
 * GET: Get article details
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

    // Get the article
    const article = await prisma.article.findUnique({
      where: { id: flaggedRevision.articleId },
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: article.id,
      title: article.title,
      slug: article.slug,
    })
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

