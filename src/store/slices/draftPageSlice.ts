import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import type { Page, Section, SectionType } from '@/lib/schema';

/**
 * draftPage: the single source of truth for the page currently being
 * edited in the studio. ALL mutations (add/reorder/edit) go through this
 * slice's reducers — components never mutate section arrays directly,
 * satisfying "No direct mutation outside Redux".
 */
export type DraftPageState = {
  page: Page | null;
  /** True once the draft differs from the last loaded/published snapshot. */
  isDirty: boolean;
};

const initialState: DraftPageState = {
  page: null,
  isDirty: false,
};

const draftPageSlice = createSlice({
  name: 'draftPage',
  initialState,
  reducers: {
    loadPage(state, action: PayloadAction<Page>) {
      state.page = action.payload;
      state.isDirty = false;
    },
    hydrateFromStorage(state, action: PayloadAction<Page | null>) {
      if (action.payload) {
        state.page = action.payload;
        state.isDirty = true; // a persisted draft is by definition unpublished changes
      }
    },
    addSection(state, action: PayloadAction<{ type: SectionType; defaultProps: Record<string, unknown> }>) {
      if (!state.page) return;
      const newSection: Section = {
        id: `sec-${nanoid(8)}`,
        type: action.payload.type,
        props: action.payload.defaultProps,
      };
      state.page.sections.push(newSection);
      state.isDirty = true;
    },
    removeSection(state, action: PayloadAction<{ sectionId: string }>) {
      if (!state.page) return;
      state.page.sections = state.page.sections.filter((s) => s.id !== action.payload.sectionId);
      state.isDirty = true;
    },
    reorderSections(state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) {
      if (!state.page) return;
      const { fromIndex, toIndex } = action.payload;
      const sections = state.page.sections;
      if (fromIndex < 0 || fromIndex >= sections.length || toIndex < 0 || toIndex >= sections.length) return;
      const moved = sections.splice(fromIndex, 1)[0];
      if (!moved) return;
      sections.splice(toIndex, 0, moved);
      state.isDirty = true;
    },
    updateSectionProps(
      state,
      action: PayloadAction<{ sectionId: string; props: Record<string, unknown> }>
    ) {
      if (!state.page) return;
      const section = state.page.sections.find((s) => s.id === action.payload.sectionId);
      if (!section) return;
      section.props = { ...section.props, ...action.payload.props };
      state.isDirty = true;
    },
    markClean(state) {
      state.isDirty = false;
    },
  },
});

export const {
  loadPage,
  hydrateFromStorage,
  addSection,
  removeSection,
  reorderSections,
  updateSectionProps,
  markClean,
} = draftPageSlice.actions;

export default draftPageSlice.reducer;
