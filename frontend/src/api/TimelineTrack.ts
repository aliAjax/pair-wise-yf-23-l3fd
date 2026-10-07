import {
  applyTrackEditService,
  createTrackService,
  listTracksService
} from "../services/TimelineTrackService";
import { wrapServiceError } from "./errors";
import type { TimelineTrack, TimelineTrackEdit } from "../types/TimelineTrack";

const endpoint = "/api/timeline-track";

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  try {
    return await listTracksService();
  } catch (error) {
    throw wrapServiceError(error);
  }
}

/** 灯光师保存轨道改动：携带 base_version，晚到的一版会拿到冲突差异 */
export async function saveTimelineTrack(edit: TimelineTrackEdit, options?: { force?: boolean }) {
  try {
    if (!edit.editor) throw new Error(`${endpoint}: editor 不能为空`);
    return await applyTrackEditService(edit, options);
  } catch (error) {
    throw wrapServiceError(error);
  }
}

export async function createTimelineTrack(
  draft: Omit<TimelineTrack, "id" | "version" | "updated_at" | "updated_by">,
  editor: string
): Promise<TimelineTrack> {
  try {
    return await createTrackService(draft, editor);
  } catch (error) {
    throw wrapServiceError(error);
  }
}
