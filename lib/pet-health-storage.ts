import type { Pet } from './types'
import { getPets, getPetByUsernameAndSlug as baseGetPetByUsernameAndSlug, getPetById as baseGetPetById, writeData, readData } from './storage'
import { encryptJSON, decryptJSON, isEncryptionBlob } from './crypto/encryption'

// Key for persisted pets in storage (keep in sync with storage.ts)
const PETS_KEY = 'pet_social_pets'

type HealthBundle = Partial<Pick<
  Pet,
  | 'healthRecords'
  | 'vaccinations'
  | 'medications'
  | 'allergies'
  | 'allergySeverities'
  | 'conditions'
  | 'vetInfo'
  | 'insurance'
  | 'microchipId'
  | 'microchipCompany'
  | 'microchipRegistrationStatus'
  | 'microchipCertificateUrl'
>>

type StoragePet = Pet & {
  __healthEnc?: string
  __healthAcl?: string[] // userIds allowed to decrypt
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function extractHealth(pet: Pet): [Pet, HealthBundle] {
  const bundle: HealthBundle = {}
  const next: Pet = { ...pet }
  const keys: (keyof HealthBundle)[] = [
    'healthRecords',
    'vaccinations',
    'medications',
    'allergies',
    'allergySeverities',
    'conditions',
    'vetInfo',
    'insurance',
    'microchipId',
    'microchipCompany',
    'microchipRegistrationStatus',
    'microchipCertificateUrl',
  ]
  for (const k of keys) {
    if (k in next && (next as any)[k] !== undefined) {
      ;(bundle as any)[k] = (next as any)[k]
      delete (next as any)[k]
    }
  }
  return [next, bundle]
}

export async function serializePetWithEncryption(pet: Pet): Promise<StoragePet> {
  const [safe, bundle] = extractHealth(clone(pet))
  const hasBundle = Object.keys(bundle).length > 0
  if (!hasBundle) return safe as StoragePet
  try {
    const __healthEnc = await encryptJSON(bundle)
    const __healthAcl = Array.from(new Set([pet.ownerId, ...(pet.coOwners?.filter(c => c.permissions?.viewHealth)?.map(c => c.userId) ?? [])]))
    return { ...(safe as any), __healthEnc, __healthAcl }
  } catch {
    // On failure (e.g., no WebCrypto in test), return original pet unchanged
    // to avoid losing sensitive fields in non-secure environments.
    return clone(pet) as StoragePet
  }
}

export async function deserializePetForViewer(pet: StoragePet, viewerId: string | null, accessTokenGrantedPetIds: Set<string> = new Set()): Promise<Pet> {
  const plain: Pet = { ...(pet as Pet) }
  delete (plain as any).__healthEnc
  delete (plain as any).__healthAcl
  const canViewHealth = Boolean(
    pet && pet.__healthEnc && (
      (viewerId && Array.isArray(pet.__healthAcl) && pet.__healthAcl.includes(viewerId)) || accessTokenGrantedPetIds.has(pet.id)
    ),
  )
  if (pet.__healthEnc && isEncryptionBlob(pet.__healthEnc)) {
    if (!canViewHealth) return plain
    try {
      const bundle = await decryptJSON<HealthBundle>(pet.__healthEnc)
      return { ...plain, ...bundle }
    } catch {
      return plain
    }
  }
  // If data wasn't stored encrypted (legacy), still enforce redaction for unauthorized viewers
  if (!canViewHealth && viewerId !== pet.ownerId) {
    const [safeOnly] = extractHealth(plain)
    return safeOnly
  }
  return plain
}

// Write an array of pets with encryption applied
export async function persistPetsEncrypted(pets: Pet[]) {
  const list: StoragePet[] = []
  for (const p of pets) list.push(await serializePetWithEncryption(p))
  writeData(PETS_KEY, list)
}

export async function addPetEncrypted(pet: Pet) {
  const list = readData<StoragePet[]>(PETS_KEY, [])
  const enc = await serializePetWithEncryption(pet)
  writeData(PETS_KEY, [...list, enc])
}

export async function updatePetEncrypted(pet: Pet) {
  const list = readData<StoragePet[]>(PETS_KEY, [])
  const idx = list.findIndex((p) => p.id === pet.id)
  if (idx === -1) return
  const enc = await serializePetWithEncryption(pet)
  const next = [...list]
  next[idx] = enc
  writeData(PETS_KEY, next)
}

// Helper: get pets decrypted for the given owner/viewer
export async function getPetsByOwnerIdDecrypted(ownerId: string): Promise<Pet[]> {
  const raw = readData<StoragePet[]>(PETS_KEY, [])
  const out: Pet[] = []
  for (const p of raw) {
    if (p.ownerId !== ownerId) continue
    out.push(await deserializePetForViewer(p, ownerId))
  }
  return out
}

export async function getPetByIdForViewer(id: string, viewerId: string | null, accessGrantedPetIds: Set<string> = new Set()): Promise<Pet | undefined> {
  const raw = readData<StoragePet[]>(PETS_KEY, [])
  const found = raw.find((p) => p.id === id)
  if (!found) return undefined
  return deserializePetForViewer(found, viewerId, accessGrantedPetIds)
}

export async function getPetByUsernameAndSlugForViewer(username: string, slug: string, viewerId: string | null, accessGrantedPetIds: Set<string> = new Set()): Promise<Pet | undefined> {
  const pet = baseGetPetByUsernameAndSlug(username, slug) as StoragePet | undefined
  if (!pet) return undefined
  return deserializePetForViewer(pet, viewerId, accessGrantedPetIds)
}
