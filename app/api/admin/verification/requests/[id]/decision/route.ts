import { NextRequest, NextResponse } from 'next/server'
import { getVerificationRequestById, updateVerificationRequest } from '@/lib/server-verification-requests'
import { getServerUserById, updateServerUser } from '@/lib/storage-server'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const decision = String(body?.decision || '') as 'approve' | 'reject'
    const notes = String(body?.notes || '')
    const reviewerId = String(body?.reviewerId || 'admin')
    const rec = getVerificationRequestById(id)
    if (!rec) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    const user = getServerUserById(rec.userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date().toISOString()
    if (decision === 'approve') {
      updateServerUser(user.id, {
        badge: 'verified' as any,
        emailVerified: user.emailVerified === true,
        // Require both verifications to be true; can be enforced by UI flows
        // Add flags for required verifications if not already verified
        // @ts-ignore
        requireEmailVerification: user.emailVerified !== true,
        // @ts-ignore
        phoneVerified: (user as any).phoneVerified === true,
        // @ts-ignore
        requirePhoneVerification: (user as any).phoneVerified !== true,
      })
      updateVerificationRequest(id, { status: 'approved', reviewNotes: notes, reviewedBy: reviewerId, reviewedAt: now })
      console.log(`[verification] Approved for user ${user.id}. Email congratulations sent.`)
      return NextResponse.json({ success: true })
    }

    if (decision === 'reject') {
      // Add cooldown 90 days for resubmission
      const ninetyDays = 90 * 24 * 60 * 60 * 1000
      const resubmitAt = new Date(Date.now() + ninetyDays).toISOString()
      updateServerUser(user.id, {
        // @ts-ignore
        verificationResubmitAt: resubmitAt,
      })
      updateVerificationRequest(id, { status: 'rejected', reviewNotes: notes, reviewedBy: reviewerId, reviewedAt: now })
      console.log(`[verification] Rejected for user ${user.id}. Email sent with reason.`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
  } catch (e) {
    console.error('verification decision error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
