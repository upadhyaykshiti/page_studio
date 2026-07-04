import { NextResponse } from 'next/server';
import { getCurrentRole } from '@/lib/rbac';

/**
 * Returns the caller's role for UI purposes only (e.g. disabling the
 * Publish button for non-publishers). This is NOT the security boundary —
 * that's middleware.ts + the server-side check inside /api/publish. A
 * client spoofing this response cannot gain any actual privilege.
 */
export async function GET() {
  return NextResponse.json({ role: getCurrentRole() });
}
