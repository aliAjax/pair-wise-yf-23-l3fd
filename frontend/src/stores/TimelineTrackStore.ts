import { create } from "zustand";
import { listTimelineTrack } from "../api/TimelineTrack";
import type { TimelineTrack } from "../types/TimelineTrack";

type State = { rows: TimelineTrack[]; loading: boolean; load: () => Promise<void> };

export const useTimelineTrackStore = create<State>((set) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listTimelineTrack(), loading: false });
  }
}));
