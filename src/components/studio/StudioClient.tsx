'use client';

import { useEffect, useState } from 'react';
import type { Page } from '@/lib/schema';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadPage, hydrateFromStorage } from '@/store/slices/draftPageSlice';
import { loadPersistedDraft, clearPersistedDraft } from '@/store/store';
import { SectionList } from '@/components/studio/SectionList';
import { AddSectionPanel } from '@/components/studio/AddSectionPanel';
import { SectionEditor } from '@/components/studio/SectionEditor';
import { PublishPanel } from '@/components/studio/PublishPanel';
import { PageRenderer } from '@/components/PageRenderer';
import { Button } from '@/components/ui/button';

export function StudioClient({ initialPage }: { initialPage: Page }) {
  const dispatch = useAppDispatch();
  const page = useAppSelector((s) => s.draftPage.page);
  const isDirty = useAppSelector((s) => s.draftPage.isDirty);
  const [pendingDraft, setPendingDraft] = useState<Page | null>(null);

  // On mount: prefer a persisted (reload-safe) local draft for this slug if
  // one exists, otherwise fall back to the server-loaded page.
  // useEffect(() => {
  //     console.log("Initial page from server:", initialPage);

  //   dispatch(loadPage(initialPage));
  //   const persisted = loadPersistedDraft(initialPage.slug);
  //     console.log("Persisted draft:", persisted);

  //   if (persisted) {
  //         console.log("Hydrating from localStorage...");

  //     dispatch(hydrateFromStorage(persisted));
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [initialPage.slug]);

  useEffect(() => {
  dispatch(loadPage(initialPage));

  const persisted = loadPersistedDraft(initialPage.slug);

  if (persisted) {
    setPendingDraft(persisted);
  }
}, [dispatch, initialPage]);

function resumeDraft() {
  if (!pendingDraft) return;

  dispatch(hydrateFromStorage(pendingDraft));
  setPendingDraft(null);
}

function discardDraft() {
  //localStorage.removeItem(`page-studio:draft:${initialPage.slug}`);
  clearPersistedDraft(initialPage.slug);
  setPendingDraft(null);
}



  if (!page) return null;

  return (
    <>
  {pendingDraft && (
  <div className="border border-yellow-400 bg-yellow-50 rounded-md p-4">
    <p className="font-semibold">
      A local draft was found.
    </p>

    <p className="text-sm text-muted-foreground mt-1">
      Resume your unpublished draft or discard it and continue editing the
      latest Contentful content.
    </p>

    <div className="flex gap-2 mt-3">
      <Button onClick={resumeDraft}>
        Resume Draft
      </Button>

      <Button
        variant="secondary"
        onClick={discardDraft}
      >
        Discard Draft
      </Button>
    </div>
  </div>
)}

    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] min-h-screen">
      <aside className="border-r border-border p-4 space-y-8" aria-label="Section structure">
        <div>
          <h1 className="font-semibold text-lg">{page.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isDirty ? 'Unsaved changes (saved locally)' : 'No unsaved changes'}
          </p>
        </div>
        <SectionList />
        <AddSectionPanel />
      </aside>

      <section id="main-content" aria-label="Live preview" className="overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-2 text-xs text-muted-foreground">
          Live preview — reflects your current draft
        </div>
        <PageRenderer page={page} />
      </section>

      <aside className="border-l border-border p-4 space-y-8" aria-label="Section editor and publish">
        <SectionEditor />
        <div className="border-t border-border pt-4">
          <PublishPanel />
        </div>
      </aside>
    </div>
    </>
  );
  
}
