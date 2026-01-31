import { roleForRequest } from './access';

export function assertAdmin(opts: { isAuthenticated: boolean; email?: string | null; isPublicMode?: boolean }) {
  // All authenticated users are admins (single-user/owner mode)
  if (!opts.isAuthenticated) {
    const err = new Error('Authentication required');
    (err as any).status = 401;
    throw err;
  }

  const role = roleForRequest({
    isPublicMode: Boolean(opts.isPublicMode),
    isAuthenticated: opts.isAuthenticated,
    email: opts.email,
  });

  return role;
}
