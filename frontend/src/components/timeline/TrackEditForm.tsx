import { useEffect, useState } from "react";
import type { TimelineTrack } from "../../types/TimelineTrack";
import type { CueScene } from "../../types/CueScene";
import { LAYER_ORDER, LAYER_TEXT } from "../../constants/layers";

interface TrackEditFormProps {
  track: TimelineTrack;
  scenes: CueScene[];
  saving: boolean;
  onSave: (draft: TimelineTrack) => void;
  onSimulateConflict: () => void;
}

/**
 * 轨道时长/层级编辑表单。任何改动都走乐观并发保存：
 * 先保存的一版生效，晚到的会被服务器驳回并列出差异。
 */
export function TrackEditForm({
  track,
  scenes,
  saving,
  onSave,
  onSimulateConflict
}: TrackEditFormProps) {
  const [draft, setDraft] = useState<TimelineTrack>(track);

  useEffect(() => {
    setDraft(track);
  }, [track]);

  const update = <K extends keyof TimelineTrack>(field: K, value: TimelineTrack[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const numberField = (field: keyof TimelineTrack, label: string, step: number) => (
    <label className="form-field">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={Number(draft[field])}
        disabled={draft.locked}
        onChange={(event) => update(field, Number(event.target.value) as never)}
      />
    </label>
  );

  return (
    <div className="track-edit-form">
      <div className="form-version">
        轨道 #{draft.id} · 当前版本 v{draft.version} · 最后保存 {draft.updated_by}
      </div>

      {numberField("start_ms", "起始时间 (ms)", 100)}
      {numberField("duration_ms", "时长 (ms)", 100)}

      <label className="form-field">
        <span>层级（压层）</span>
        <select
          value={draft.layer}
          disabled={draft.locked}
          onChange={(event) => update("layer", event.target.value as TimelineTrack["layer"])}
        >
          {LAYER_ORDER.map((layer) => (
            <option key={layer} value={layer}>
              {LAYER_TEXT[layer]}（{layer === "SPOT" ? 3 : layer === "EFFECT" ? 2 : 1}）
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>场景</span>
        <select
          value={draft.cue_scene_id}
          disabled={draft.locked}
          onChange={(event) => update("cue_scene_id", Number(event.target.value))}
        >
          {scenes.map((scene) => (
            <option key={scene.id} value={scene.id}>
              {scene.name}（优先级 {scene.priority}）
            </option>
          ))}
        </select>
      </label>

      <label className="form-check">
        <input
          type="checkbox"
          checked={draft.locked}
          onChange={(event) => update("locked", event.target.checked)}
        />
        <span>锁定轨道（锁定后不可修改时长）</span>
      </label>

      <div className="form-actions">
        <button
          className="primary"
          disabled={saving || draft.locked}
          onClick={() => onSave(draft)}
        >
          {saving ? "保存中…" : "保存并预览重算"}
        </button>
        <button className="secondary" onClick={onSimulateConflict} disabled={saving}>
          模拟另一位灯光师同时修改
        </button>
      </div>
      <p className="form-hint">
        两位灯光师同时修改同一条轨道时，先保存的一版生效；晚到的保存会被驳回并列出字段差异。
      </p>
    </div>
  );
}
