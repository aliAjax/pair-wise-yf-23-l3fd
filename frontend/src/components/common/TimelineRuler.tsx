import { useMemo } from "react";
import { formatTimecode } from "../../utils/formatters";

interface TimelineRulerProps {
  duration_ms: number;
  time_ms: number;
  /** 播放头移动/点击拖动 */
  onSeek?: (time_ms: number) => void;
  /** 刻度间隔（ms），默认每秒一刻 */
  tick_ms?: number;
  height?: number;
}

/** 时间轴标尺：编排页轨道区与舞台预览页共用，点击/拖动可定位播放头 */
export function TimelineRuler({ duration_ms, time_ms, onSeek, tick_ms = 1000, height = 28 }: TimelineRulerProps) {
  const ticks = useMemo(() => {
    const count = Math.ceil(duration_ms / tick_ms);
    return Array.from({ length: count + 1 }, (_, i) => i * tick_ms);
  }, [duration_ms, tick_ms]);

  const ratio = duration_ms > 0 ? Math.min(1, time_ms / duration_ms) : 0;

  const seekFromEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratioAt = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    onSeek(ratioAt * duration_ms);
  };

  return (
    <div
      className="relative w-full cursor-crosshair select-none overflow-hidden rounded-t-md border border-b-0 border-stage-line bg-[#171f17]"
      style={{ height }}
      onClick={seekFromEvent}
    >
      {ticks.map((tick) => {
        const left = duration_ms > 0 ? `${(tick / duration_ms) * 100}%` : "0%";
        return (
          <span key={tick} className="absolute top-0 h-full" style={{ left }}>
            <span className="absolute top-0 h-2 w-px bg-stage-line" />
            <span className="absolute bottom-0.5 left-1 text-[9px] tabular-nums text-[#7e8a78]">
              {formatTimecode(tick)}
            </span>
          </span>
        );
      })}
      <span className="absolute top-0 z-10 h-full w-0.5 bg-stage-gold" style={{ left: `${ratio * 100}%` }} />
    </div>
  );
}
