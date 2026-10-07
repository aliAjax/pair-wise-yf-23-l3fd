import type { CueScene } from "../../types/CueScene";
import { CueStatusText } from "../../constants/CueStatus";
import { StatusBadge } from "./StatusBadge";

interface CueCardProps {
  scene?: CueScene;
  title?: string;
  value?: string;
}

/** Scene summary card: name, priority, authored fixture count and status. */
export function CueCard({ scene, title = "CueCard", value = "READY" }: CueCardProps) {
  if (scene) {
    const fixtureCount = Object.keys(scene.fixture_states).length;
    return (
      <div className="cue-card">
        <div className="cue-card-head">
          <strong>{scene.name}</strong>
          <StatusBadge value={scene.scene_status} />
        </div>
        <div className="cue-card-meta">
          <span>优先级 {scene.priority}</span>
          <span>灯具 {fixtureCount}</span>
          <span>渐变 {scene.fade_in_ms}ms</span>
        </div>
        <div className="cue-card-status">{CueStatusText[scene.scene_status as keyof typeof CueStatusText] ?? scene.scene_status}</div>
      </div>
    );
  }
  return (
    <div className="shared-widget">
      <strong>{title}</strong>
      <StatusBadge value={value} />
    </div>
  );
}
