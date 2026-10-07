import type { Fixture } from "../../types/Fixture";
import type { FrameSnapshot } from "../../types/Playback";
import { getFixtureUniverseChannels } from "../../utils/playbackEngine";

interface StageCanvasProps {
  fixtures: Fixture[];
  frame: FrameSnapshot | undefined;
  width?: number;
  height?: number;
}

const VIEW_WIDTH = 780;
const VIEW_HEIGHT = 580;

function fixtureAppearance(fixture: Fixture, frame: FrameSnapshot | undefined) {
  const channels = frame?.fixtures[fixture.id]?.channels;
  const dimmer = channels?.dimmer?.value ?? 0;
  const red = channels?.r?.value ?? 0;
  const green = channels?.g?.value ?? 0;
  const blue = channels?.b?.value ?? 0;
  const hasColor = red + green + blue > 0;
  const intensity = hasColor
    ? Math.max(dimmer / 255, (red + green + blue) / (3 * 255))
    : dimmer / 255;
  return {
    fill: hasColor ? `rgb(${red}, ${green}, ${blue})` : "rgb(255, 230, 190)",
    intensity: Math.min(1, Math.max(0, intensity)),
    hasBeam: fixture.color_mode === "MOVING_HEAD" && dimmer > 0
  };
}

function fixtureOverflowing(fixture: Fixture, frame: FrameSnapshot | undefined): boolean {
  if (!frame) return false;
  const universes = Object.keys(getFixtureUniverseChannels(fixture)).map(Number);
  return universes.some((universe) => frame.universes[universe]?.overflow);
}

export function StageCanvas({
  fixtures,
  frame,
  width = VIEW_WIDTH,
  height = VIEW_HEIGHT
}: StageCanvasProps) {
  return (
    <svg
      className="stage-canvas"
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width="100%"
      role="img"
      aria-label="舞台灯光预览"
    >
      <rect x={0} y={0} width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="#1c2420" />
      <rect x={20} y={20} width={VIEW_WIDTH - 40} height={VIEW_HEIGHT - 40} fill="#232d27" stroke="#3a4a40" />
      {fixtures.map((fixture) => {
        const appearance = fixtureAppearance(fixture, frame);
        const overflowing = fixtureOverflowing(fixture, frame);
        const cx = fixture.position_x;
        const cy = fixture.position_y;
        return (
          <g key={fixture.id}>
            {appearance.hasBeam && (
              <polygon
                points={`${cx - 14},${cy + 10} ${cx + 14},${cy + 10} ${cx + 60},${cy + 150} ${cx - 60},${cy + 150}`}
                fill={appearance.fill}
                opacity={0.12 * appearance.intensity}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={12}
              fill={appearance.fill}
              opacity={0.25 + 0.75 * appearance.intensity}
              stroke={overflowing ? "#e05a47" : "#0e1310"}
              strokeWidth={overflowing ? 3 : 2}
            />
            {overflowing && (
              <circle cx={cx} cy={cy} r={18} fill="none" stroke="#e05a47" strokeWidth={1.5} strokeDasharray="4 3" />
            )}
            <text x={cx} y={cy + 30} textAnchor="middle" fontSize="10" fill="#9fb3a6">
              {fixture.fixture_code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
