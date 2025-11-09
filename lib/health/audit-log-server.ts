// Minimal in-memory audit log for health record access on the server.
// In production, persist to a database and include additional context.

export type HealthAuditAction = 'view' | 'update'

export interface HealthAuditEvent {
  id: string
  timestamp: string
  petId: string
  action: HealthAuditAction
  userId: string | null
  ip: string | undefined
  success: boolean
  viaShareToken?: boolean
}

const audit: HealthAuditEvent[] = []

export function recordHealthAudit(e: Omit<HealthAuditEvent, 'id' | 'timestamp'>): HealthAuditEvent {
  const event: HealthAuditEvent = {
    ...e,
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
  }
  audit.push(event)
  try {
    // Mirror to console for inspection in development.
    // eslint-disable-next-line no-console
    console.info('[health-audit]', event)
  } catch {}
  return event
}

export function getHealthAuditEvents(): HealthAuditEvent[] {
  return [...audit]
}

