import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { listFixture, saveFixture } from "../api/Fixture";
import type { Fixture } from "../types/Fixture";

export interface FixtureState {
  rows: Fixture[];
  loading: boolean;
  error: string | null;
}

const initialState: FixtureState = { rows: [], loading: false, error: null };

export const loadFixtures = createAsyncThunk("fixture/load", async () => listFixture());

export const persistFixture = createAsyncThunk("fixture/save", async (payload: Fixture) =>
  saveFixture(payload)
);

const fixtureSlice = createSlice({
  name: "fixture",
  initialState,
  reducers: {
    upsertFixture(state, action: PayloadAction<Fixture>) {
      const index = state.rows.findIndex((row) => row.id === action.payload.id);
      if (index >= 0) state.rows[index] = action.payload;
      else state.rows.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFixtures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadFixtures.fulfilled, (state, action) => {
        state.rows = action.payload;
        state.loading = false;
      })
      .addCase(loadFixtures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "灯具加载失败";
      })
      .addCase(persistFixture.fulfilled, (state, action) => {
        const index = state.rows.findIndex((row) => row.id === action.payload.id);
        if (index >= 0) state.rows[index] = action.payload;
      });
  }
});

export const { upsertFixture } = fixtureSlice.actions;
export const fixtureReducer = fixtureSlice.reducer;
