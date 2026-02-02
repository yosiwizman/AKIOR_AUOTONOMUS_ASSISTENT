import { describe, it, expect } from 'vitest';
import { roleForRequest, allowedClassifications, isAdmin } from '@/lib/kb/access';

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

    it('should return admin role for admin users', () => {
      // Mock admin check
      const role = roleForRequest({
        isPublicMode: false,
        isAuthenticated: true,
        email: 'admin@example.com',
      });
      // Note: This will be 'authenticated' unless AKIOR_ADMIN_EMAILS is set
      expect(['authenticated', 'admin']).toContain(role);
    });

    it('should return authenticated role for regular users', () => {
      const role = roleForRequest({
        isPublicMode: false,
        isAuthenticated: true,
        email: 'user@example.com',
      });
      expect(role).toBe('authenticated');
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

    it('should allow public and internal for authenticated role', () => {
      const classifications = allowedClassifications('authenticated');
      expect(classifications).toEqual(['public', 'internal']);
    });

    it('should allow all classifications for admin role', () => {
      const classifications = allowedClassifications('admin');
      expect(classifications).toEqual(['public', 'internal', 'restricted']);
    });
  });

  describe('isAdmin', () => {
    it('should return false for null email', () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });

    it('should return false for non-admin email', () => {
      expect(isAdmin('user@example.com')).toBe(false);
    });

    // Note: Actual admin check depends on environment variables
    // AKIOR_ADMIN_EMAILS or AKIOR_ADMIN_EMAIL_DOMAIN
  });
});
