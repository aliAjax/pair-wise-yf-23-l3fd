import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ReconciledFrame } from "../types/timeline";
import { DMX_UNIVERSE_CAPACITY } from "../constants/dmx";

/**
 * 时间轴播放与重算闸门状态。
 * recomputing=true 表示叠加帧尚未算完：舞台预览必须暂停，
 * 播放按钮禁用——“没算完不能接着播”。
 */
export interface PlaybackState {
  time_ms: number;
  playing: boolean;
  recomputing: boolean;
  /** 本次重算针对的数据版本，用于判断结果是否过期 */
  dataVersion: number;
  frame: ReconciledFrame | null;
  lastComputeMs: number | null;
  overflowBannerDismissed: boolean;
  universeCapacity: number;
}

const initialState: PlaybackState = {
  time_ms: 0,
  playing: false,
  recomputing: false,
  dataVersion: 0,
  frame: null,
  lastComputeMs: null,
  overflowBannerDismissed: false,
  universeCapacity: DMX_UNIVERSE_CAPACITY
};

const playbackSlice = createSlice({
  name: "playback",
  initialState,
  reducers: {
    setTime(state, action: PayloadAction<number>) {
      state.time_ms = Math.max(0, Math.round(action.payload));
    },
    play(state) {
      // 闸门关闭：没算完不允许接着播
      if (!state.recomputing) state.playing = true;
    },
    pause(state) {
      state.playing = false;
    },
    stop(state) {
      state.playing = false;
      state.time_ms = 0;
    },
    /** 轨道一改：立刻进入重算，同时强制暂停播放 */
    beginRecompute(state, action: PayloadAction<number>) {
      state.recomputing = true;
      state.dataVersion = action.payload;
      state.playing = false;
      state.overflowBannerDismissed = false;
    },
    finishRecompute(
      state,
      action: PayloadAction<{ frame: ReconciledFrame; computeMs: number; dataVersion: number }>
    ) {
      // 只接受与当前数据版本一致的结果，旧帧不许落屏
      if (action.payload.dataVersion !== state.dataVersion) return;
      state.frame = action.payload.frame;
      state.time_ms = action.payload.frame.time_ms;
      state.lastComputeMs = action.payload.computeMs;
      state.recomputing = false;
    },
    dismissOverflow(state) {
      state.overflowBannerDismissed = true;
    }
  }
});

export const {
  setTime,
  play,
  pause,
  stop,
  beginRecompute,
  finishRecompute,
  dismissOverflow
} = playbackSlice.actions;
export const playbackReducer = playbackSlice.reducer;
