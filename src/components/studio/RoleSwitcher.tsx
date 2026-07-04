'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROLES, type Role } from '@/lib/rbac-shared';

export function RoleSwitcher() {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState<Role | null>(null);
  const router = useRouter();

  async function setRole(role: Role) {
    await fetch('/api/dev-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setCurrent(role);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Switch demo role">
      {ROLES.map((role) => (
        <Button
          key={role}
          type="button"
          variant={current === role ? 'default' : 'secondary'}
          onClick={() => setRole(role)}
          aria-pressed={current === role}
          disabled={pending}
        >
          {role}
        </Button>
      ))}
    </div>
  );
}
