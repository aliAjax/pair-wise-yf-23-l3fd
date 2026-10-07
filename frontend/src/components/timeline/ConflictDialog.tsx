import type { SaveConflict } from "../../types/Playback";
import { ERROR_MESSAGES } from "../../constants/errorMessages";

interface ConflictDialogProps {
  conflict: SaveConflict;
  onResolve: (mode: "reload" | "force") => void;
  onClose: () => void;
}

function formatDiffValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "是" : "否";
  if (typeof value === "number") return value.toLocaleString("zh-CN");
  return String(value);
}

/**
 * 晚到保存的冲突裁定：先保存的版本已生效，这里只列出差异，
 * 由灯光师选择采用服务器版本还是强制覆盖。
 */
export function ConflictDialog({ conflict, onResolve, onClose }: ConflictDialogProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>保存冲突：轨道 #{conflict.track_id}</h3>
        <p className="conflict-summary">{ERROR_MESSAGES.CONCURRENT_SAVE_CONFLICT}</p>
        <p className="conflict-versions">
          你的版本 <strong>v{conflict.your_version}</strong> · 服务器最新版本{" "}
          <strong>v{conflict.server_version}</strong>（{conflict.server_track.updated_by} 先保存）
        </p>
        <table className="conflict-diff-table">
          <thead>
            <tr>
              <th>字段</th>
              <th>你的修改（未生效）</th>
              <th>服务器当前值（已生效）</th>
            </tr>
          </thead>
          <tbody>
            {conflict.diffs.length === 0 && (
              <tr>
                <td colSpan={3}>没有字段差异</td>
              </tr>
            )}
            {conflict.diffs.map((diff) => (
              <tr key={diff.field}>
                <td>{diff.label}</td>
                <td className="diff-yours">{formatDiffValue(diff.yours)}</td>
                <td className="diff-server">{formatDiffValue(diff.server)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button className="primary" onClick={() => onResolve("reload")}>
            采用服务器版本（放弃修改）
          </button>
          <button className="danger" onClick={() => onResolve("force")}>
            强制覆盖保存
          </button>
          <button onClick={onClose}>稍后处理</button>
        </div>
      </div>
    </div>
  );
}
