import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  createTimelineTrack,
  listTimelineTrack,
  saveTimelineTrack
} from "../api/TimelineTrack";
import type { TimelineTrack, TimelineTrackEdit } from "../types/TimelineTrack";
import type { FieldDiff } from "../constants/errorMessages";

export interface SaveFailure {
  code: string;
  message: string;
  /** TRACK_VERSION_CONFLICT 时的核对信息 */
  conflict?: {
    current: TimelineTrack;
    attempted: TimelineTrackEdit;
    diff: FieldDiff[];
  };
}

export interface TimelineTrackState {
  rows: TimelineTrack[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** 最近一次保存结果（成功或被乐观锁拒绝），供页面展示差异 */
  lastFailure: SaveFailure | null;
  lastSaved: { id: number; version: number; at: string } | null;
}

const initialState: TimelineTrackState = {
  rows: [],
  loading: false,
  saving: false,
  error: null,
  lastFailure: null,
  lastSaved: null
};

export const loadTracks = createAsyncThunk("timelineTrack/load", async () => listTimelineTrack());

export interface SaveTrackArg {
  edit: TimelineTrackEdit;
  force?: boolean;
}

/** 保存轨道；rejectWithValue 保留冲突差异给页面，晚到的一版不会被静默吞掉 */
export const saveTrack = createAsyncThunk<
  TimelineTrack,
  SaveTrackArg,
  { rejectValue: SaveFailure }
>("timelineTrack/save", async (arg, thunkApi) => {
  try {
    return await saveTimelineTrack(arg.edit, { force: arg.force });
  } catch (error) {
    const code = (error as { code?: string }).code ?? "VALIDATION_FAILED";
    const detail = (error as { detail?: unknown }).detail;
    const conflict =
      code === "TRACK_VERSION_CONFLICT" && detail && typeof detail === "object"
        ? {
            current: (detail as { current: TimelineTrack }).current,
            attempted: arg.edit,
            diff: (detail as { diff: FieldDiff[] }).diff
          }
        : undefined;
    return thunkApi.rejectWithValue({
      code,
      message: (error as Error).message,
      conflict
    });
  }
});

export const createTrack = createAsyncThunk(
  "timelineTrack/create",
  async (arg: { draft: Parameters<typeof createTimelineTrack>[0]; editor: string }) =>
    createTimelineTrack(arg.draft, arg.editor)
);

const timelineTrackSlice = createSlice({
  name: "timelineTrack",
  initialState,
  reducers: {
    clearSaveFeedback(state) {
      state.lastFailure = null;
      state.lastSaved = null;
    },
    replaceTrack(state, action: PayloadAction<TimelineTrack>) {
      const index = state.rows.findIndex((row) => row.id === action.payload.id);
      if (index >= 0) state.rows[index] = action.payload;
      else state.rows.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTracks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTracks.fulfilled, (state, action) => {
        state.rows = action.payload;
        state.loading = false;
      })
      .addCase(loadTracks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "轨道加载失败";
      })
      .addCase(saveTrack.pending, (state) => {
        state.saving = true;
        state.lastFailure = null;
      })
      .addCase(saveTrack.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.rows.findIndex((row) => row.id === action.payload.id);
        if (index >= 0) state.rows[index] = action.payload;
        state.lastSaved = {
          id: action.payload.id,
          version: action.payload.version,
          at: action.payload.updated_at
        };
      })
      .addCase(saveTrack.rejected, (state, action) => {
        state.saving = false;
        state.lastFailure = action.payload ?? {
          code: "VALIDATION_FAILED",
          message: action.error.message ?? "保存失败"
        };
      })
      .addCase(createTrack.fulfilled, (state, action) => {
        state.rows.push(action.payload);
      });
  }
});

export const { clearSaveFeedback, replaceTrack } = timelineTrackSlice.actions;
export const timelineTrackReducer = timelineTrackSlice.reducer;
