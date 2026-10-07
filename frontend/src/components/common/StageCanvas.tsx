import type { Fixture } from "../../types/Fixture";
import type { ReconciledFrame } from "../../types/timeline";
import { FixtureIcon } from "./FixtureIcon";

interface StageCanvasProps {
  fixtures: Fixture[];
  frame: ReconciledFrame | null;
  height?: number;
  onSelectFixture?: (fixtureId: number) => void;
  selectedFixtureId?: number | null;
}

function valueColor(values: ReconciledFrame["fixtures"][number]["values"] | undefined): string {
  if (!values || values.dimmer === 0) return "#10150f";
  const r = values.red ?? values.dimmer ?? 0;
  const g = values.green ?? values.dimmer ?? 0;
  const b = values.blue ?? values.dimmer ?? 0;
  return `rgb(${r},${g},${b})`;
}

/** 二维舞台：按 fixture 坐标铺灯，颜色/亮度取自时间轴合成帧（预览页与编排页共用） */
export function StageCanvas({ fixtures, frame, height = 320, onSelectFixture, selectedFixtureId }: StageCanvasProps) {
  const frameByFixture = new Map((frame?.fixtures ?? []).map((item) => [item.fixtureId, item]));
  const overflow = frame?.universes.some((u) => u.overflow) ?? false;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-stage-line"
      style={{ height, background: "radial-gradient(ellipse at 50% 35%, #202b1f 0%, #0e130e 75%)" }}
    >
      {/* 舞台地胶线 */}
      <div className="absolute inset-x-[8%] top-[12%] bottom-[8%] rounded-[50%] border border-[#2c382b]" />
      <div className="absolute inset-x-[18%] top-[20%] bottom-[16%] rounded-[50%] border border-[#263125]" />
      <span className="absolute left-3 top-2 text-[10px] font-bold tracking-widest text-[#5f6b5b]">STAGE</span>
      {overflow && (
        <span className="absolute right-3 top-2 rounded-full border border-red-700 bg-red-950/80 px-2 py-0.5 text-[11px] font-bold text-red-300">
          DMX 溢出
        </span>
      )}
      {fixtures.map((fixture) => {
        const merged = frameByFixture.get(fixture.id);
        const color = valueColor(merged?.values);
        const lit = !!merged && merged.values.dimmer !== 0;
        return (
          <button
            type="button"
            key={fixture.id}
            title={`${fixture.fixture_code}  DMX ${fixture.dmx_address}-${fixture.dmx_address + fixture.channel_count - 1}`}
            onClick={() => onSelectFixture?.(fixture.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${fixture.position_x}%`, top: `${fixture.position_y}%` }}
          >
            <span className="relative flex flex-col items-center">
              <span
                className="absolute -inset-3 rounded-full blur-md transition-opacity"
                style={{ background: color, opacity: lit ? 0.55 : 0 }}
              />
              <span className="relative">
                <FixtureIcon fixture={fixture} values={merged?.values} active={selectedFixtureId === fixture.id} size={30} />
              </span>
              <span className="relative mt-1 rounded bg-black/50 px-1 text-[9px] text-[#aeb7a9]">{fixture.fixture_code}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
