import { promises as fs } from 'fs';
import path from 'path';
import type { Page } from '@/lib/schema';
import { diffPages, nextVersion, type ChangeEntry } from '@/lib/semver';

const RELEASES_ROOT = path.join(process.cwd(), 'releases');

export type ReleaseSnapshot = {
  version: string;
  publishedAt: string;
  page: Page;
  changelog: ChangeEntry[];
};

export type PublishResult =
  | { status: 'published'; snapshot: ReleaseSnapshot }
  | { status: 'no-op'; reason: 'no-changes-since-last-release'; currentVersion: string };

function releaseDir(slug: string) {
  return path.join(RELEASES_ROOT, slug);
}

function releaseFile(slug: string, version: string) {
  return path.join(releaseDir(slug), `${version}.json`);
}

async function listVersions(slug: string): Promise<string[]> {
  try {
    const files = await fs.readdir(releaseDir(slug));
    return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

export async function getLatestRelease(slug: string): Promise<ReleaseSnapshot | null> {
  const versions = await listVersions(slug);
  if (versions.length === 0) return null;
  const latest = versions.sort(compareSemver).at(-1)!;
  const raw = await fs.readFile(releaseFile(slug, latest), 'utf-8');
  return JSON.parse(raw) as ReleaseSnapshot;
}

export async function getRelease(slug: string, version: string): Promise<ReleaseSnapshot | null> {
  try {
    const raw = await fs.readFile(releaseFile(slug, version), 'utf-8');
    return JSON.parse(raw) as ReleaseSnapshot;
  } catch {
    return null;
  }
}

export async function listReleases(slug: string): Promise<ReleaseSnapshot[]> {
  const versions = await listVersions(slug);
  const snapshots = await Promise.all(versions.map((v) => getRelease(slug, v)));
  return snapshots.filter((s): s is ReleaseSnapshot => Boolean(s)).sort((a, b) => compareSemver(a.version, b.version));
}

/**
 * Freezes `draft` into an immutable, versioned release for `slug`.
 * Idempotent: publishing an unchanged draft does not create a new version
 * (returns status "no-op" instead), satisfying "same draft ≠ new version".
 * Snapshot files are never overwritten once written.
 */
export async function publishDraft(slug: string, draft: Page): Promise<PublishResult> {
  const latest = await getLatestRelease(slug);
  const diff = diffPages(latest?.page ?? null, draft);

  if (latest && diff.bump === null) {
    return { status: 'no-op', reason: 'no-changes-since-last-release', currentVersion: latest.version };
  }

  const version = nextVersion(latest?.version ?? null, diff.bump);
  const snapshot: ReleaseSnapshot = {
    version,
    publishedAt: new Date().toISOString(),
    page: draft,
    changelog: diff.changes,
  };

  await fs.mkdir(releaseDir(slug), { recursive: true });
  const filePath = releaseFile(slug, version);

  // Guard against accidental overwrite of an existing immutable snapshot.
  try {
    await fs.access(filePath);
    throw new Error(`Refusing to overwrite existing immutable release: ${filePath}`);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Refusing')) throw err;
    // ENOENT is expected (file doesn't exist yet) — proceed.
  }

  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return { status: 'published', snapshot };
}
