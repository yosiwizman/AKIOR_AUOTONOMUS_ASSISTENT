import { describe, it, expect } from 'vitest';
import { sha256Hex, safeId } from '@/lib/kb/hash';

describe('Hashing Utilities', () => {
  describe('sha256Hex', () => {
    it('should generate consistent hashes', () => {
      const data = 'test data';
      const hash1 = sha256Hex(data);
      const hash2 = sha256Hex(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different data', () => {
      const hash1 = sha256Hex('data 1');
      const hash2 = sha256Hex('data 2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate 64-character hex strings', () => {
      const hash = sha256Hex('test');
      
      expect(hash.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('should handle Buffer input', () => {
      const buffer = Buffer.from('test data');
      const hash = sha256Hex(buffer);
      
      expect(hash.length).toBe(64);
    });

    it('should handle empty input', () => {
      const hash = sha256Hex('');
      expect(hash.length).toBe(64);
    });
  });

  describe('safeId', () => {
    it('should generate IDs with correct prefix', () => {
      const id = safeId('test');
      expect(id.startsWith('test_')).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = safeId('test');
      const id2 = safeId('test');
      
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of reasonable length', () => {
      const id = safeId('test');
      
      // Format: prefix_timestamp_random
      expect(id.length).toBeGreaterThan(10);
      expect(id.length).toBeLessThan(50);
    });

    it('should handle different prefixes', () => {
      const id1 = safeId('user');
      const id2 = safeId('session');
      
      expect(id1.startsWith('user_')).toBe(true);
      expect(id2.startsWith('session_')).toBe(true);
    });
  });
});
