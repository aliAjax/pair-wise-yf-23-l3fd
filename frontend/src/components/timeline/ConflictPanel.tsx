import type { SaveFailure } from "../../stores/TimelineTrackStore";
import { describeField } from "../../services/trackConflict";
import { formatLayer } from "../../utils/formatters";

interface ConflictPanelProps {
  failure: SaveFailure;
  /** 晚到灯光师的名字，用于“强制覆盖”重提 */
  editor: string;
  onForceOverwrite: () => void;
  onReread: () => void;
  busy?: boolean;
}

function renderValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "锁定" : "未锁定";
  if (value === undefined) return "—";
  if (value === "BASE" || value === "EFFECT" || value === "FOLLOW_SPOT") return formatLayer(String(value));
  return String(value);
}

/**
 * 乐观锁冲突面板：
 * 先保存的一版生效，晚到的一版被拒；逐字段列出
 * 「你打开时的值 / 先保存者改成了 / 你想改成」，并给出重读或强制覆盖。
 */
export function ConflictPanel({ failure, onForceOverwrite, onReread, busy = false }: ConflictPanelProps) {
  const conflict = failure.conflict;
  if (!conflict) {
    return (
      <div className="rounded-lg border border-amber-700 bg-amber-950/30 p-3 text-sm text-amber-200">
        {failure.message}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-700 bg-red-950/30 p-3">
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <strong className="text-sm text-red-200">保存被拒：这条轨道已被别人先保存</strong>
        <span className="text-[11px] text-red-300/80">
          先保存者：{conflict.current.updated_by} · 当前版本 v{conflict.current.version}
          （你编辑的是 v{conflict.attempted.base_version}）
        </span>
      </header>
      <table className="w-full text-left text-[11px]">
        <thead className="text-[#e5b3b3]">
          <tr>
            <th className="py-1 pr-2">字段</th>
            <th className="py-1 pr-2">你打开时</th>
            <th className="py-1 pr-2">先保存的一版（已生效）</th>
            <th className="py-1 pr-2">你这版（晚到）</th>
            <th className="py-1 pr-2">结论</th>
          </tr>
        </thead>
        <tbody>
          {conflict.diff.map((item) => (
            <tr key={item.field} className={`border-t border-red-900/60 ${item.conflict ? "" : "opacity-70"}`}>
              <td className="py-1 pr-2 font-bold text-red-100">{describeField(item.field)}</td>
              <td className="py-1 pr-2 tabular-nums text-[#d9c2c2]">{renderValue(item.baseValue)}</td>
              <td className="py-1 pr-2 tabular-nums text-emerald-300">{renderValue(item.savedValue)}</td>
              <td className="py-1 pr-2 tabular-nums text-amber-300">{renderValue(item.attemptedValue)}</td>
              <td className="py-1 pr-2">
                {item.conflict ? (
                  <span className="font-bold text-red-300">真冲突</span>
                ) : (
                  <span className="text-[#c9a0a0]">仅你改动，重读后可再保存</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onReread}
          disabled={busy}
          className="rounded-md border border-stage-line px-3 py-1.5 text-xs text-stage-paper hover:border-stage-gold"
        >
          放弃本版并重读
        </button>
        <button
          type="button"
          onClick={onForceOverwrite}
          disabled={busy}
          className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
          title="以当前最新版本为底，把你的值再写一次（版本号会继续递增）"
        >
          {busy ? "提交中…" : "核对无误，强制覆盖"}
        </button>
      </div>
    </div>
  );
}
