import { useEffect, useState } from "react";
import type { TimelineTrack } from "../../types/TimelineTrack";

export interface ConcurrentDraft {
  editor: string;
  duration_ms: number;
  baseVersion: number;
}

interface ConcurrencySimulatorProps {
  track: TimelineTrack | null;
  saving: boolean;
  onSave: (draft: ConcurrentDraft, force?: boolean) => void;
}

const PERSON_A = "灯光师-阿玲";
const PERSON_B = "灯光师-阿杰";

/**
 * “两位灯光师同时改同一条轨道时长”的现场模拟：
 * 两人都在版本 v(n) 上打开了轨道并各改各的时长，
 * 先点保存者生效，后点保存者被乐观锁拒绝并列出逐字段差异。
 */
export function ConcurrencySimulator({ track, saving, onSave }: ConcurrencySimulatorProps) {
  const [durationA, setDurationA] = useState(0);
  const [durationB, setDurationB] = useState(0);
  const [baseVersion, setBaseVersion] = useState(0);

  useEffect(() => {
    if (track) {
      setDurationA(track.duration_ms);
      setDurationB(track.duration_ms);
      setBaseVersion(track.version);
    }
  }, [track]);

  if (!track) {
    return (
      <div className="rounded-lg border border-dashed border-stage-line p-4 text-xs text-[#8a9486]">
        选择一条轨道后可模拟两位灯光师同时修改时长。
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stage-line bg-stage-panel p-4">
      <header className="mb-1 flex items-center justify-between">
        <strong className="text-sm text-stage-paper">并发改时长模拟</strong>
        <span className="text-[11px] text-[#9aa595]">
          两人手里都是 #{track.id} 的 v{baseVersion}（库中现在是 v{track.version}）
        </span>
      </header>
      <p className="mb-3 text-[11px] text-[#7e8a78]">
        分别改两人的时长，再依次点“先保存”和“再保存”，晚到的一版会被拒绝并列出差异。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-stage-line bg-black/20 p-3">
          <p className="mb-2 text-xs font-bold text-emerald-300">{PERSON_A}</p>
          <input
            type="number"
            min={100}
            step={500}
            value={durationA}
            onChange={(event) => setDurationA(Number(event.target.value))}
            className="mb-2 w-full rounded border border-stage-line bg-black/30 px-2 py-1 text-sm text-stage-paper"
          />
          <button
            type="button"
            disabled={saving || track.locked}
            onClick={() => onSave({ editor: PERSON_A, duration_ms: durationA, baseVersion }, false)}
            className="w-full rounded bg-emerald-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-40"
          >
            {PERSON_A} 先保存
          </button>
        </div>
        <div className="rounded-md border border-stage-line bg-black/20 p-3">
          <p className="mb-2 text-xs font-bold text-sky-300">{PERSON_B}</p>
          <input
            type="number"
            min={100}
            step={500}
            value={durationB}
            onChange={(event) => setDurationB(Number(event.target.value))}
            className="mb-2 w-full rounded border border-stage-line bg-black/30 px-2 py-1 text-sm text-stage-paper"
          />
          <button
            type="button"
            disabled={saving || track.locked}
            onClick={() => onSave({ editor: PERSON_B, duration_ms: durationB, baseVersion }, false)}
            className="w-full rounded bg-sky-700 px-2 py-1.5 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-40"
          >
            {PERSON_B} 再保存（晚到）
          </button>
        </div>
      </div>
    </div>
  );
}
