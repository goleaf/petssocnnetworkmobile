import { NextRequest, NextResponse } from 'next/server'

import { addVerificationRequest } from '@/lib/server-verification-requests'
import { getServerUserById } from '@/lib/storage-server'

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const userId = String(form.get('userId') || '')
    const fullName = String(form.get('fullName') || '')
    const reason = String(form.get('reason') || '')
    if (!userId || !fullName || !reason) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const idFront = form.get('idFront') as File | null
    const idBack = form.get('idBack') as File | null

    const proofs: Array<{ name: string; size: number; type: string }> = []
    const bizDocs: Array<{ name: string; size: number; type: string }> = []
    for (const [key, value] of form.entries()) {
      if (key.startsWith('proof')) {
        const f = value as File
        proofs.push({ name: f?.name || 'file', size: f?.size || 0, type: f?.type || 'application/octet-stream' })
      }
      if (key.startsWith('biz')) {
        const f = value as File
        bizDocs.push({ name: f?.name || 'file', size: f?.size || 0, type: f?.type || 'application/octet-stream' })
      }
    }

    const user = getServerUserById(userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    // Enforce 90-day cooldown if previously rejected
    const resubmitAt = (user as any).verificationResubmitAt as string | undefined
    if (resubmitAt && new Date(resubmitAt).getTime() > Date.now()) {
      return NextResponse.json({ error: 'You can resubmit after ' + new Date(resubmitAt).toLocaleDateString() }, { status: 429 })
    }

    // Eligibility: follower threshold
    const followerCount = (user.followers || []).length
    if (followerCount < 10000) {
      return NextResponse.json({ error: 'Not eligible for verification yet' }, { status: 403 })
    }

    const record = addVerificationRequest({
      userId,
      fullName,
      reason,
      attachments: {
        idFront: idFront ? { name: idFront.name, size: idFront.size, type: idFront.type } : undefined,
        idBack: idBack ? { name: idBack.name, size: idBack.size, type: idBack.type } : undefined,
        proofs,
        bizDocs,
      },
    })
    return NextResponse.json({ success: true, requestId: record.id })
  } catch (e) {
    console.error('verification request error', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
