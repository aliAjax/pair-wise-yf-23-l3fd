import { TrackLayerText } from "../constants/TrackLayer";
import { CueStatusText } from "../constants/CueStatus";

export const formatDate = (value: string) => new Date(value).toLocaleString("zh-CN");
export const formatStatus = (value: string) => value.replace(/_/g, " ");
export const formatNumber = (value: number) => new Intl.NumberFormat("zh-CN").format(value);
export const formatRisk = (value: string) =>
  ({ LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重", EXTREME: "极高" } as Record<string, string>)[value] ?? value;

/** 毫秒 → mm:ss.cs，时间轴标尺与播放控件共用 */
export function formatTimecode(time_ms: number): string {
  const clamped = Math.max(0, Math.round(time_ms));
  const minutes = Math.floor(clamped / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const centiseconds = Math.floor((clamped % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

/** 压层文案（编排页/预览页/日志格式化共用，新增压层必须改这里） */
export function formatLayer(layer: string): string {
  return TrackLayerText[layer as keyof typeof TrackLayerText] ?? layer;
}

/** 场景状态文案，CueStatus 枚举新增值时同步到 constants/CueStatus 即可 */
export function formatCueStatus(status: string): string {
  return CueStatusText[status as keyof typeof CueStatusText] ?? status;
}
