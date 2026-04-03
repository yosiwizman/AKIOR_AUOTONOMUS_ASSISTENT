/**
 * Simple encryption utilities for sensitive data like API keys
 * Uses AES-256-GCM for encryption with a server-side secret
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Get encryption key from environment or generate a deterministic one for development
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'dev-secret-key-change-in-production';
  // Derive a 32-byte key from the secret using scrypt
  return scryptSync(secret, 'salt', 32);
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a string value
 * Returns base64-encoded string containing IV + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + ciphertext
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string value
 * Expects base64-encoded string containing IV + authTag + ciphertext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract IV, authTag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    // Return empty string on decryption failure (e.g., corrupted data or wrong key)
    return '';
  }
}

/**
 * Check if a string appears to be encrypted (base64 with correct length)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  try {
    const decoded = Buffer.from(value, 'base64');
    // Minimum length: IV (16) + authTag (16) + at least 1 byte of ciphertext
    return decoded.length > IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '****';
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}
