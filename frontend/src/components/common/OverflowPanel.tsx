import type { UniverseUsage } from "../../types/timeline";
import { TrackLayerText } from "../../constants/TrackLayer";
import { StatusBadge } from "./StatusBadge";

interface OverflowPanelProps {
  universes: UniverseUsage[];
  sceneNameById: Map<number, string>;
}

/**
 * DMX 宇宙容量核对面板：
 * - usedChannels/最高地址超过 512 时红色标溢出；
 * - contributors 明确点出是哪几条轨道（层 + 场景 + 峰值地址）把容量顶上去的。
 */
export function OverflowPanel({ universes, sceneNameById }: OverflowPanelProps) {
  if (universes.length === 0) {
    return <p className="text-xs text-[#8a9486]">当前时刻没有任何轨道输出。</p>;
  }
  return (
    <div className="grid gap-3">
      {universes.map((usage) => {
        const ratio = Math.min(1, usage.usedChannels / usage.capacity);
        return (
          <article
            key={usage.universe}
            className={`rounded-lg border p-3 ${
              usage.overflow ? "border-red-700 bg-red-950/30" : "border-stage-line bg-stage-panel/60"
            }`}
          >
            <header className="mb-2 flex items-center justify-between">
              <strong className="text-sm text-stage-paper">宇宙 {usage.universe + 1}</strong>
              {usage.overflow ? (
                <StatusBadge value={`溢出 +${usage.overflowBy}`} tone="danger" />
              ) : (
                <StatusBadge value={`${usage.usedChannels}/${usage.capacity}`} tone="ready" />
              )}
            </header>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/40">
              <div
                className={`h-full ${usage.overflow ? "bg-red-500" : ratio > 0.85 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#9aa595]">
              占用 {usage.usedChannels} 通道 · 最高地址 {usage.highestAddress} / {usage.capacity}
              {usage.overflow && (
                <span className="ml-1 font-bold text-red-300">
                  （{usage.highestAddress - usage.capacity} 个通道落在 {usage.capacity} 之后）
                </span>
              )}
            </p>
            <div className="mt-2">
              <p className="mb-1 text-[11px] font-bold text-[#b9c2b3]">把容量顶到当前值的轨道：</p>
              <ol className="grid gap-1">
                {usage.contributors.map((contributor, index) => (
                  <li
                    key={contributor.trackId}
                    className="flex items-center justify-between rounded bg-black/25 px-2 py-1 text-[11px]"
                  >
                    <span>
                      <span className="text-[#7e8a78]">#{index + 1}</span>{" "}
                      <span className="font-bold text-stage-paper">轨道 {contributor.trackId}</span>{" "}
                      <span className="text-[#9aa595]">
                        {TrackLayerText[contributor.layer as keyof typeof TrackLayerText]} ·{" "}
                        {sceneNameById.get(contributor.sceneId) ?? `场景 ${contributor.sceneId}`}
                      </span>
                    </span>
                    <span className="tabular-nums text-amber-300">峰值地址 {contributor.peakAddress}</span>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        );
      })}
    </div>
  );
}
