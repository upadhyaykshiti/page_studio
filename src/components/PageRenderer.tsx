'use client';

import React from 'react';
import type { Page, Section } from '@/lib/schema';
import { validateSection } from '@/lib/schema';
import { sectionRegistry } from '@/lib/sectionRegistry';
import { UnsupportedSection } from '@/components/sections/UnsupportedSection';

/**
 * Per-section error boundary. A single malformed/throwing section must
 * never take down the rest of the page.
 */
class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionType: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; sectionType: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Section render error:', this.props.sectionType, error);
  }
  render() {
    if (this.state.hasError) {
      return <UnsupportedSection type={this.props.sectionType} reason="This section failed to render." />;
    }
    return this.props.children;
  }
}

function RenderSection({ section }: { section: Section }) {
  const result = validateSection(section);
  if (!result.ok) {
    const reason =
      result.reason === 'unknown-type'
        ? 'No renderer is registered for this section type.'
        : `Invalid props: ${result.errors?.map((e) => e.message).join(', ')}`;
    return <UnsupportedSection type={section.type} reason={reason} />;
  }
  const Component = sectionRegistry[result.type];
  return (
    <SectionErrorBoundary sectionType={result.type}>
      <Component props={result.props} />
    </SectionErrorBoundary>
  );
}

export function PageRenderer({ page }: { page: Page }) {
  if (!page.sections.length) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        This page has no sections yet.
      </div>
    );
  }
  return (
    <main>
      {page.sections.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </main>
  );
}
