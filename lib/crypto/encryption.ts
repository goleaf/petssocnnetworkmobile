// Application-level encryption helpers for sensitive pet health data
// AES-GCM via WebCrypto, with PBKDF2-derived key from an app secret.

/*
Design notes:
- We derive a symmetric key from a passphrase. In production, provide a data key from a KMS
  and pass it via a secure channel; here we support NEXT_PUBLIC_ENCRYPTION_PASSPHRASE for dev/tests.
- Ciphertext format: JSON { v: 1, alg: 'AES-GCM', iv: base64, ct: base64 } serialized as
  a string with prefix 'enc:'.
*/

const TEXT = new TextEncoder()
const BYTES = new TextDecoder()

export type EncryptionBlob = string // 'enc:' + base64(JSON)

function toBase64(bytes: ArrayBuffer): string {
  if (typeof window !== 'undefined' && window.btoa) {
    const bin = String.fromCharCode(...new Uint8Array(bytes))
    return window.btoa(bin)
  }
  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const buf = Buffer.from(new Uint8Array(bytes))
  return buf.toString('base64')
}

function fromBase64(b64: string): Uint8Array {
  if (typeof window !== 'undefined' && window.atob) {
    const bin = window.atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }
  // Node fallback
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const buf = Buffer.from(b64, 'base64')
  return new Uint8Array(buf)
}

async function importAesKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const enc = TEXT.encode(passphrase)
  const salt = TEXT.encode('pet-social-health-v1')
  const baseKey = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveBits', 'deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

let cachedKey: Promise<CryptoKey> | null = null

export async function getAppEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  if (typeof window === 'undefined' || !('crypto' in window) || !window.crypto?.subtle) {
    // Server or unsupported environment: create a thrower so callers can guard
    cachedKey = Promise.reject(new Error('WebCrypto not available'))
    return cachedKey
  }
  const passphrase = process.env.NEXT_PUBLIC_ENCRYPTION_PASSPHRASE || '__dev_test_key_only__'
  cachedKey = deriveKeyFromPassphrase(passphrase)
  return cachedKey
}

export async function encryptJSON(value: unknown): Promise<EncryptionBlob> {
  const key = await getAppEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = TEXT.encode(JSON.stringify(value))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const payload = {
    v: 1,
    alg: 'AES-GCM',
    iv: toBase64(iv.buffer),
    ct: toBase64(ct),
  }
  const raw = JSON.stringify(payload)
  const b64 = toBase64(TEXT.encode(raw))
  return `enc:${b64}`
}

export async function decryptJSON<T = unknown>(blob: EncryptionBlob): Promise<T> {
  if (!blob || typeof blob !== 'string' || !blob.startsWith('enc:')) {
    throw new Error('Invalid encryption blob')
  }
  const key = await getAppEncryptionKey()
  const b64 = blob.slice(4)
  const raw = BYTES.decode(fromBase64(b64))
  const payload = JSON.parse(raw) as { v: number; alg: string; iv: string; ct: string }
  if (payload.v !== 1 || payload.alg !== 'AES-GCM') {
    throw new Error('Unsupported ciphertext format')
  }
  const iv = fromBase64(payload.iv)
  const ct = fromBase64(payload.ct)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  const json = BYTES.decode(pt)
  return JSON.parse(json) as T
}

export function isEncryptionBlob(v: unknown): v is EncryptionBlob {
  return typeof v === 'string' && v.startsWith('enc:')
}

