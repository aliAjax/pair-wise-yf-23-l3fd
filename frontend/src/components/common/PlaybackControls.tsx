import { formatTimecode } from "../../utils/formatters";

interface PlaybackControlsProps {
  time_ms: number;
  duration_ms: number;
  playing: boolean;
  /** 重算闸门：没算完时播放/继续按钮禁用 */
  recomputing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time_ms: number) => void;
}

/** 播放控件：时间轴编排页与舞台预览页共用；recomputing 时禁止“接着播” */
export function PlaybackControls({
  time_ms,
  duration_ms,
  playing,
  recomputing,
  onPlay,
  onPause,
  onStop,
  onSeek
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stage-line bg-stage-panel px-3 py-2">
      <button
        type="button"
        onClick={playing ? onPause : onPlay}
        disabled={recomputing}
        className={`rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${
          recomputing
            ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
            : "bg-stage-gold text-black hover:brightness-110"
        }`}
        title={recomputing ? "叠加重算中，算完前不能播放" : playing ? "暂停" : "播放"}
      >
        {recomputing ? "重算中…" : playing ? "⏸ 暂停" : "▶ 播放"}
      </button>
      <button
        type="button"
        onClick={onStop}
        disabled={recomputing}
        className="rounded-md border border-stage-line px-3 py-1.5 text-sm text-stage-paper disabled:cursor-not-allowed disabled:text-zinc-600"
      >
        ⏹
      </button>
      <input
        type="range"
        min={0}
        max={Math.max(1, Math.round(duration_ms))}
        value={Math.round(time_ms)}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-stage-line accent-stage-gold"
      />
      <span className="w-32 text-right text-xs tabular-nums text-[#b9c2b3]">
        {formatTimecode(time_ms)} / {formatTimecode(duration_ms)}
      </span>
    </div>
  );
}
