import { PX_PER_MS } from "../../constants/timeline";
import { formatDuration } from "../../utils/formatters";

interface TimelineRulerProps {
  totalMs: number;
  currentTimeMs: number;
  onSeek?: (timeMs: number) => void;
}

export function formatRulerTime(ms: number): string {
  return formatDuration(ms);
}

export function TimelineRuler({ totalMs, currentTimeMs, onSeek }: TimelineRulerProps) {
  const width = Math.max(totalMs * PX_PER_MS, 100);
  const secondCount = Math.ceil(totalMs / 1000);
  const ticks = [];
  for (let second = 0; second <= secondCount; second++) {
    const ms = second * 1000;
    const major = second % 5 === 0;
    ticks.push(
      <div
        key={second}
        className={"ruler-tick" + (major ? " major" : "")}
        style={{ left: ms * PX_PER_MS }}
      >
        {major && <span>{formatRulerTime(ms)}</span>}
      </div>
    );
  }

  const seekFromEvent = (clientX: number, target: HTMLElement) => {
    if (!onSeek) return;
    const rect = target.getBoundingClientRect();
    const x = clientX - rect.left + target.scrollLeft;
    onSeek(Math.max(0, x / PX_PER_MS));
  };

  return (
    <div
      className="timeline-ruler"
      style={{ width }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        seekFromEvent(event.clientX, event.currentTarget);
      }}
      onPointerMove={(event) => {
        if (event.buttons > 0) seekFromEvent(event.clientX, event.currentTarget);
      }}
    >
      {ticks}
      <div
        className="ruler-playhead"
        style={{ left: currentTimeMs * PX_PER_MS }}
      />
    </div>
  );
}
