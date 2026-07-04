import { fetchPageBySlug } from '@/lib/contentfulAdapter';
import { PageRenderer } from '@/components/PageRenderer';

export const dynamic = 'force-dynamic';

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { draft?: string };
}) {
  const preview = searchParams.draft === 'true';
  const result = await fetchPageBySlug(params.slug, { preview });

  if (!result.ok) {
    return (
      <main id="main-content" className="max-w-xl mx-auto py-24 px-6 text-center">
        <h1 className="text-2xl font-bold">
          {result.error === 'not-found' ? 'Page not found' : 'This page could not be rendered'}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {result.error === 'not-found' &&
            `No page exists for slug "${params.slug}".`}
          {result.error === 'invalid-schema' &&
            'The content for this page failed schema validation, so it was not rendered. No part of the app crashed.'}
          {result.error === 'fetch-failed' && 'The content source could not be reached. Please try again shortly.'}
        </p>
      </main>
    );
  }

  return (
    <>
      {/* <h1 className="sr-only">{result.page.title}</h1> */}
      <PageRenderer page={result.page} />
    </>
  );
}
