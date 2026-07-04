import { z } from 'zod';

/**
 * Section prop schemas.
 * Each section type owns its own prop shape. New section types are added
 * here AND in sectionRegistry.ts — omitting either breaks the "removing a
 * registry entry breaks TS or renders fallback" requirement.
 */
export const heroPropsSchema = z.object({
  heading: z.string().min(1, 'Heading is required'),
  subheading: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const featureGridPropsSchema = z.object({
  heading: z.string().optional(),
  features: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .min(1, 'At least one feature is required'),
});

export const testimonialPropsSchema = z.object({
  quote: z.string().min(1, 'Quote is required'),
  author: z.string().min(1, 'Author is required'),
  role: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const ctaPropsSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  url: z.string().min(1, 'URL is required'),
  style: z.enum(['primary', 'secondary']).default('primary'),
});

export const sectionTypeSchema = z.enum(['hero', 'featureGrid', 'testimonial', 'cta']);
export type SectionType = z.infer<typeof sectionTypeSchema>;

// Map of type -> prop schema. Used for per-type validation (discriminated
// validation happens in validateSection below since props is unknown at
// the outer Section schema level, coming from Contentful/Redux as JSON).
export const sectionPropsSchemaMap = {
  hero: heroPropsSchema,
  featureGrid: featureGridPropsSchema,
  testimonial: testimonialPropsSchema,
  cta: ctaPropsSchema,
} as const;

export const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.string(), // validated narrowly below; kept loose here so unknown
  // types don't fail schema parsing outright — they fail at render time
  // via UnsupportedSection instead of crashing the whole page.
  props: z.record(z.unknown()),
});

export type Section = z.infer<typeof sectionSchema>;

export const pageSchema = z.object({
  pageId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  sections: z.array(sectionSchema),
});

export type Page = z.infer<typeof pageSchema>;

export type SectionValidationResult =
  | { ok: true; type: SectionType; props: unknown }
  | { ok: false; reason: 'unknown-type' | 'invalid-props'; errors?: z.ZodIssue[] };

/**
 * Validates a single section's props against its type-specific schema.
 * Never throws — callers use the discriminated result to decide whether
 * to render the real component or the UnsupportedSection fallback.
 */
export function validateSection(section: Section): SectionValidationResult {
  const parsedType = sectionTypeSchema.safeParse(section.type);
  if (!parsedType.success) {
    return { ok: false, reason: 'unknown-type' };
  }
  const schemaForType = sectionPropsSchemaMap[parsedType.data];
  const parsedProps = schemaForType.safeParse(section.props);
  if (!parsedProps.success) {
    return { ok: false, reason: 'invalid-props', errors: parsedProps.error.issues };
  }
  return { ok: true, type: parsedType.data, props: parsedProps.data };
}

/**
 * Validates an entire page payload (e.g. raw Contentful response or a
 * Redux draft) without throwing. Used by the preview route's error
 * boundary path and by unit tests.
 */
export function safeParsePage(data: unknown) {
  return pageSchema.safeParse(data);
}
