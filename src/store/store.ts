import { configureStore, type Middleware } from '@reduxjs/toolkit';
import draftPageReducer from '@/store/slices/draftPageSlice';
import uiReducer from '@/store/slices/uiSlice';
import publishReducer from '@/store/slices/publishSlice';

const DRAFT_STORAGE_KEY_PREFIX = 'page-studio:draft:';

/**
 * Persists the current draft to localStorage after every action so a
 * reload doesn't lose unpublished edits ("Draft persists (reload safe)").
 * Persistence is keyed by slug so multiple pages don't clobber each other.
 */
const persistDraftMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  if (typeof window !== 'undefined') {
    const draft = (store.getState() as { draftPage: { page: { slug: string } | null } }).draftPage.page;
    if (draft?.slug) {
      window.localStorage.setItem(`${DRAFT_STORAGE_KEY_PREFIX}${draft.slug}`, JSON.stringify(draft));
    }
  }
  return result;
};

export function loadPersistedDraft(slug: string) {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`${DRAFT_STORAGE_KEY_PREFIX}${slug}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPersistedDraft(slug: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem(
    `${DRAFT_STORAGE_KEY_PREFIX}${slug}`
  );
}

export function makeStore() {
  return configureStore({
    reducer: {
      draftPage: draftPageReducer,
      ui: uiReducer,
      publish: publishReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistDraftMiddleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
