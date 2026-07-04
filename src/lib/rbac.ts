import { cookies } from 'next/headers';
import { ROLE_COOKIE, isValidRole, type Role } from '@/lib/rbac-shared';

export { ROLES, ROLE_COOKIE, hasAtLeastRole, isValidRole, type Role } from '@/lib/rbac-shared';

/**
 * Server-side (Server Component / Route Handler) read of the current
 * user's role. Defaults to "viewer". Import this only from server code —
 * client components should import from rbac-shared.ts instead.
 */
export function getCurrentRole(): Role {
  const raw = cookies().get(ROLE_COOKIE)?.value;
  if (raw && isValidRole(raw)) return raw;
  return 'viewer';
}
