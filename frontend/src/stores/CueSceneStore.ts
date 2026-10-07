import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { listCueScene, saveCueScene } from "../api/CueScene";
import type { CueScene } from "../types/CueScene";

export interface CueSceneState {
  rows: CueScene[];
  loading: boolean;
  error: string | null;
}

const initialState: CueSceneState = { rows: [], loading: false, error: null };

export const loadCueScenes = createAsyncThunk("cueScene/load", async () => listCueScene());

export const persistCueScene = createAsyncThunk("cueScene/save", async (payload: CueScene) =>
  saveCueScene(payload)
);

const cueSceneSlice = createSlice({
  name: "cueScene",
  initialState,
  reducers: {
    upsertCueScene(state, action: PayloadAction<CueScene>) {
      const index = state.rows.findIndex((row) => row.id === action.payload.id);
      if (index >= 0) state.rows[index] = action.payload;
      else state.rows.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCueScenes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCueScenes.fulfilled, (state, action) => {
        state.rows = action.payload;
        state.loading = false;
      })
      .addCase(loadCueScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "场景加载失败";
      })
      .addCase(persistCueScene.fulfilled, (state, action) => {
        const index = state.rows.findIndex((row) => row.id === action.payload.id);
        if (index >= 0) state.rows[index] = action.payload;
        else state.rows.push(action.payload);
      });
  }
});

export const { upsertCueScene } = cueSceneSlice.actions;
export const cueSceneReducer = cueSceneSlice.reducer;
