import type { ReconciledFrame } from "../../types/timeline";
import type { CueScene } from "../../types/CueScene";
import type { TimelineTrack } from "../../types/TimelineTrack";
import { TrackLayerText } from "../../constants/TrackLayer";

interface ActiveTrackBarProps {
  frame: ReconciledFrame | null;
  tracks: TimelineTrack[];
  scenes: CueScene[];
  onSelectTrack: (trackId: number) => void;
  selectedTrackId: number | null;
}

/** 当前时刻激活轨道条：按最终裁决顺序（压层→场景优先级）排列，越左越说了算 */
export function ActiveTrackBar({ frame, tracks, scenes, onSelectTrack, selectedTrackId }: ActiveTrackBarProps) {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const active = frame?.activeTrackIds ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[#7e8a78]">裁决顺序：</span>
      {active.length === 0 && <span className="text-[#5f6b5b]">当前时刻无激活轨道</span>}
      {active.map((trackId, index) => {
        const track = trackById.get(trackId);
        const scene = track ? sceneById.get(track.cue_scene_id) : undefined;
        const selected = trackId === selectedTrackId;
        return (
          <button
            key={trackId}
            type="button"
            onClick={() => onSelectTrack(trackId)}
            className={`rounded-full border px-2.5 py-1 font-bold transition-colors ${
              selected
                ? "border-stage-gold bg-stage-gold/15 text-stage-gold"
                : "border-stage-line bg-black/30 text-[#c6cec1] hover:border-stage-gold/60"
            }`}
            title={`${TrackLayerText[track?.layer as keyof typeof TrackLayerText] ?? track?.layer} · 场景优先级 ${scene?.priority}`}
          >
            <span className="mr-1 text-[#7e8a78]">{index + 1}.</span>
            轨道 {trackId} · {scene?.name ?? "?"}
            <span className="ml-1.5 text-[10px] font-normal text-[#9aa595]">
              {track ? TrackLayerText[track.layer] : ""} / P{scene?.priority}
            </span>
          </button>
        );
      })}
    </div>
  );
}
