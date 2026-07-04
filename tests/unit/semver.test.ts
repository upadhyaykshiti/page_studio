import { describe, it, expect } from 'vitest';
import { diffPages, nextVersion } from '@/lib/semver';
import type { Page } from '@/lib/schema';

const basePage: Page = {
  pageId: 'p1',
  slug: 'home',
  title: 'Home',
  sections: [
    { id: 's1', type: 'hero', props: { heading: 'Hello' } },
    { id: 's2', type: 'cta', props: { label: 'Go', url: '/go', style: 'primary' } },
  ],
};

describe('diffPages', () => {
  it('returns minor bump for the very first publish', () => {
    const result = diffPages(null, basePage);
    expect(result.bump).toBe('minor');
  });

  it('returns null bump for an unchanged page (idempotent publish)', () => {
    const result = diffPages(basePage, structuredClone(basePage));
    expect(result.bump).toBeNull();
    expect(result.changes).toHaveLength(0);
  });

  it('returns patch bump for a text/prop value change', () => {
    const next = structuredClone(basePage);
    next.sections[0]!.props = { heading: 'Hello there' };
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('patch');
  });

  it('returns minor bump when a section is added', () => {
    const next = structuredClone(basePage);
    next.sections.push({ id: 's3', type: 'testimonial', props: { quote: 'Great', author: 'A' } });
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('minor');
  });

  it('returns minor bump when an optional prop is introduced', () => {
    const next = structuredClone(basePage);
    next.sections[0]!.props = { heading: 'Hello', subheading: 'New optional subheading' };
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('minor');
  });

  it('returns major bump when a section is removed', () => {
    const next = structuredClone(basePage);
    next.sections = next.sections.filter((s) => s.id !== 's2');
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('major');
  });

  it('returns major bump when a section type changes', () => {
    const next = structuredClone(basePage);
    next.sections[1]!.type = 'testimonial';
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('major');
  });

  it('returns major bump when a required prop key is removed', () => {
    const next = structuredClone(basePage);
    next.sections[1]!.props = { url: '/go', style: 'primary' }; // label removed
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('major');
  });

  it('escalates to the highest bump among multiple simultaneous changes', () => {
    const next = structuredClone(basePage);
    next.sections[0]!.props = { heading: 'Hello there' }; // patch
    next.sections.push({ id: 's3', type: 'testimonial', props: { quote: 'Great', author: 'A' } }); // minor
    next.sections = next.sections.filter((s) => s.id !== 's2'); // major
    const result = diffPages(basePage, next);
    expect(result.bump).toBe('major');
  });
});

describe('nextVersion', () => {
  it('starts new pages at 0.1.0', () => {
    expect(nextVersion(null, 'minor')).toBe('0.1.0');
  });

  it('does not change version when bump is null (idempotent)', () => {
    expect(nextVersion('1.2.3', null)).toBe('1.2.3');
  });

  it('increments patch/minor/major correctly', () => {
    expect(nextVersion('1.2.3', 'patch')).toBe('1.2.4');
    expect(nextVersion('1.2.3', 'minor')).toBe('1.3.0');
    expect(nextVersion('1.2.3', 'major')).toBe('2.0.0');
  });
});
