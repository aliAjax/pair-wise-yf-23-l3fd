
import { create } from "zustand";
import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { FrameSnapshot } from "../types/Playback";
import * as previewApi from "../api/Preview";
import { wrapControllerError } from "../api/errors";
import { ERROR_CODES } from "../constants/errorCodes";

interface PlaybackState {
  frames: FrameSnapshot[];
  computing: boolean;
  computeError: string | null;
  currentTimeMs: number;
  playing: boolean;
  totalMs: number;
  recompute: (
    tracks: TimelineTrack[],
    scenes: CueScene[],
    fixtures: Fixture[]
  ) => Promise<void>;
  seek: (timeMs: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  frames: [],
  computing: false,
  computeError: null,
  currentTimeMs: 0,
  playing: false,
  totalMs: 0,

  async recompute(tracks, scenes, fixtures) {
    set({ computing: true, computeError: null, playing: false });
    try {
      const frames = await previewApi.recomputePreview(tracks, scenes, fixtures);
      const totalMs = frames.length ? frames[frames.length - 1].time_ms : 0;
      set({ frames, totalMs, computing: false });
      const { currentTimeMs } = get();
      if (currentTimeMs > totalMs) set({ currentTimeMs: 0 });
    } catch (error) {
      const wrapped = wrapControllerError(
        ERROR_CODES.PREVIEW_WORKER_FAILED,
        error,
        "PlaybackStore"
      );
      set({ computing: false, computeError: wrapped.message });
    }
  },

  seek(timeMs) {
    const { totalMs } = get();
    const clamped = Math.max(0, Math.min(Math.round(timeMs), totalMs || 0));
    set({ currentTimeMs: clamped });
  },

  play() {
    // 没算完不能接着播：重算未完成时播放操作一律忽略。
    if (get().computing) return;
    set({ playing: true });
  },

  pause() {
    set({ playing: false });
  },

  togglePlay() {
    const { playing, computing } = get();
    if (computing) return;
    set({ playing: !playing });
  }
}));

/** Binary-search the last frame at or before timeMs. */
export function selectFrameAt(
  frames: FrameSnapshot[],
  timeMs: number
): FrameSnapshot | undefined {
  if (frames.length === 0) return undefined;
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (frames[mid].time_ms <= timeMs) low = mid;
    else high = mid - 1;
  }
  return frames[low];
}
