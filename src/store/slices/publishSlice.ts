import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Page } from '@/lib/schema';
import type { ReleaseSnapshot } from '@/lib/releases';

/**
 * publish: tracks the async publish request lifecycle (idle/loading/
 * succeeded/failed) plus the result, so the studio UI can show progress
 * and the resulting version/changelog without the draftPage slice needing
 * to know anything about the network.
 */
export type PublishState = {
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'no-op';
  error: string | null;
  lastSnapshot: ReleaseSnapshot | null;
  lastMessage: string | null;
};

const initialState: PublishState = {
  status: 'idle',
  error: null,
  lastSnapshot: null,
  lastMessage: null,
};

export const publishPage = createAsyncThunk<
  { status: 'published'; snapshot: ReleaseSnapshot } | { status: 'no-op'; message: string },
  Page,
  { rejectValue: string }
>('publish/publishPage', async (page, { rejectWithValue }) => {
  const response = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page }),
  });
  const data = await response.json();
  if (!response.ok) {
    return rejectWithValue(data.message || data.error || `Publish failed (${response.status})`);
  }
  if (data.status === 'no-op') {
    return { status: 'no-op' as const, message: data.message };
  }
  return { status: 'published' as const, snapshot: data.snapshot };
});

const publishSlice = createSlice({
  name: 'publish',
  initialState,
  reducers: {
    resetPublishState(state) {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(publishPage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(publishPage.fulfilled, (state, action) => {
        if (action.payload.status === 'no-op') {
          state.status = 'no-op';
          state.lastMessage = action.payload.message;
        } else {
          state.status = 'succeeded';
          state.lastSnapshot = action.payload.snapshot;
          state.lastMessage = `Published v${action.payload.snapshot.version}`;
        }
      })
      .addCase(publishPage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { resetPublishState } = publishSlice.actions;
export default publishSlice.reducer;
