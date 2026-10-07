import { useRef } from "react";
import type { TimelineTrack } from "../../types/TimelineTrack";
import type { CueScene } from "../../types/CueScene";
import { LAYER_COLOR } from "../../constants/layers";
import { PX_PER_MS, SNAP_MS } from "../../constants/timeline";

interface TrackBlockProps {
  track: TimelineTrack;
  scene: CueScene | undefined;
  selected: boolean;
  onSelect: () => void;
  onMove: (startMs: number) => void;
  onResize: (durationMs: number) => void;
}

interface DragState {
  mode: "move" | "resize";
  startX: number;
  originStart: number;
  originDuration: number;
}

export function TrackBlock({
  track,
  scene,
  selected,
  onSelect,
  onMove,
  onResize
}: TrackBlockProps) {
  const dragRef = useRef<DragState | null>(null);
  const color = LAYER_COLOR[track.layer];
  const width = Math.max(track.duration_ms * PX_PER_MS, 48);

  const applyDrag = (clientX: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const deltaMs = (clientX - drag.startX) / PX_PER_MS;
    if (drag.mode === "move") {
      const next = Math.max(0, Math.round((drag.originStart + deltaMs) / SNAP_MS) * SNAP_MS);
      onMove(next);
    } else {
      const next = Math.max(500, Math.round((drag.originDuration + deltaMs) / SNAP_MS) * SNAP_MS);
      onResize(next);
    }
  };

  return (
    <div
      className={"track-block" + (selected ? " selected" : "") + (track.locked ? " locked" : "")}
      style={{
        left: track.start_ms * PX_PER_MS,
        width,
        borderColor: color,
        background: `${color}22`
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
        if (track.locked) return;
        const mode = (event.target as HTMLElement).dataset.resize === "true" ? "resize" : "move";
        dragRef.current = {
          mode,
          startX: event.clientX,
          originStart: track.start_ms,
          originDuration: track.duration_ms
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (event.buttons > 0) applyDrag(event.clientX);
      }}
      onPointerUp={() => {
        dragRef.current = null;
      }}
    >
      <span className="track-block-label" style={{ color }}>
        {scene?.name ?? `轨道 #${track.id}`}
      </span>
      {track.locked && <span className="track-lock" title="已锁定">锁</span>}
      {!track.locked && (
        <span className="track-resize-handle" data-resize="true" title="拖动改时长" />
      )}
    </div>
  );
}
