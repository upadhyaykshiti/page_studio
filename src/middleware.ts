import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_COOKIE, isValidRole, type Role } from '@/lib/rbac-shared';

const ROLE_RANK: Record<Role, number> = { viewer: 0, editor: 1, publisher: 2 };

function roleFrom(request: NextRequest): Role {
  const raw = request.cookies.get(ROLE_COOKIE)?.value ?? '';
  return isValidRole(raw) ? raw : 'viewer';
}

/**
 * Server-side (edge) enforcement of RBAC. This is the actual security
 * boundary — the UI hiding buttons for viewers is a courtesy, not a
 * control. Any direct request to a protected route/method is rejected
 * here regardless of what the client sends.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = roleFrom(request);

  if (pathname.startsWith('/studio')) {
    if (ROLE_RANK[role] < ROLE_RANK.editor) {
      const url = request.nextUrl.clone();
      url.pathname = '/forbidden';
      url.searchParams.set('required', 'editor');
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith('/api/publish')) {
    if (ROLE_RANK[role] < ROLE_RANK.publisher) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Publisher role required.' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/studio/:path*', '/api/publish/:path*'],
};
