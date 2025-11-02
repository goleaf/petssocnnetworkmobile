/**
 * Encryption at rest utilities
 * Encrypts sensitive data before storing in database or file storage
 */

import crypto from 'crypto';

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** Encryption algorithm (default: aes-256-gcm) */
  algorithm: string;
  /** Key derivation function iterations */
  iterations: number;
}

/**
 * Get encryption key from environment
 * In production, use a proper key management service (AWS KMS, HashiCorp Vault, etc.)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  // For AES-256, we need a 32-byte key
  // If key is shorter, derive a proper key using PBKDF2
  if (key.length < 32) {
    return crypto.pbkdf2Sync(key, 'pet-social-network-salt', 100000, 32, 'sha256');
  }

  return Buffer.from(key.slice(0, 32), 'utf-8');
}

/**
 * Encrypt data
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hash sensitive data (one-way, cannot be decrypted)
 * Use for passwords, tokens, etc.
 */
export function hash(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':');
    const hashToVerify = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return hash === hashToVerify.toString('hex');
  } catch {
    return false;
  }
}

/**
 * Encrypt object fields (useful for encrypting specific fields in database records)
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj };

  for (const field of fieldsToEncrypt) {
    const value = obj[field];
    if (value !== null && value !== undefined) {
      encrypted[field] = encrypt(String(value)) as T[keyof T];
    }
  }

  return encrypted;
}

/**
 * Decrypt object fields
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj };

  for (const field of fieldsToDecrypt) {
    const value = obj[field];
    if (typeof value === 'string' && value.includes(':')) {
      try {
        decrypted[field] = decrypt(value) as T[keyof T];
      } catch {
        // If decryption fails, keep original value
        console.warn(`Failed to decrypt field ${String(field)}`);
      }
    }
  }

  return decrypted;
}

