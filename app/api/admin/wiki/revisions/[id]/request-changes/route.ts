/**
 * Admin Wiki Revision Request Changes API
 * 
 * POST: Request changes on a flagged revision
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
    
    if (!hasRole(user, ['Admin', 'Moderator', 'Expert'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { comment } = await req.json()

    const fr = await prisma.flaggedRevision.update({
      where: { id },
      data: {
        status: 'changes-requested',
      },
    })

    await writeAudit(
      user!.id,
      'wiki:request-changes',
      'revision',
      id,
      comment || 'Changes requested'
    )

    return NextResponse.json({ ok: true, revision: fr })
  } catch (error) {
    console.error('Error requesting changes:', error)
    return NextResponse.json(
      { error: 'Failed to request changes' },
      { status: 500 }
    )
  }
}

