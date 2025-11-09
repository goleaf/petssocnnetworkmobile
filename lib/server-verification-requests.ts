export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected'

export type VerificationAttachmentMeta = { name: string; size: number; type: string }

export type VerificationRequest = {
  id: string
  userId: string
  fullName: string
  reason: string
  createdAt: string
  status: VerificationRequestStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
  attachments: {
    idFront?: VerificationAttachmentMeta
    idBack?: VerificationAttachmentMeta
    proofs?: VerificationAttachmentMeta[]
    bizDocs?: VerificationAttachmentMeta[]
  }
}

let REQUESTS: VerificationRequest[] = []

export function addVerificationRequest(req: Omit<VerificationRequest, 'id' | 'status' | 'createdAt'>): VerificationRequest {
  const record: VerificationRequest = {
    ...req,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  REQUESTS.push(record)
  return record
}

export function listVerificationRequests(status?: VerificationRequestStatus): VerificationRequest[] {
  return status ? REQUESTS.filter((r) => r.status === status) : [...REQUESTS]
}

export function getVerificationRequestById(id: string): VerificationRequest | undefined {
  return REQUESTS.find((r) => r.id === id)
}

export function updateVerificationRequest(id: string, updates: Partial<VerificationRequest>): VerificationRequest | null {
  const idx = REQUESTS.findIndex((r) => r.id === id)
  if (idx === -1) return null
  REQUESTS[idx] = { ...REQUESTS[idx], ...updates }
  return REQUESTS[idx]
}

