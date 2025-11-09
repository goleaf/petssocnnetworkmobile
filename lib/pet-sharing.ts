import type { Pet } from './types'
import { readData, writeData, getPetById } from './storage'
import { updatePetEncrypted } from './pet-health-storage'

const INVITES_KEY = 'pet_social_share_invites'
const ACCESS_KEY_PREFIX = 'pet_social_share_access_'

export type SharePermissions = { viewHealth?: boolean; coOwner?: boolean; editProfile?: boolean; editHealth?: boolean }

export interface ShareInvite {
  token: string
  petId: string
  createdBy: string
  createdAt: string
  permissions: SharePermissions
  expiresAt?: string
  redeemedBy?: string
  redeemedAt?: string
}

function randomToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function createShareInvite(petId: string, createdBy: string, permissions: SharePermissions, expiresAt?: string): ShareInvite {
  const invites = readData<ShareInvite[]>(INVITES_KEY, [])
  const invite: ShareInvite = {
    token: randomToken(),
    petId,
    createdBy,
    createdAt: new Date().toISOString(),
    permissions,
    expiresAt,
  }
  writeData(INVITES_KEY, [...invites, invite])
  return invite
}

export function getInvite(token: string): ShareInvite | undefined {
  const invites = readData<ShareInvite[]>(INVITES_KEY, [])
  return invites.find((i) => i.token === token)
}

export function redeemShareInvite(token: string, userId: string): ShareInvite | undefined {
  const invites = readData<ShareInvite[]>(INVITES_KEY, [])
  const idx = invites.findIndex((i) => i.token === token)
  if (idx === -1) return undefined
  const invite = invites[idx]!
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) return undefined
  const updated: ShareInvite = { ...invite, redeemedBy: userId, redeemedAt: new Date().toISOString() }
  const next = [...invites]
  next[idx] = updated
  writeData(INVITES_KEY, next)
  return updated
}

export function grantTemporaryAccess(petId: string) {
  if (typeof window === 'undefined') return
  const key = `${ACCESS_KEY_PREFIX}${petId}`
  try { sessionStorage.setItem(key, '1') } catch {}
}

export function hasTemporaryAccess(petId: string): boolean {
  if (typeof window === 'undefined') return false
  const key = `${ACCESS_KEY_PREFIX}${petId}`
  try { return sessionStorage.getItem(key) === '1' } catch { return false }
}

export function acceptCoOwnerInvite(petId: string, userId: string, permissions: SharePermissions): Pet | undefined {
  const pet = getPetById(petId)
  if (!pet) return undefined
  const coOwners = Array.isArray(pet.coOwners) ? [...pet.coOwners] : []
  if (!coOwners.find((c) => c.userId === userId)) {
    coOwners.push({ userId, permissions: { viewHealth: Boolean(permissions.viewHealth), editProfile: Boolean(permissions.editProfile || permissions.coOwner), editHealth: Boolean(permissions.editHealth || permissions.coOwner) } })
  }
  const updated: Pet = { ...pet, coOwners }
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  updatePetEncrypted(updated)
  return updated
}
