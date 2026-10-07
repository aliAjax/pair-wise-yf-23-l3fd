import type { LayerType } from "./Layer";

export interface TimelineTrack {
  id: number;
  cue_scene_id: number;
  start_ms: number;
  duration_ms: number;
  layer: LayerType;
  locked: boolean;
  /** Optimistic-concurrency version: first save wins, late save lists diffs. */
  version: number;
  updated_by: string;
  updated_at: number;
}
