'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { publishPage, resetPublishState } from '@/store/slices/publishSlice';
import { Button } from '@/components/ui/button';
import type { Role } from '@/lib/rbac';

export function PublishPanel() {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.draftPage.page);
  const publishState = useAppSelector((s) => s.publish);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    fetch('/api/whoami')
      .then((r) => r.json())
      .then((data) => setRole(data.role))
      .catch(() => setRole(null));
  }, [publishState.status]);

  const canPublish = role === 'publisher';

  return (
    <div aria-live="polite">
      <h2 className="font-medium mb-2">Publish</h2>
      {!canPublish ? (
        <p className="text-sm text-muted-foreground mb-2">
          Your current role (<strong>{role ?? '…'}</strong>) cannot publish. Switch to{' '}
          <strong>publisher</strong> on the home page to try this out. The server enforces this
          independently of what this button shows.
        </p>
      ) : null}
      <Button
        disabled={!page || !canPublish || publishState.status === 'loading'}
        onClick={() => page && dispatch(publishPage(page))}
      >
        {publishState.status === 'loading' ? 'Publishing…' : 'Publish'}
      </Button>

      {publishState.status === 'succeeded' && publishState.lastSnapshot ? (
        <div className="mt-4 rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Published v{publishState.lastSnapshot.version}</p>
          <ul className="mt-2 list-disc list-inside text-muted-foreground">
            {publishState.lastSnapshot.changelog.map((c, i) => (
              <li key={i}>
                [{c.bump}] {c.detail}
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="mt-2 px-2" onClick={() => dispatch(resetPublishState())}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {publishState.status === 'no-op' ? (
        <p className="mt-3 text-sm text-muted-foreground">{publishState.lastMessage}</p>
      ) : null}

      {publishState.status === 'failed' ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {publishState.error}
        </p>
      ) : null}
    </div>
  );
}
