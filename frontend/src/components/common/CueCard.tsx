import type { CueScene } from "../../types/CueScene";
import { CueStatusText } from "../../constants/CueStatus";
import { StatusBadge } from "./StatusBadge";

interface CueCardProps {
  scene: CueScene;
  compact?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/** 场景卡片：场景编辑页列表与时间轴编排页场景库共用 */
export function CueCard({ scene, compact = false, selected = false, onClick }: CueCardProps) {
  const fixtureCount = Object.keys(scene.fixture_states).length;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-stage-gold bg-stage-panel"
          : "border-stage-line bg-stage-panel/60 hover:border-stage-gold/60"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <strong className="truncate text-sm text-stage-paper">{scene.name}</strong>
        <StatusBadge value={CueStatusText[scene.scene_status] ?? scene.scene_status} tone={scene.scene_status === "READY" ? "ready" : scene.scene_status === "DISABLED" ? "disabled" : "draft"} />
      </div>
      {!compact && (
        <div className="mt-2 flex items-center justify-between text-xs text-[#9aa595]">
          <span>{fixtureCount} 台灯</span>
          <span>优先级 {scene.priority}</span>
          <span>淡入 {scene.fade_in_ms}ms</span>
        </div>
      )}
    </button>
  );
}
