import type { TimelineTrack } from "../types/TimelineTrack";

export const createDefaultTimelineTrack = (
  overrides: Partial<TimelineTrack> = {}
): TimelineTrack => ({
  id: 0,
  cue_scene_id: 0,
  start_ms: 0,
  duration_ms: 5000,
  layer: "BASE",
  locked: false,
  version: 1,
  updated_by: "local",
  updated_at: Date.now(),
  ...overrides
});

export const createTimelineTrackForm = createDefaultTimelineTrack;
export const createTimelineTrackResponse = createDefaultTimelineTrack;
