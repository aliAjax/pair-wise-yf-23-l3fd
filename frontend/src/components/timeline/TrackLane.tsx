import type { TimelineTrack } from "../../types/TimelineTrack";
import type { CueScene } from "../../types/CueScene";
import type { LayerType } from "../../types/Layer";
import { LAYER_COLOR, LAYER_TEXT } from "../../constants/layers";
import { TrackBlock } from "./TrackBlock";

interface TrackLaneProps {
  layer: LayerType;
  tracks: TimelineTrack[];
  scenes: CueScene[];
  selectedId: number | null;
  onSelect: (trackId: number) => void;
  onMove: (trackId: number, startMs: number) => void;
  onResize: (trackId: number, durationMs: number) => void;
}

export function TrackLane({
  layer,
  tracks,
  scenes,
  selectedId,
  onSelect,
  onMove,
  onResize
}: TrackLaneProps) {
  const laneTracks = tracks.filter((track) => track.layer === layer);
  return (
    <div className="track-lane">
      <div className="lane-header" style={{ color: LAYER_COLOR[layer] }}>
        <span className="lane-dot" style={{ background: LAYER_COLOR[layer] }} />
        {LAYER_TEXT[layer]}
        <span className="lane-priority">压层优先级 {layer === "SPOT" ? 3 : layer === "EFFECT" ? 2 : 1}</span>
      </div>
      <div className="lane-body">
        {laneTracks.length === 0 && <div className="lane-empty">暂无轨道</div>}
        {laneTracks.map((track) => (
          <TrackBlock
            key={track.id}
            track={track}
            scene={scenes.find((scene) => scene.id === track.cue_scene_id)}
            selected={selectedId === track.id}
            onSelect={() => onSelect(track.id)}
            onMove={(startMs) => onMove(track.id, startMs)}
            onResize={(durationMs) => onResize(track.id, durationMs)}
          />
        ))}
      </div>
    </div>
  );
}
