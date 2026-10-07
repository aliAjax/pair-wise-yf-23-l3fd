import type { TrackLayer } from "../constants/TrackLayer";

export interface TimelineTrack {
  id: number;
  cue_scene_id: number;
  start_ms: number;
  duration_ms: number;
  layer: TrackLayer;
  locked: boolean;
  /** 乐观锁版本号：每次成功保存自增，保存时必须携带读到的版本 */
  version: number;
  updated_at: string;
  updated_by: string;
}

/** 轨道编辑请求：保存时长等字段时必须带上 base_version */
export interface TimelineTrackEdit {
  id: number;
  cue_scene_id?: number;
  start_ms?: number;
  duration_ms?: number;
  layer?: TrackLayer;
  locked?: boolean;
  base_version: number;
  editor: string;
}
