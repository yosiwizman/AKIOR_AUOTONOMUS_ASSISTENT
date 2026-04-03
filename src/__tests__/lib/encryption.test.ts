import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted, maskApiKey } from '@/lib/encryption';

describe('Encryption', () => {
  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'sk-test-1234567890abcdef';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const plaintext = 'test-data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2); // Different IVs
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should return empty string for corrupted data', () => {
      const corrupted = 'invalid-base64-data';
      expect(decrypt(corrupted)).toBe('');
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted data', () => {
      const plaintext = 'test-data';
      const encrypted = encrypt(plaintext);
      
      expect(isEncrypted(encrypted)).toBe(true);
      expect(isEncrypted(plaintext)).toBe(false);
      expect(isEncrypted('')).toBe(false);
    });
  });

  describe('maskApiKey', () => {
    it('should mask API keys correctly', () => {
      const key = 'sk-test-1234567890abcdef';
      const masked = maskApiKey(key);
      
      expect(masked).toContain('sk-test');
      expect(masked).toContain('...');
      expect(masked).toContain('cdef');
      expect(masked).not.toContain('1234567890');
    });

    it('should handle short keys', () => {
      expect(maskApiKey('short')).toBe('****');
      expect(maskApiKey('')).toBe('****');
    });
  });
});
