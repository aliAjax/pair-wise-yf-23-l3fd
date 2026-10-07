import { create } from "zustand";
import type { TimelineTrack } from "../types/TimelineTrack";
import * as trackApi from "../api/TimelineTrack";
import { wrapControllerError } from "../api/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import type { SaveConflict } from "../types/Playback";

function upsertRow(rows: TimelineTrack[], row: TimelineTrack): TimelineTrack[] {
  const index = rows.findIndex((candidate) => candidate.id === row.id);
  if (index >= 0) {
    const next = [...rows];
    next[index] = row;
    return next;
  }
  return [...rows, row];
}

interface TimelineTrackState {
  rows: TimelineTrack[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  conflict: SaveConflict | null;
  load: () => Promise<void>;
  /** Returns true when the save was accepted; false on conflict (conflict state set). */
  saveTrack: (track: TimelineTrack) => Promise<boolean>;
  simulateConcurrentEdit: (trackId: number, patch: Partial<TimelineTrack>) => Promise<void>;
  resolveConflict: (
    mode: "reload" | "force",
    conflict: SaveConflict,
    yours: TimelineTrack | null
  ) => Promise<void>;
  clearConflict: () => void;
}

export const useTimelineTrackStore = create<TimelineTrackState>((set, get) => ({
  rows: [],
  loading: false,
  saving: false,
  error: null,
  conflict: null,

  async load() {
    set({ loading: true, error: null });
    try {
      const rows = await trackApi.listTimelineTrack();
      set({ rows, loading: false });
    } catch (error) {
      const wrapped = wrapControllerError(ERROR_CODES.VALIDATION_FAILED, error, "TimelineTrackStore");
      set({ error: wrapped.message, loading: false });
    }
  },

  async saveTrack(track) {
    set({ saving: true, error: null });
    try {
      const saved = await trackApi.saveTimelineTrack(track);
      set((state) => ({ rows: upsertRow(state.rows, saved), conflict: null, saving: false }));
      return true;
    } catch (error) {
      const wrapped = wrapControllerError(
        ERROR_CODES.CONCURRENT_SAVE_CONFLICT,
        error,
        "TimelineTrackStore"
      );
      if (wrapped.code === ERROR_CODES.CONCURRENT_SAVE_CONFLICT && wrapped.details) {
        set({ conflict: wrapped.details as SaveConflict, saving: false });
      } else {
        set({ error: wrapped.message, saving: false });
      }
      return false;
    }
  },

  async simulateConcurrentEdit(trackId, patch) {
    set({ saving: true, error: null });
    try {
      const saved = await trackApi.simulateConcurrentEdit(trackId, patch);
      set((state) => ({ rows: upsertRow(state.rows, saved), saving: false }));
    } catch (error) {
      const wrapped = wrapControllerError(
        ERROR_CODES.VALIDATION_FAILED,
        error,
        "TimelineTrackStore"
      );
      set({ error: wrapped.message, saving: false });
    }
  },

  async resolveConflict(mode, conflict, yours) {
    if (mode === "reload") {
      set((state) => ({
        rows: upsertRow(state.rows, conflict.server_track),
        conflict: null
      }));
      return;
    }
    if (!yours) return;
    // Force overwrite: rebase our edit onto the server's latest version and save.
    const forced: TimelineTrack = { ...yours, version: conflict.server_version };
    await get().saveTrack(forced);
  },

  clearConflict() {
    set({ conflict: null });
  }
}));
