import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_COOKIE, isValidRole } from '@/lib/rbac';

/**
 * DEV-ONLY role switcher. Real deployments would replace this with an
 * actual identity provider (e.g. NextAuth, Clerk, SSO) that issues a
 * signed session; `ROLE_COOKIE` would then be derived server-side from
 * that verified session instead of being settable by the client.
 *
 * This route intentionally sets an httpOnly cookie so RBAC enforcement
 * in middleware.ts and server actions can't be bypassed by editing
 * client-readable state.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const role = body.role;
  if (typeof role !== 'string' || !isValidRole(role)) {
    return NextResponse.json({ error: 'invalid-role' }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
