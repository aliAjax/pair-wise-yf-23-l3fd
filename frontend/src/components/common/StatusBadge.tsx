type Tone = "ready" | "draft" | "disabled" | "danger" | "warning" | "info" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  ready: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  draft: "bg-slate-800 text-slate-300 border-slate-600",
  disabled: "bg-zinc-800 text-zinc-400 border-zinc-600",
  danger: "bg-red-950/70 text-red-300 border-red-700",
  warning: "bg-amber-950/70 text-amber-300 border-amber-700",
  info: "bg-sky-950/70 text-sky-300 border-sky-700",
  neutral: "bg-[#223126] text-[#b9c2b3] border-stage-line"
};

interface StatusBadgeProps {
  value: string;
  tone?: Tone;
  title?: string;
}

function inferTone(value: string): Tone {
  const upper = value.toUpperCase();
  if (["READY", "正常", "就绪"].includes(upper)) return "ready";
  if (["DISABLED", "已停用", "停用"].includes(upper)) return "disabled";
  if (["DRAFT", "草稿"].includes(upper)) return "draft";
  if (["溢出", "OVERFLOW", "冲突"].some((k) => upper.includes(k))) return "danger";
  if (["重算", "锁"].some((k) => value.includes(k))) return "warning";
  return "neutral";
}

/** 状态徽章：场景状态、溢出标记、锁定/重算提示共用 */
export function StatusBadge({ value, tone, title }: StatusBadgeProps) {
  const resolvedTone = tone ?? inferTone(value);
  return (
    <span
      title={title}
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${TONE_CLASS[resolvedTone]}`}
    >
      {value}
    </span>
  );
}
