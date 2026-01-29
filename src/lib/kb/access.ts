export type Classification = 'public' | 'internal' | 'restricted';

export type CallerRole = 'public' | 'user' | 'admin';

export function roleForRequest(opts: { isPublicMode: boolean; isAuthenticated: boolean; email?: string | null }): CallerRole {
  if (opts.isPublicMode || !opts.isAuthenticated) return 'public';

  const allowlist = (process.env.AKIOR_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const email = (opts.email || '').toLowerCase();

  if (allowlist.length > 0 && allowlist.includes(email)) return 'admin';

  const domain = (process.env.AKIOR_ADMIN_EMAIL_DOMAIN || '').trim().toLowerCase();
  if (domain && email.endsWith(`@${domain}`)) return 'admin';

  // Local-first default: treat authenticated users as "user".
  return 'user';
}

export function allowedClassifications(role: CallerRole): Classification[] {
  if (role === 'public') return ['public'];
  if (role === 'admin') return ['public', 'internal', 'restricted'];
  return ['public', 'internal'];
}
