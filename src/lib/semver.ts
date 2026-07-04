import semverInc from 'semver/functions/inc';
import type { Page, Section } from '@/lib/schema';

/**
 * Deterministic diff between the last published release and the current
 * draft, producing a SemVer bump per the sprint brief's fixed rules:
 *
 *   patch -> text/prop change on an existing section
 *   minor -> section added, or an optional prop introduced
 *   major -> section removed, section type changed, or a required prop
 *            changed in a breaking way
 *
 * "No changes" is represented as bump = null so publish can be idempotent.
 */

export type BumpLevel = 'major' | 'minor' | 'patch' | null;

export type ChangeEntry = {
  kind: 'section-added' | 'section-removed' | 'section-type-changed' | 'props-changed';
  sectionId: string;
  detail: string;
  bump: Exclude<BumpLevel, null>;
};

export type DiffResult = {
  bump: BumpLevel;
  changes: ChangeEntry[];
};

function shallowPropsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(sortedKeys(a)) === JSON.stringify(sortedKeys(b));
}

// Stable stringify so key order never causes a false-positive diff.
function sortedKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      const value = obj[key];
      acc[key] =
        value && typeof value === 'object' && !Array.isArray(value)
          ? sortedKeys(value as Record<string, unknown>)
          : value;
      return acc;
    }, {} as Record<string, unknown>);
}

/**
 * A prop key is considered "required-ish" for major-bump purposes if it
 * was present in the previous version and is now missing, or if its
 * *presence* changed rather than just its value. We treat value-only
 * changes to existing keys as patch-level (text/prop edits), and
 * added/removed *keys* as more structural (minor if added, major if a
 * previously-present key is removed since consumers may depend on it).
 */
function diffSectionProps(prevProps: Record<string, unknown>, nextProps: Record<string, unknown>): ChangeEntry[] {
  if (shallowPropsEqual(prevProps, nextProps)) return [];

  const prevKeys = new Set(Object.keys(prevProps));
  const nextKeys = new Set(Object.keys(nextProps));
  const removedKeys = [...prevKeys].filter((k) => !nextKeys.has(k));
  const addedKeys = [...nextKeys].filter((k) => !prevKeys.has(k));
  const commonChangedKeys = [...prevKeys].filter(
    (k) => nextKeys.has(k) && JSON.stringify(prevProps[k]) !== JSON.stringify(nextProps[k])
  );

  if (removedKeys.length > 0) {
    return [
      {
        kind: 'props-changed',
        sectionId: '',
        detail: `Required prop(s) removed: ${removedKeys.join(', ')}`,
        bump: 'major',
      },
    ];
  }
  if (addedKeys.length > 0) {
    return [
      {
        kind: 'props-changed',
        sectionId: '',
        detail: `Optional prop(s) added: ${addedKeys.join(', ')}`,
        bump: 'minor',
      },
    ];
  }
  if (commonChangedKeys.length > 0) {
    return [
      {
        kind: 'props-changed',
        sectionId: '',
        detail: `Value changed for: ${commonChangedKeys.join(', ')}`,
        bump: 'patch',
      },
    ];
  }
  return [];
}

export function diffPages(previous: Page | null, next: Page): DiffResult {
  if (!previous) {
    return {
      bump: 'minor',
      changes: [{ kind: 'section-added', sectionId: 'all', detail: 'Initial publish', bump: 'minor' }],
    };
  }

  const changes: ChangeEntry[] = [];
  const prevById = new Map<string, Section>(previous.sections.map((s) => [s.id, s]));
  const nextById = new Map<string, Section>(next.sections.map((s) => [s.id, s]));

  for (const [id, prevSection] of prevById) {
    if (!nextById.has(id)) {
      changes.push({ kind: 'section-removed', sectionId: id, detail: `Section "${id}" removed`, bump: 'major' });
    }
  }

  for (const [id, nextSection] of nextById) {
    const prevSection = prevById.get(id);
    if (!prevSection) {
      changes.push({ kind: 'section-added', sectionId: id, detail: `Section "${id}" added`, bump: 'minor' });
      continue;
    }
    if (prevSection.type !== nextSection.type) {
      changes.push({
        kind: 'section-type-changed',
        sectionId: id,
        detail: `Type changed from "${prevSection.type}" to "${nextSection.type}"`,
        bump: 'major',
      });
      continue;
    }
    const propChanges = diffSectionProps(prevSection.props, nextSection.props).map((c) => ({
      ...c,
      sectionId: id,
    }));
    changes.push(...propChanges);
  }

  if (changes.length === 0) return { bump: null, changes: [] };

  const order = { major: 3, minor: 2, patch: 1 } as const;
  const highest = changes.reduce<Exclude<BumpLevel, null>>(
    (acc, c) => (order[c.bump] > order[acc] ? c.bump : acc),
    'patch'
  );
  return { bump: highest, changes };
}

/** Applies a SemVer bump to a "x.y.z" version string. Starts at 0.1.0. */
export function nextVersion(currentVersion: string | null, bump: BumpLevel): string {
  if (!currentVersion) return '0.1.0';
  if (!bump) return currentVersion; // idempotent: no change, no new version
  const result = semverInc(currentVersion, bump);
  if (!result) throw new Error(`Failed to increment version "${currentVersion}" with bump "${bump}"`);
  return result;
}
