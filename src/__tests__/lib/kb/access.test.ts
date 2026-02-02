import { describe, it, expect } from 'vitest';
import { roleForRequest, allowedClassifications } from '@/lib/kb/access';

describe('KB Access Control', () => {
  describe('roleForRequest', () => {
    it('should return public role for public mode', () => {
      const role = roleForRequest({
        isPublicMode: true,
        isAuthenticated: false,
        email: null,
      });
      expect(role).toBe('public');
    });

    it('should return admin role for authenticated users', () => {
      // In single-user/owner mode, all authenticated users are admins
      const role = roleForRequest({
        isPublicMode: false,
        isAuthenticated: true,
        email: 'user@example.com',
      });
      expect(role).toBe('admin');
    });

    it('should return public role for unauthenticated users', () => {
      const role = roleForRequest({
        isPublicMode: false,
        isAuthenticated: false,
        email: null,
      });
      expect(role).toBe('public');
    });
  });

  describe('allowedClassifications', () => {
    it('should allow only public for public role', () => {
      const classifications = allowedClassifications('public');
      expect(classifications).toEqual(['public']);
    });

    it('should allow public and internal for user role', () => {
      const classifications = allowedClassifications('user');
      expect(classifications).toEqual(['public', 'internal']);
    });

    it('should allow all classifications for admin role', () => {
      const classifications = allowedClassifications('admin');
      expect(classifications).toEqual(['public', 'internal', 'restricted']);
    });
  });
});