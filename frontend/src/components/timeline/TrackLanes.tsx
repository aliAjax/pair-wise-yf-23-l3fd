import type { CueScene } from "../../types/CueScene";
import type { TimelineTrack } from "../../types/TimelineTrack";
import type { TrackLayer } from "../../constants/TrackLayer";
import { TrackLayerText } from "../../constants/TrackLayer";

interface TrackLanesProps {
  tracks: TimelineTrack[];
  scenes: CueScene[];
  duration_ms: number;
  selectedTrackId: number | null;
  onSelect: (trackId: number) => void;
  onToggleLock: (track: TimelineTrack) => void;
}

const LAYERS: TrackLayer[] = ["BASE", "EFFECT", "FOLLOW_SPOT"];

const LAYER_STYLE: Record<TrackLayer, string> = {
  BASE: "bg-layer-base/85 border-emerald-400",
  EFFECT: "bg-layer-effect/85 border-amber-400",
  FOLLOW_SPOT: "bg-layer-follow/85 border-rose-400"
};

/** 三层压层泳道：基础层 / 效果层 / 追光层，块位置与时长按比例绘制 */
export function TrackLanes({ tracks, scenes, duration_ms, selectedTrackId, onSelect, onToggleLock }: TrackLanesProps) {
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const total = Math.max(1, duration_ms);

  return (
    <div className="overflow-hidden rounded-b-lg border border-stage-line">
      {LAYERS.map((layer) => {
        const laneTracks = tracks.filter((track) => track.layer === layer);
        return (
          <div key={layer} className="grid grid-cols-[86px_1fr] border-b border-stage-line last:border-b-0">
            <div className="flex flex-col justify-center gap-1 border-r border-stage-line bg-[#171f17] px-2 py-2">
              <strong className="text-xs text-stage-paper">{TrackLayerText[layer]}</strong>
              <span className="text-[10px] text-[#7e8a78]">{laneTracks.length} 条轨道</span>
            </div>
            <div className="relative h-16 bg-[#141a14]">
              {laneTracks.map((track) => {
                const scene = sceneById.get(track.cue_scene_id);
                const disabled = scene?.scene_status === "DISABLED" || scene?.scene_status === "ARCHIVED";
                const selected = track.id === selectedTrackId;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onSelect(track.id)}
                    onDoubleClick={() => onToggleLock(track)}
                    title={`${scene?.name ?? "?"} · ${track.duration_ms}ms · 双击${track.locked ? "解锁" : "锁定"}`}
                    className={`absolute top-1.5 flex flex-col overflow-hidden rounded border px-2 py-1 text-left text-[10px] text-black/80 transition-all ${LAYER_STYLE[layer]} ${
                      selected ? "z-10 ring-2 ring-stage-gold" : ""
                    } ${track.locked ? "opacity-80" : ""} ${disabled ? "grayscale" : ""}`}
                    style={{
                      left: `${(track.start_ms / total) * 100}%`,
                      width: `${Math.max(1.5, (track.duration_ms / total) * 100)}%`,
                      height: "calc(100% - 12px)"
                    }}
                  >
                    <span className="flex items-center justify-between gap-1 font-bold">
                      <span className="truncate">{scene?.name ?? `场景 ${track.cue_scene_id}`}</span>
                      <span>{track.locked ? "🔒" : ""}</span>
                    </span>
                    <span className="truncate text-[9px] opacity-75">
                      #{track.id} v{track.version} · {track.updated_by}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
