import { describe, it, expect } from 'vitest';
import { safeParsePage, validateSection } from '@/lib/schema';

describe('safeParsePage', () => {
  it('accepts a well-formed page', () => {
    const result = safeParsePage({
      pageId: 'p1',
      slug: 'home',
      title: 'Home',
      sections: [{ id: 's1', type: 'hero', props: { heading: 'Hi' } }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a page missing required top-level fields', () => {
    const result = safeParsePage({ slug: 'home' });
    expect(result.success).toBe(false);
  });

  it('does not throw on completely malformed input', () => {
    expect(() => safeParsePage(null)).not.toThrow();
    expect(() => safeParsePage(undefined)).not.toThrow();
    expect(() => safeParsePage('not-a-page')).not.toThrow();
  });
});

describe('validateSection', () => {
  it('flags unknown section types without throwing', () => {
    const result = validateSection({ id: 's1', type: 'carousel', props: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unknown-type');
  });

  it('flags invalid props for a known type', () => {
    const result = validateSection({ id: 's1', type: 'cta', props: { label: '' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-props');
  });

  it('accepts valid props for a known type', () => {
    const result = validateSection({
      id: 's1',
      type: 'hero',
      props: { heading: 'Welcome' },
    });
    expect(result.ok).toBe(true);
  });

  it('accepts a full featureGrid payload', () => {
    const result = validateSection({
      id: 's1',
      type: 'featureGrid',
      props: { heading: 'Features', features: [{ title: 'Fast' }] },
    });
    expect(result.ok).toBe(true);
  });
});
