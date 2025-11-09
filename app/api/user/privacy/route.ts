import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // For this demo app, privacy persistence happens client-side via localStorage.
  // This endpoint acknowledges the request so the UI can display immediate feedback.
  try {
    const _body = await request.json().catch(() => ({}))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

