import { usePlaybackStore } from "../../stores/PlaybackStore";
import { useTimelinePlayback } from "../../hooks/useTimelinePlayback";
import { formatRulerTime } from "./TimelineRuler";

export function PlaybackControls() {
  const computing = usePlaybackStore((state) => state.computing);
  const currentTimeMs = usePlaybackStore((state) => state.currentTimeMs);
  const totalMs = usePlaybackStore((state) => state.totalMs);
  const { playing, togglePlay, seek } = useTimelinePlayback();

  return (
    <div className="playback-controls">
    <button
      className="play-button"
      onClick={togglePlay}
      disabled={computing || totalMs === 0}
      title={computing ? "预览重算中，完成后才能播放" : playing ? "暂停" : "播放"}
    >
      {computing ? "重算中…" : playing ? "暂停" : "播放"}
    </button>
      <input
        className="playback-scrub"
        type="range"
        min={0}
        max={totalMs || 0}
        value={Math.min(currentTimeMs, totalMs || 0)}
        onChange={(event) => seek(Number(event.target.value))}
        disabled={computing}
        aria-label="播放进度"
      />
      <span className="playback-time">
        {formatRulerTime(currentTimeMs)} / {formatRulerTime(totalMs)}
      </span>
    </div>
  );
}
