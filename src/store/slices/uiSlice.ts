import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * ui: transient studio UI state that has nothing to do with page content
 * (selection, panel visibility). Kept separate from draftPage so page
 * content and editor chrome don't churn the same reducer / undo history.
 */
export type UiState = {
  selectedSectionId: string | null;
  isAddSectionPanelOpen: boolean;
};

const initialState: UiState = {
  selectedSectionId: null,
  isAddSectionPanelOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectSection(state, action: PayloadAction<string | null>) {
      state.selectedSectionId = action.payload;
    },
    setAddSectionPanelOpen(state, action: PayloadAction<boolean>) {
      state.isAddSectionPanelOpen = action.payload;
    },
  },
});

export const { selectSection, setAddSectionPanelOpen } = uiSlice.actions;
export default uiSlice.reducer;
