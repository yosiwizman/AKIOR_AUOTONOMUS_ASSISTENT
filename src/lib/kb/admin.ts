import { roleForRequest } from './access';

export function assertAdmin(opts: { isAuthenticated: boolean; email?: string | null; isPublicMode?: boolean }) {
  const role = roleForRequest({
    isPublicMode: Boolean(opts.isPublicMode),
    isAuthenticated: opts.isAuthenticated,
    email: opts.email,
  });

  if (role !== 'admin') {
    const err = new Error('Admin privileges required');
    (err as any).status = 403;
    throw err;
  }

  return role;
}
