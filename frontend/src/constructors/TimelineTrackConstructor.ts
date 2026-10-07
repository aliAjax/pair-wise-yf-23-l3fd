import type { TimelineTrack } from "../types/TimelineTrack";

export const createDefaultTimelineTrack = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: 1 as never,
  cue_scene_id: 1 as never,
  start_ms: "start ms 1" as never,
  duration_ms: "duration ms 1" as never,
  layer: "layer 1" as never,
  locked: "locked 1" as never,
  ...overrides
});

export const createTimelineTrackForm = createDefaultTimelineTrack;
export const createTimelineTrackResponse = createDefaultTimelineTrack;
