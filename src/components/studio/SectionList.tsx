'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { reorderSections, removeSection } from '@/store/slices/draftPageSlice';
import { selectSection } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { sectionMetaList } from '@/lib/sectionRegistry';

/**
 * Reordering is exposed via explicit "Move up" / "Move down" buttons
 * rather than drag-and-drop-only, so the studio is fully keyboard
 * operable per the WCAG 2.2 AAA requirement — drag-and-drop alone would
 * exclude keyboard and switch-device users.
 */
export function SectionList() {
  const dispatch = useAppDispatch();
  const sections = useAppSelector((s) => s.draftPage.page?.sections ?? []);
  const selectedId = useAppSelector((s) => s.ui.selectedSectionId);

  const labelFor = (type: string) => sectionMetaList.find((m) => m.type === type)?.label ?? type;

  return (
    <nav aria-label="Page sections">
      <ol className="space-y-2 list-none">
        {sections.map((section, index) => (
          <li key={section.id}>
            <div
              className={`flex items-center justify-between gap-2 rounded-md border p-2 ${
                selectedId === section.id ? 'border-primary' : 'border-border'
              }`}
            >
              <button
                type="button"
                className="flex-1 text-left text-sm font-medium truncate"
                onClick={() => dispatch(selectSection(section.id))}
                aria-current={selectedId === section.id}
              >
                {labelFor(section.type)}{' '}
                <span className="text-muted-foreground font-normal">#{index + 1}</span>
              </button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  className="px-2 py-1"
                  aria-label={`Move ${labelFor(section.type)} section up`}
                  disabled={index === 0}
                  onClick={() => dispatch(reorderSections({ fromIndex: index, toIndex: index - 1 }))}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  className="px-2 py-1"
                  aria-label={`Move ${labelFor(section.type)} section down`}
                  disabled={index === sections.length - 1}
                  onClick={() => dispatch(reorderSections({ fromIndex: index, toIndex: index + 1 }))}
                >
                  ↓
                </Button>
                <Button
                  variant="destructive"
                  className="px-2 py-1"
                  aria-label={`Remove ${labelFor(section.type)} section`}
                  onClick={() => dispatch(removeSection({ sectionId: section.id }))}
                >
                  Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
