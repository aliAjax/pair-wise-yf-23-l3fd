import { DMX_VALUE_MAX, DMX_VALUE_MIN } from "../../constants/dmx";
import type { ChannelName } from "../../types/timeline";

const CHANNEL_LABEL: Record<ChannelName, string> = {
  red: "红 R",
  green: "绿 G",
  blue: "蓝 B",
  white: "白 W",
  dimmer: "调光 Dimmer",
  strobe: "频闪 Strobe",
  pan: "水平 Pan",
  tilt: "垂直 Tilt"
};

interface ColorChannelSliderProps {
  channel: ChannelName;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/** 单通道滑杆：场景编辑页设置颜色/亮度/频闪/Pan-Tilt 共用 */
export function ColorChannelSlider({ channel, value, onChange, disabled = false }: ColorChannelSliderProps) {
  return (
    <label className="flex items-center gap-3 text-xs text-[#c6cec1]">
      <span className="w-24 shrink-0">{CHANNEL_LABEL[channel]}</span>
      <input
        type="range"
        min={DMX_VALUE_MIN}
        max={DMX_VALUE_MAX}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-stage-line accent-stage-gold disabled:cursor-not-allowed"
      />
      <span className="w-9 text-right tabular-nums text-stage-paper">{value}</span>
    </label>
  );
}
