import { NextRequest, NextResponse } from 'next/server'
import { listVerificationRequests } from '@/lib/server-verification-requests'

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') as any
  const items = listVerificationRequests(status)
  return NextResponse.json({ items })
}

