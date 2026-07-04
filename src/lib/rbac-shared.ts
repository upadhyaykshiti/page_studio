/**
 * Role constants/helpers with NO dependency on next/headers, so they can
 * be safely imported from both server code (middleware, API routes) and
 * client components (e.g. the role switcher UI). Server-only helpers that
 * actually read the request/cookie store live in rbac.ts.
 */
export const ROLES = ['viewer', 'editor', 'publisher'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = { viewer: 0, editor: 1, publisher: 2 };

export const ROLE_COOKIE = 'ps_role';

export function hasAtLeastRole(current: Role, required: Role): boolean {
  return ROLE_RANK[current] >= ROLE_RANK[required];
}

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
