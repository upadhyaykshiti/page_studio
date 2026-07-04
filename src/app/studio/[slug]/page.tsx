import { fetchPageBySlug } from '@/lib/contentfulAdapter';
import { StudioClient } from '@/components/studio/StudioClient';

export const dynamic = 'force-dynamic';

export default async function StudioPage({ params }: { params: { slug: string } }) {
  // Studio always edits the draft (preview: true) so editors see unpublished content.
  const result = await fetchPageBySlug(params.slug, { preview: true });

  console.log("=== STUDIO SERVER ===");
console.log("Fetched from:", process.env.CONTENT_SOURCE);
console.log(result);
console.log("====================");

  if (!result.ok) {
    return (
      <main id="main-content" className="max-w-xl mx-auto py-24 px-6 text-center">
        <h1 className="text-2xl font-bold">Cannot open studio</h1>
        <p className="mt-4 text-muted-foreground">
          {result.error === 'not-found'
            ? `No page exists for slug "${params.slug}".`
            : 'The source page failed validation or could not be fetched.'}
        </p>
      </main>
    );
  }

  return <StudioClient initialPage={result.page} />;
}
