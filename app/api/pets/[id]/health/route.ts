import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-server'
import { recordHealthAudit } from '@/lib/health/audit-log-server'
import { canViewHealth, canEditHealth, pickHealthFields } from '@/lib/health/access'
import { mockPets } from '@/lib/mock-data'

function getIp(req: NextRequest): string | undefined {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim()
  // @ts-ignore - next may inject ip in some runtimes
  const ip = (req as any).ip as string | undefined
  return ip
}

function findPet(id: string) {
  return mockPets.find((p) => p.id === id)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  const ip = getIp(req)
  const petId = params.id
  const viaToken = Boolean(new URL(req.url).searchParams.get('access'))
  const pet = findPet(petId)

  if (!pet) {
    recordHealthAudit({ action: 'view', petId, userId: user?.id ?? null, ip, success: false, viaShareToken: viaToken })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!canViewHealth(pet, user, viaToken)) {
    recordHealthAudit({ action: 'view', petId, userId: user?.id ?? null, ip, success: false, viaShareToken: viaToken })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  recordHealthAudit({ action: 'view', petId, userId: user?.id ?? null, ip, success: true, viaShareToken: viaToken })
  return NextResponse.json({ petId, health: pickHealthFields(pet) }, { status: 200 })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  const ip = getIp(req)
  const petId = params.id
  const viaToken = Boolean(new URL(req.url).searchParams.get('access'))
  const pet = findPet(petId)

  if (!pet) {
    recordHealthAudit({ action: 'update', petId, userId: user?.id ?? null, ip, success: false, viaShareToken: viaToken })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // View-only share token must never allow modification
  if (!canEditHealth(pet, user)) {
    recordHealthAudit({ action: 'update', petId, userId: user?.id ?? null, ip, success: false, viaShareToken: viaToken })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // NOTE: In this demo environment, pets are mock data and updates are not persisted server-side.
  // Accept the request and return a 202 to indicate the write would be applied in a real backend.
  try {
    const body = await req.json()
    // Sanitize to health fields only; no-op in demo
    const _updates = body && typeof body === 'object' ? body : {}
    recordHealthAudit({ action: 'update', petId, userId: user?.id ?? null, ip, success: true, viaShareToken: viaToken })
    return NextResponse.json({ accepted: true }, { status: 202 })
  } catch {
    recordHealthAudit({ action: 'update', petId, userId: user?.id ?? null, ip, success: false, viaShareToken: viaToken })
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}

