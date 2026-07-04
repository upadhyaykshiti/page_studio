// import type { Page } from '@/lib/schema';

// /**
//  * Local fixtures used when CONTENT_SOURCE=mock. Shaped identically to what
//  * contentfulAdapter.ts produces from a real Contentful response, so
//  * swapping between mock and real data is invisible to every consumer.
//  */
// const pages: Record<string, Page> = {
//   home: {
//     pageId: 'ctf-home-001',
//     slug: 'home',
//     title: 'Home',
//     sections: [
//       {
//         id: 'sec-hero-1',
//         type: 'hero',
//         props: {
//           heading: 'Ship landing pages without shipping code',
//           subheading: 'Page Studio lets editors build, preview, and publish pages backed by Contentful.',
//         },
//       },
//       {
//         id: 'sec-features-1',
//         type: 'featureGrid',
//         props: {
//           heading: 'Everything you need',
//           features: [
//             { title: 'Schema-validated sections', description: 'Zod catches bad data before it renders.' },
//             { title: 'Immutable releases', description: 'Every publish is a versioned, replayable snapshot.' },
//             { title: 'RBAC built in', description: 'Viewers, editors, and publishers see exactly what they should.' },
//           ],
//         },
//       },
//       {
//         id: 'sec-testimonial-1',
//         type: 'testimonial',
//         props: {
//           quote: 'We cut our landing page turnaround from days to minutes.',
//           author: 'Priya Shah',
//           role: 'Head of Growth',
//         },
//       },
//       {
//         id: 'sec-cta-1',
//         type: 'cta',
//         props: { label: 'Try the studio', url: '/studio/home', style: 'primary' },
//       },
//     ],
//   },
//   broken: {
//     pageId: 'ctf-broken-002',
//     slug: 'broken',
//     title: 'Broken (demo of graceful failure)',
//     sections: [
//       { id: 'sec-1', type: 'hero', props: { heading: 'This one is fine' } },
//       // Unknown type -> should render UnsupportedSection, not crash.
//       { id: 'sec-2', type: 'carousel', props: { slides: [] } },
//       // Known type, invalid props -> should also render UnsupportedSection.
//       { id: 'sec-3', type: 'cta', props: { label: '' } },
//     ],
//   },
// };

// export function getMockPage(slug: string): Page | null {
//   return pages[slug] ?? null;
// }

// export function listMockSlugs(): string[] {
//   return Object.keys(pages);
// }
