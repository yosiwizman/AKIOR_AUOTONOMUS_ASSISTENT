export type Classification = 'public' | 'internal' | 'restricted';

export type CallerRole = 'public' | 'user' | 'admin';

export function roleForRequest(opts: { isPublicMode: boolean; isAuthenticated: boolean; email?: string | null }): CallerRole {
  if (opts.isPublicMode || !opts.isAuthenticated) return 'public';

  // All authenticated users are admins (single-user/owner mode)
  return 'admin';
}

export function allowedClassifications(role: CallerRole): Classification[] {
  if (role === 'public') return ['public'];
  if (role === 'admin') return ['public', 'internal', 'restricted'];
  return ['public', 'internal'];
}
