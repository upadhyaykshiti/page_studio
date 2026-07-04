import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentRole, hasAtLeastRole } from '@/lib/rbac';
import { safeParsePage } from '@/lib/schema';
import { publishDraft } from '@/lib/releases';

/**
 * Publish endpoint. Middleware already blocks non-publishers at the edge;
 * this second check is defense-in-depth in case middleware config ever
 * drifts from this route (e.g. matcher typo) — the route never trusts
 * that it was only reached by an authorized caller.
 */
export async function POST(request: NextRequest) {
  const role = getCurrentRole();
  if (!hasAtLeastRole(role, 'publisher')) {
    return NextResponse.json({ error: 'forbidden', message: 'Publisher role required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = safeParsePage(body?.page);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid-schema', issues: parsed.error.issues }, { status: 400 });
  }

  const result = await publishDraft(parsed.data.slug, parsed.data);
  if (result.status === 'no-op') {
    return NextResponse.json(
      { status: 'no-op', message: 'Draft is unchanged since last release.', currentVersion: result.currentVersion },
      { status: 200 }
    );
  }
  return NextResponse.json({ status: 'published', snapshot: result.snapshot }, { status: 201 });
}
