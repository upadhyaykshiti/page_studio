import { createClient, type ContentfulClientApi } from 'contentful';

/**
 * Thin wrapper around the official `contentful` SDK. This is the ONLY file
 * that is allowed to import from `contentful` or read Contentful env vars.
 * Everything else (UI, routes, studio) talks to contentfulAdapter.ts, which
 * returns app-shaped `Page` objects — never raw Contentful entries.
 */

let deliveryClient: ContentfulClientApi<undefined> | null = null;
let previewClient: ContentfulClientApi<undefined> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var "${name}". Set CONTENT_SOURCE=mock to develop without a real Contentful space, ` +
        `or provide Contentful credentials in .env.local (see .env.example).`
    );
  }
  return value;
}

/**
 * Returns a memoized Contentful client.
 * @param preview when true, uses the Preview API (draft content); otherwise
 * uses the Delivery API (published content only).
 */
export function getContentfulClient(preview: boolean): ContentfulClientApi<undefined> {
  if (preview) {
    if (!previewClient) {
      previewClient = createClient({
        space: requireEnv('CONTENTFUL_SPACE_ID'),
        environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
        accessToken: requireEnv('CONTENTFUL_PREVIEW_TOKEN'),
        host: 'preview.contentful.com',
      });
    }
    return previewClient;
  }
  if (!deliveryClient) {
    deliveryClient = createClient({
      space: requireEnv('CONTENTFUL_SPACE_ID'),
      environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
      accessToken: requireEnv('CONTENTFUL_DELIVERY_TOKEN'),
      host: 'cdn.contentful.com',
    });
  }
  return deliveryClient;
}

export function isMockMode(): boolean {
  //return (process.env.CONTENT_SOURCE || 'mock') === 'mock';

  const source = process.env.CONTENT_SOURCE || 'mock';
  const mock = source === 'mock';

  console.log('==============================');
  console.log('[Contentful]');
  console.log('CONTENT_SOURCE:', source);
  console.log('Using:', mock ? 'MOCK DATA' : 'REAL CONTENTFUL');
  console.log('==============================');

  return mock;

}
