import type { ComponentType } from 'react';
import { Hero } from '@/components/sections/Hero';
import { FeatureGrid } from '@/components/sections/FeatureGrid';
import { Testimonial } from '@/components/sections/Testimonial';
import { Cta } from '@/components/sections/Cta';
import type { SectionType } from '@/lib/schema';

/**
 * Single source of truth mapping a section `type` to the component that
 * renders it. This is intentionally the ONLY place that performs this
 * mapping — sectionTypeSchema (schema.ts) and this registry must be kept
 * in sync. If you remove an entry here without removing it from
 * sectionTypeSchema, TypeScript's `satisfies Record<SectionType, ...>`
 * check below fails to compile, which is the "removing a registry entry
 * breaks TS" guarantee from the sprint brief.
 */
export const sectionRegistry = {
  hero: Hero,
  featureGrid: FeatureGrid,
  testimonial: Testimonial,
  cta: Cta,
} satisfies Record<SectionType, ComponentType<{ props: unknown }>>;

export const registeredSectionTypes = Object.keys(sectionRegistry) as SectionType[];

export type SectionMeta = {
  type: SectionType;
  label: string;
  defaultProps: Record<string, unknown>;
};

/** Metadata used by the studio "Add section" UI. */
export const sectionMetaList: SectionMeta[] = [
  {
    type: 'hero',
    label: 'Hero',
    defaultProps: { heading: 'New Hero Heading', subheading: 'Supporting copy goes here.' },
  },
  {
    type: 'featureGrid',
    label: 'Feature Grid',
    defaultProps: {
      heading: 'Features',
      features: [{ title: 'Feature one', description: 'Describe the feature.' }],
    },
  },
  {
    type: 'testimonial',
    label: 'Testimonial',
    defaultProps: { quote: 'This product changed how we work.', author: 'Jane Doe', role: 'CTO' },
  },
  {
    type: 'cta',
    label: 'Call to Action',
    defaultProps: { label: 'Get started', url: '/signup', style: 'primary' },
  },
];
