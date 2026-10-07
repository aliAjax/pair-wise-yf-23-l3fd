import { idbGetAll, idbPut, idbPutRevision, idbGetRevision } from "../api/localDb";
import type { TimelineTrack, TimelineTrackEdit } from "../types/TimelineTrack";
import { EntityNotFoundError, TrackConflictError, TrackLockedError } from "../constants/errorMessages";
import { diffTrackEdit } from "./trackConflict";
import { writeLog } from "../utils/logger";
import { LOG_TEMPLATES } from "../constants/logTemplates";

const STORE = "timelineTrack" as const;
/** 时长修改受轨道锁定保护的字段 */
const LOCK_PROTECTED = new Set<string>(["duration_ms", "start_ms", "cue_scene_id", "layer"]);

export async function listTracksService(): Promise<TimelineTrack[]> {
  return idbGetAll<TimelineTrack>(STORE);
}

export async function getTrackService(id: number): Promise<TimelineTrack> {
  const rows = await listTracksService();
  const row = rows.find((item) => item.id === id);
  if (!row) throw new EntityNotFoundError("TimelineTrack", id);
  return row;
}

interface ApplyOptions {
  /** 强制覆盖：晚到的灯光师确认差异后，以最新版本为底再次写入 */
  force?: boolean;
}

/**
 * 保存轨道编辑（乐观锁）：
 * - 两位灯光师同时改同一轨道，携带 base_version 较小的晚到保存被拒；
 * - 拒绝时抛出 TrackConflictError，内含逐字段差异（谁先保存、晚到值是什么）；
 * - force=true 时以当前最新版本为底强制覆盖，仍会校验锁定。
 */
export async function applyTrackEditService(
  edit: TimelineTrackEdit,
  options: ApplyOptions = {}
): Promise<TimelineTrack> {
  const current = await getTrackService(edit.id);

  if (current.locked && edit.locked !== true) {
    const editRecord = edit as unknown as Record<string, unknown>;
    const touchesProtected = Object.keys(editRecord).some(
      (key) => LOCK_PROTECTED.has(key) && editRecord[key] !== undefined
    );
    if (touchesProtected) throw new TrackLockedError(edit.id);
  }

  if (!options.force && edit.base_version !== current.version) {
    const base =
      (await idbGetRevision<TimelineTrack>(`${edit.id}#${edit.base_version}`)) ??
      current;
    const diff = diffTrackEdit(base, current, edit);
    writeLog("TimelineTrack", LOG_TEMPLATES.TimelineTrack[4], {
      version: edit.base_version,
      winner: current.updated_by
    });
    throw new TrackConflictError(
      current as unknown as Record<string, unknown>,
      edit as unknown as Record<string, unknown>,
      diff
    );
  }

  const next: TimelineTrack = {
    ...current,
    ...pickEditable(edit),
    version: current.version + 1,
    updated_at: new Date().toISOString(),
    updated_by: edit.editor
  };

  // 覆盖前留存当前版本快照，之后的并发保存才能取出“你所基于的那一版”
  await idbPutRevision({ key: `${current.id}#${current.version}`, snapshot: current as unknown as Record<string, unknown> });
  await idbPut(STORE, next);
  writeLog("TimelineTrack", LOG_TEMPLATES.TimelineTrack[1], {
    id: next.id,
    duration_ms: next.duration_ms,
    version: next.version,
    editor: next.updated_by
  });
  return next;
}

function pickEditable(edit: TimelineTrackEdit): Partial<TimelineTrack> {
  return {
    ...(edit.cue_scene_id !== undefined ? { cue_scene_id: edit.cue_scene_id } : {}),
    ...(edit.start_ms !== undefined ? { start_ms: edit.start_ms } : {}),
    ...(edit.duration_ms !== undefined ? { duration_ms: edit.duration_ms } : {}),
    ...(edit.layer !== undefined ? { layer: edit.layer } : {}),
    ...(edit.locked !== undefined ? { locked: edit.locked } : {})
  };
}

export async function createTrackService(
  draft: Omit<TimelineTrack, "id" | "version" | "updated_at" | "updated_by">,
  editor: string
): Promise<TimelineTrack> {
  const rows = await listTracksService();
  const id = Math.max(0, ...rows.map((row) => (row.id < 1000 ? 0 : row.id))) + 1;
  const next: TimelineTrack = {
    ...draft,
    id,
    version: 1,
    updated_at: new Date().toISOString(),
    updated_by: editor
  };
  await idbPut(STORE, next);
  writeLog("TimelineTrack", LOG_TEMPLATES.TimelineTrack[0], { id, editor });
  return next;
}
