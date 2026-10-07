import type { TimelineTrack, TimelineTrackEdit } from "../types/TimelineTrack";
import type { FieldDiff } from "../constants/errorMessages";

/** 参与并发冲突比对的可编辑字段 */
export const CONCURRENCY_FIELDS = ["duration_ms", "start_ms", "layer", "locked", "cue_scene_id"] as const;

/**
 * 两位灯光师同时修改同一条轨道：
 * 先保存的一版已落库（current.version > edit.base_version）。
 * 晚到者改过、且先保存者也改过（与 base 不同）的字段才是真冲突；
 * 晚到者独改的字段可以在重读后安全合并，这里同样列出供核对。
 */
export function diffTrackEdit(base: TimelineTrack, current: TimelineTrack, edit: TimelineTrackEdit): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  for (const field of CONCURRENCY_FIELDS) {
    const attemptedValue = edit[field];
    if (attemptedValue === undefined) continue;
    const savedValue = current[field];
    const baseValue = base[field];
    const savedChanged = savedValue !== baseValue;
    const attemptedChanged = attemptedValue !== baseValue;
    diffs.push({
      field,
      savedValue,
      attemptedValue,
      baseValue,
      conflict: savedChanged && attemptedChanged && savedValue !== attemptedValue
    });
  }
  return diffs;
}

export function describeField(field: string): string {
  const labels: Record<string, string> = {
    duration_ms: "时长",
    start_ms: "开始时间",
    layer: "压层",
    locked: "锁定状态",
    cue_scene_id: "关联场景"
  };
  return labels[field] ?? field;
}
