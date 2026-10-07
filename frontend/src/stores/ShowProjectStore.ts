import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { listShowProject } from "../api/ShowProject";
import type { ShowProject } from "../types/ShowProject";

export interface ShowProjectState {
  rows: ShowProject[];
  currentId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ShowProjectState = { rows: [], currentId: null, loading: false, error: null };

export const loadShowProjects = createAsyncThunk("showProject/load", async () => listShowProject());

const showProjectSlice = createSlice({
  name: "showProject",
  initialState,
  reducers: {
    selectProject(state, action: PayloadAction<number>) {
      state.currentId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadShowProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadShowProjects.fulfilled, (state, action) => {
        state.rows = action.payload;
        state.currentId = action.payload[0]?.id ?? null;
        state.loading = false;
      })
      .addCase(loadShowProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "演出方案加载失败";
      });
  }
});

export const { selectProject } = showProjectSlice.actions;
export const showProjectReducer = showProjectSlice.reducer;
