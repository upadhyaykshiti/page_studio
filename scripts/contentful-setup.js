/**
 * One-time setup script: creates the "page" and "section" content types in
 * your Contentful space (matching exactly what src/lib/contentfulAdapter.ts
 * expects) and seeds them with the same sample content as
 * src/lib/mockContentfulData.ts, so real Contentful and mock mode produce
 * identical results on first run.
 *
 * Usage:
 *   CONTENTFUL_SPACE_ID=xxx \
 *   CONTENTFUL_ENVIRONMENT=master \
 *   CONTENTFUL_MANAGEMENT_TOKEN=xxx \
 *   node scripts/contentful-setup.js
 *
 * Safe to re-run: it skips creating a content type/entry that already
 * exists instead of erroring or duplicating.
 */

require("dotenv").config({ path: ".env.local" });
const contentful = require('contentful-management');

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT || 'master';
const MANAGEMENT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !MANAGEMENT_TOKEN) {
  console.error(
    'Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN.\n' +
      'Get a management token from: Contentful web app -> Settings -> API keys -> Content management tokens.'
  );
  process.exit(1);
}

async function getOrCreateContentType(environment, id, definition) {
  try {
    const existing = await environment.getContentType(id);
    console.log(`Content type "${id}" already exists — skipping creation.`);
    return existing;
  } catch (err) {
    if (err.name !== 'NotFound') throw err;
  }
  console.log(`Creating content type "${id}"...`);
  const contentType = await environment.createContentTypeWithId(id, definition);
  await contentType.publish();
  console.log(`Published content type "${id}".`);
  return contentType;
}

async function getOrCreateEntry(environment, contentTypeId, entryId, fields) {
  try {
    const existing = await environment.getEntry(entryId);
    console.log(`Entry "${entryId}" already exists — skipping creation.`);
    return existing;
  } catch (err) {
    if (err.name !== 'NotFound') throw err;
  }
  console.log(`Creating entry "${entryId}" (${contentTypeId})...`);
  const entry = await environment.createEntryWithId(contentTypeId, entryId, { fields });
  await entry.publish();
  console.log(`Published entry "${entryId}".`);
  return entry;
}

async function main() {
  const client = contentful.createClient({ accessToken: MANAGEMENT_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENVIRONMENT_ID);

  // --- Content types -------------------------------------------------

  await getOrCreateContentType(environment, 'section', {
    name: 'Section',
    displayField: 'sectionId',
    fields: [
      { id: 'sectionId', name: 'Section ID', type: 'Symbol', required: true },
      {
        id: 'sectionType',
        name: 'Section Type',
        type: 'Symbol',
        required: true,
        validations: [{ in: ['hero', 'featureGrid', 'testimonial', 'cta'] }],
      },
      { id: 'props', name: 'Props (JSON)', type: 'Object', required: true },
    ],
  });

  await getOrCreateContentType(environment, 'page', {
    name: 'Page',
    displayField: 'title',
    fields: [
      { id: 'pageId', name: 'Page ID', type: 'Symbol', required: true },
      { id: 'slug', name: 'Slug', type: 'Symbol', required: true },
      { id: 'title', name: 'Title', type: 'Symbol', required: true },
      {
        id: 'sections',
        name: 'Sections',
        type: 'Array',
        items: { type: 'Link', linkType: 'Entry', validations: [{ linkContentType: ['section'] }] },
      },
    ],
  });

  // --- Seed content: "home" page (mirrors mockContentfulData.ts) -----

  const localeField = (value) => ({ 'en-US': value });

  const heroEntry = await getOrCreateEntry(environment, 'section', 'seed-sec-hero-1', {
    sectionId: localeField('sec-hero-1'),
    sectionType: localeField('hero'),
    props: localeField({
      heading: 'Ship landing pages without shipping code',
      subheading: 'Page Studio lets editors build, preview, and publish pages backed by Contentful.',
    }),
  });

  const featuresEntry = await getOrCreateEntry(environment, 'section', 'seed-sec-features-1', {
    sectionId: localeField('sec-features-1'),
    sectionType: localeField('featureGrid'),
    props: localeField({
      heading: 'Everything you need',
      features: [
        { title: 'Schema-validated sections', description: 'Zod catches bad data before it renders.' },
        { title: 'Immutable releases', description: 'Every publish is a versioned, replayable snapshot.' },
        { title: 'RBAC built in', description: 'Viewers, editors, and publishers see exactly what they should.' },
      ],
    }),
  });

  const testimonialEntry = await getOrCreateEntry(environment, 'section', 'seed-sec-testimonial-1', {
    sectionId: localeField('sec-testimonial-1'),
    sectionType: localeField('testimonial'),
    props: localeField({
      quote: 'We cut our landing page turnaround from days to minutes.',
      author: 'Priya Shah',
      role: 'Head of Growth',
    }),
  });

  const ctaEntry = await getOrCreateEntry(environment, 'section', 'seed-sec-cta-1', {
    sectionId: localeField('sec-cta-1'),
    sectionType: localeField('cta'),
    props: localeField({ label: 'Try the studio', url: '/studio/home', style: 'primary' }),
  });

  await getOrCreateEntry(environment, 'page', 'seed-page-home', {
    pageId: localeField('ctf-home-001'),
    slug: localeField('home'),
    title: localeField('Home'),
    sections: localeField([
      { sys: { type: 'Link', linkType: 'Entry', id: heroEntry.sys.id } },
      { sys: { type: 'Link', linkType: 'Entry', id: featuresEntry.sys.id } },
      { sys: { type: 'Link', linkType: 'Entry', id: testimonialEntry.sys.id } },
      { sys: { type: 'Link', linkType: 'Entry', id: ctaEntry.sys.id } },
    ]),
  });

  console.log('\nDone. Set CONTENT_SOURCE=contentful in .env.local and restart the dev server.');
}

main().catch((err) => {
  console.error('Setup failed:', err.message || err);
  process.exit(1);
});
