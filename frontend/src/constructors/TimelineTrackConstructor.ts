import type { TimelineTrack } from "../types/TimelineTrack";
import type { TrackLayer } from "../constants/TrackLayer";

let seq = 1000;

/** 新建轨道的默认对象（拖拽场景到时间轴时使用） */
export function createDefaultTimelineTrack(overrides: Partial<TimelineTrack> = {}): TimelineTrack {
  return {
    id: --seq,
    cue_scene_id: 0,
    start_ms: 0,
    duration_ms: 3000,
    layer: "BASE" as TrackLayer,
    locked: false,
    version: 1,
    updated_at: new Date(0).toISOString(),
    updated_by: "",
    ...overrides
  };
}

export const createTimelineTrackForm = createDefaultTimelineTrack;
export const createTimelineTrackResponse = createDefaultTimelineTrack;
