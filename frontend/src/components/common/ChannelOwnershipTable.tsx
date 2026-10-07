import type { ChannelName, ReconciledFrame } from "../../types/timeline";
import { TrackLayerText } from "../../constants/TrackLayer";
import type { Fixture } from "../../types/Fixture";

const CHANNEL_LABEL: Record<ChannelName, string> = {
  red: "红",
  green: "绿",
  blue: "蓝",
  white: "白",
  dimmer: "调光",
  strobe: "频闪",
  pan: "Pan",
  tilt: "Tilt"
};

interface ChannelOwnershipTableProps {
  frame: ReconciledFrame | null;
  fixtures: Fixture[];
  highlightTrackId?: number | null;
}

/**
 * 通道归属核对表：逐灯逐通道列出最终值与占用它的轨道。
 * OCCUPY=高优先级占用，FILL=低优先级补了没被占用的通道；
 * 被更高优先级抢走的通道不出现在低优先级名下——直接回答“谁说了算”。
 */
export function ChannelOwnershipTable({ frame, fixtures, highlightTrackId }: ChannelOwnershipTableProps) {
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const rows = (frame?.fixtures ?? []).flatMap((item) => {
    const fixture = fixtureById.get(item.fixtureId);
    return (Object.keys(item.values) as ChannelName[]).map((name) => ({
      key: `${item.fixtureId}-${name}`,
      fixtureCode: fixture?.fixture_code ?? `#${item.fixtureId}`,
      channel: name,
      value: item.values[name] as number,
      owner: item.ownership[name]!
    }));
  });

  if (rows.length === 0) {
    return <p className="text-xs text-[#8a9486]">当前时刻没有输出通道。</p>;
  }

  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-stage-line">
      <table className="w-full text-left text-[11px]">
        <thead className="sticky top-0 bg-[#223126] text-[#9aa595]">
          <tr>
            <th className="px-2 py-1.5">灯具</th>
            <th className="px-2 py-1.5">通道</th>
            <th className="px-2 py-1.5 text-right">最终值</th>
            <th className="px-2 py-1.5">归属轨道</th>
            <th className="px-2 py-1.5">压层</th>
            <th className="px-2 py-1.5">方式</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const dimmed = highlightTrackId !== undefined && highlightTrackId !== null && row.owner.trackId !== highlightTrackId;
            return (
              <tr
                key={row.key}
                className={`border-t border-stage-line/60 ${dimmed ? "opacity-40" : ""} ${
                  row.owner.trackId === highlightTrackId ? "bg-stage-gold/10" : ""
                }`}
              >
                <td className="px-2 py-1 font-bold text-stage-paper">{row.fixtureCode}</td>
                <td className="px-2 py-1 text-[#c6cec1]">{CHANNEL_LABEL[row.channel]}</td>
                <td className="px-2 py-1 text-right tabular-nums text-stage-paper">{row.value}</td>
                <td className="px-2 py-1 text-[#c6cec1]">轨道 {row.owner.trackId}</td>
                <td className="px-2 py-1 text-[#9aa595]">
                  {TrackLayerText[row.owner.layer as keyof typeof TrackLayerText] ?? row.owner.layer}
                </td>
                <td className="px-2 py-1">
                  {row.owner.mode === "OCCUPY" ? (
                    <span className="rounded bg-emerald-950/70 px-1.5 py-0.5 font-bold text-emerald-300">占用</span>
                  ) : (
                    <span className="rounded bg-sky-950/70 px-1.5 py-0.5 font-bold text-sky-300">补位</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
