'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateSectionProps } from '@/store/slices/draftPageSlice';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Per the sprint brief, prop editing is intentionally limited to:
 *   - Hero text (heading, subheading)
 *   - CTA label + URL
 * Other section types are selectable/reorderable but not deep-editable in
 * this pass — see README "What is incomplete and why".
 */
export function SectionEditor() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.ui.selectedSectionId);
  const section = useAppSelector((s) => s.draftPage.page?.sections.find((sec) => sec.id === selectedId));

  if (!section) {
    return <p className="text-sm text-muted-foreground">Select a section to edit its content.</p>;
  }

  function setProp(key: string, value: string) {
    if (!section) return;
    dispatch(updateSectionProps({ sectionId: section.id, props: { [key]: value } }));
  }

  if (section.type === 'hero') {
    const props = section.props as { heading?: string; subheading?: string };
    return (
      <fieldset className="space-y-4">
        <legend className="font-medium mb-2">Edit hero</legend>
        <div>
          <Label htmlFor="hero-heading">Heading</Label>
          <Input
            id="hero-heading"
            value={props.heading ?? ''}
            onChange={(e) => setProp('heading', e.target.value)}
            aria-describedby="hero-heading-hint"
          />
          <p id="hero-heading-hint" className="text-xs text-muted-foreground mt-1">
            Required. Shown as the page&apos;s main H1.
          </p>
        </div>
        <div>
          <Label htmlFor="hero-subheading">Subheading</Label>
          <Textarea
            id="hero-subheading"
            value={props.subheading ?? ''}
            onChange={(e) => setProp('subheading', e.target.value)}
            rows={3}
          />
        </div>
      </fieldset>
    );
  }

  if (section.type === 'cta') {
    const props = section.props as { label?: string; url?: string };
    return (
      <fieldset className="space-y-4">
        <legend className="font-medium mb-2">Edit call to action</legend>
        <div>
          <Label htmlFor="cta-label">Label</Label>
          <Input
            id="cta-label"
            value={props.label ?? ''}
            onChange={(e) => setProp('label', e.target.value)}
            aria-describedby="cta-label-hint"
          />
          <p id="cta-label-hint" className="text-xs text-muted-foreground mt-1">
            Required. Visible button text.
          </p>
        </div>
        <div>
          <Label htmlFor="cta-url">URL</Label>
          <Input
            id="cta-url"
            value={props.url ?? ''}
            onChange={(e) => setProp('url', e.target.value)}
            aria-describedby="cta-url-hint"
          />
          <p id="cta-url-hint" className="text-xs text-muted-foreground mt-1">
            Required. Where the button links to.
          </p>
        </div>
      </fieldset>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Editing for &ldquo;{section.type}&rdquo; sections isn&apos;t implemented yet — see README for scope
      notes. You can still reorder or remove this section.
    </p>
  );
}
