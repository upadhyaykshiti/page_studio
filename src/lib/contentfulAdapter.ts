import type { Entry, EntrySkeletonType } from 'contentful';
import { getContentfulClient, isMockMode } from '@/lib/contentfulClient';
import { getMockPage } from '@/lib/mockContentfulData';
import { safeParsePage, type Page } from '@/lib/schema';

/**
 * contentfulAdapter.ts is the ONLY module the rest of the app talks to for
 * page data. It hides:
 *   - whether we're in mock mode or hitting real Contentful
 *   - draft vs published (preview) API selection
 *   - the shape of raw Contentful entries (content type field names, etc.)
 *
 * UI components and routes only ever see `Page` / see a `safeParsePage`
 * result — never a Contentful `Entry`.
 */

export type FetchOptions = {
  /** true = Preview API / draft content, false = Delivery API / published only */
  preview?: boolean;
};

type ContentfulSectionFields = {
  sectionId: string;
  sectionType: string;
  props: Record<string, unknown>;
};

type ContentfulPageFields = {
  pageId: string;
  slug: string;
  title: string;
  sections?: Entry<EntrySkeletonType>[];
};

/** Maps a raw Contentful "page" entry into our app-shaped Page. Never throws. */
function mapEntryToPage(entry: Entry<EntrySkeletonType>): unknown {
  const fields = entry.fields as unknown as ContentfulPageFields;
  return {
    pageId: fields.pageId ?? entry.sys.id,
    slug: fields.slug,
    title: fields.title,
    sections: (fields.sections ?? []).map((s) => {
      const sf = s.fields as unknown as ContentfulSectionFields;
      return {
        id: sf.sectionId ?? s.sys.id,
        type: sf.sectionType,
        props: sf.props ?? {},
      };
    }),
  };
}

export type PageFetchResult =
  | { ok: true; page: Page }
  | { ok: false; error: 'not-found' | 'invalid-schema' | 'fetch-failed'; details?: unknown };

/**
 * Fetches a single page by slug, from either mock fixtures or real
 * Contentful, and validates the result before returning it. This is the
 * single choke point that guarantees the rest of the app never sees
 * malformed page data.
 */
export async function fetchPageBySlug(slug: string, options: FetchOptions = {}): Promise<PageFetchResult> {
  const preview = options.preview ?? false;

  if (isMockMode()) {
    const page = getMockPage(slug);
    if (!page) return { ok: false, error: 'not-found' };
    const parsed = safeParsePage(page);
    if (!parsed.success) return { ok: false, error: 'invalid-schema', details: parsed.error.issues };
    return { ok: true, page: parsed.data };
  }

  try {
    const client = getContentfulClient(preview);
    const response = await client.getEntries({
      content_type: 'page',
      'fields.slug': slug,
      include: 2,
      limit: 1,
    } as never);

    const entry = response.items[0];
    if (!entry) return { ok: false, error: 'not-found' };

    const raw = mapEntryToPage(entry as Entry<EntrySkeletonType>);
    const parsed = safeParsePage(raw);
    if (!parsed.success) return { ok: false, error: 'invalid-schema', details: parsed.error.issues };
    return { ok: true, page: parsed.data };
  } catch (err) {
    return { ok: false, error: 'fetch-failed', details: err instanceof Error ? err.message : err };
  }
}

/** Lists slugs available in the current content source (used by nav/demo). */
export async function listAvailableSlugs(): Promise<string[]> {
  if (isMockMode()) {
    const { listMockSlugs } = await import('@/lib/mockContentfulData');
    return listMockSlugs();
  }
  try {
    const client = getContentfulClient(false);
    const response = await client.getEntries({ content_type: 'page', select: ['fields.slug'] } as never);
    return response.items
      .map((item) => (item.fields as unknown as { slug?: string }).slug)
      .filter((s): s is string => Boolean(s));
  } catch {
    return [];
  }
}
