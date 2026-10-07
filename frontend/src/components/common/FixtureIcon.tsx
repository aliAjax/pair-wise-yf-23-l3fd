import type { Fixture } from "../../types/Fixture";
import type { FixtureChannelValues } from "../../types/timeline";
import { FixtureTypeText } from "../../constants/FixtureType";

const GLYPH: Record<string, string> = {
  PAR: "PAR",
  WASH: "WSH",
  SPOT: "SPT",
  BEAM: "BEM",
  STROBE: "STR"
};

interface FixtureIconProps {
  fixture?: Pick<Fixture, "fixture_code" | "fixture_type">;
  /** 舞台预览合成后的通道值，用于点亮灯体颜色 */
  values?: FixtureChannelValues;
  active?: boolean;
  size?: number;
}

function rgbCss(values?: FixtureChannelValues): string {
  if (!values || values.dimmer === 0) return "#2a2f2a";
  const r = values.red ?? (values.dimmer !== undefined ? values.dimmer : 30);
  const g = values.green ?? (values.dimmer !== undefined ? values.dimmer : 30);
  const b = values.blue ?? (values.dimmer !== undefined ? values.dimmer : 30);
  return `rgb(${r},${g},${b})`;
}

/** 灯具图标：灯具布置平面、Cue 卡片、舞台预览三处共用 */
export function FixtureIcon({ fixture, values, active = false, size = 34 }: FixtureIconProps) {
  const glyph = fixture ? GLYPH[fixture.fixture_type] ?? "FIX" : "FIX";
  const glow = active || (values && values.dimmer !== 0);
  return (
    <span
      title={fixture ? `${fixture.fixture_code} · ${FixtureTypeText[fixture.fixture_type]}` : "灯具"}
      className="inline-flex flex-col items-center justify-center rounded-md border text-[10px] font-bold transition-shadow"
      style={{
        width: size,
        height: size,
        borderColor: glow ? "#d39b46" : "#32402f",
        background: rgbCss(values),
        color: glow ? "#121712" : "#8a9486",
        boxShadow: glow ? `0 0 ${Math.round(size * 0.5)}px ${rgbCss(values)}` : "none"
      }}
    >
      {glyph}
    </span>
  );
}
