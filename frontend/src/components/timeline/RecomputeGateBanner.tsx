interface RecomputeGateBannerProps {
  recomputing: boolean;
  lastComputeMs: number | null;
}

/** 重算闸门状态条：轨道改动后立即显示，算完前明确告知“不能播放” */
export function RecomputeGateBanner({ recomputing, lastComputeMs }: RecomputeGateBannerProps) {
  if (recomputing) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-2.5 text-sm text-amber-200"
      >
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        <span className="font-bold">轨道已改动，叠加帧重算中…</span>
        <span className="text-xs text-amber-300/80">播放已暂停，算完前不能接着播，也不会播出旧帧</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-300">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      叠加重算完成，预览已是最新结果{lastComputeMs !== null ? `（耗时 ${Math.round(lastComputeMs)}ms）` : ""}
    </div>
  );
}
