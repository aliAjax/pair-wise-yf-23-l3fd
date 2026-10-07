import { useEffect, useState } from "react";
import type { CueScene } from "../../types/CueScene";
import type { TimelineTrack } from "../../types/TimelineTrack";
import { TrackLayer, TrackLayerText, type TrackLayer as TrackLayerType } from "../../constants/TrackLayer";
import { formatTimecode } from "../../utils/formatters";
import { StatusBadge } from "../common/StatusBadge";

export interface TrackDraft {
  start_ms: number;
  duration_ms: number;
  layer: TrackLayerType;
  locked: boolean;
  cue_scene_id: number;
}

interface TrackInspectorProps {
  track: TimelineTrack | null;
  scenes: CueScene[];
  saving: boolean;
  onSave: (draft: TrackDraft) => void;
  onToggleLock: () => void;
}

/** 选中轨道的属性检查器：改时长/起点/压层/关联场景，保存时走乐观锁 */
export function TrackInspector({ track, scenes, saving, onSave, onToggleLock }: TrackInspectorProps) {
  const [draft, setDraft] = useState<TrackDraft | null>(null);

  useEffect(() => {
    if (track) {
      setDraft({
        start_ms: track.start_ms,
        duration_ms: track.duration_ms,
        layer: track.layer,
        locked: track.locked,
        cue_scene_id: track.cue_scene_id
      });
    } else {
      setDraft(null);
    }
  }, [track]);

  if (!track || !draft) {
    return (
      <div className="rounded-lg border border-dashed border-stage-line p-4 text-xs text-[#8a9486]">
        点击时间轴上的轨道块查看属性；同一时刻多层叠加的最终通道值见下方“叠加核对”。
      </div>
    );
  }

  const dirty =
    draft.start_ms !== track.start_ms ||
    draft.duration_ms !== track.duration_ms ||
    draft.layer !== track.layer ||
    draft.locked !== track.locked ||
    draft.cue_scene_id !== track.cue_scene_id;

  return (
    <div className="rounded-lg border border-stage-line bg-stage-panel p-4">
      <header className="mb-3 flex items-center justify-between">
        <strong className="text-sm text-stage-paper">轨道 #{track.id}</strong>
        <div className="flex items-center gap-2">
          <StatusBadge value={`v${track.version}`} tone="info" />
          {track.locked && <StatusBadge value="已锁定" tone="warning" />}
        </div>
      </header>

      <dl className="mb-3 grid grid-cols-2 gap-2 text-[11px] text-[#9aa595]">
        <div>最近保存：{track.updated_by}</div>
        <div className="text-right">{formatTimecode(track.start_ms)} 起 · {track.duration_ms}ms</div>
      </dl>

      <div className="grid gap-3">
        <label className="grid gap-1 text-xs text-[#c6cec1]">
          开始时间（ms）
          <input
            type="number"
            min={0}
            step={100}
            value={draft.start_ms}
            disabled={track.locked}
            onChange={(event) => setDraft({ ...draft, start_ms: Math.max(0, Number(event.target.value)) })}
            className="rounded border border-stage-line bg-black/30 px-2 py-1 text-stage-paper disabled:opacity-50"
          />
        </label>
        <label className="grid gap-1 text-xs text-[#c6cec1]">
          时长（ms）
          <input
            type="number"
            min={100}
            step={500}
            value={draft.duration_ms}
            disabled={track.locked}
            onChange={(event) => setDraft({ ...draft, duration_ms: Math.max(100, Number(event.target.value)) })}
            className="rounded border border-stage-line bg-black/30 px-2 py-1 text-stage-paper disabled:opacity-50"
          />
        </label>
        <label className="grid gap-1 text-xs text-[#c6cec1]">
          压层
          <select
            value={draft.layer}
            disabled={track.locked}
            onChange={(event) => setDraft({ ...draft, layer: event.target.value as TrackLayerType })}
            className="rounded border border-stage-line bg-black/30 px-2 py-1 text-stage-paper disabled:opacity-50"
          >
            {TrackLayer.map((layer) => (
              <option key={layer} value={layer}>{TrackLayerText[layer]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-[#c6cec1]">
          关联场景
          <select
            value={draft.cue_scene_id}
            disabled={track.locked}
            onChange={(event) => setDraft({ ...draft, cue_scene_id: Number(event.target.value) })}
            className="rounded border border-stage-line bg-black/30 px-2 py-1 text-stage-paper disabled:opacity-50"
          >
            {scenes.map((scene) => (
              <option key={scene.id} value={scene.id}>{scene.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleLock}
          className="rounded-md border border-stage-line px-3 py-1.5 text-xs text-stage-paper hover:border-stage-gold"
        >
          {track.locked ? "解锁轨道" : "锁定轨道"}
        </button>
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={!dirty || saving || track.locked}
          className="rounded-md bg-stage-gold px-4 py-1.5 text-xs font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
          title={track.locked ? "轨道锁定中，请先解锁" : `以版本 v${track.version} 为基础保存`}
        >
          {saving ? "保存中…" : `保存（基于 v${track.version}）`}
        </button>
      </div>
    </div>
  );
}
