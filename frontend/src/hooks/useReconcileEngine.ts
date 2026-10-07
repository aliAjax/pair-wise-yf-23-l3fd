import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { beginRecompute, finishRecompute } from "../stores/PlaybackStore";
import { ReconcileClient } from "../workers/reconcileClient";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { writeLog } from "../utils/logger";

interface Job {
  reason: "data" | "time";
  version: number;
}

/**
 * 叠加重算引擎（全局挂一个）：
 * - 轨道/场景/灯具任一改动 → 立刻 beginRecompute，播放被强制暂停、
 *   播放按钮禁用，直到 worker 把新帧算回来（闸门延迟期间始终 recomputing）；
 * - 仅时间游标移动走轻量重算（无人工延迟），不打断正常播放节拍；
 * - worker 串行 + 改动期间反复触发时合并为“用最新数据再算一次”，
 *   且只接受与当前 dataVersion 一致的结果，旧帧不许落屏。
 */
export function useReconcileEngine() {
  const dispatch = useAppDispatch();
  const tracks = useAppSelector((state) => state.timelineTrack.rows);
  const scenes = useAppSelector((state) => state.cueScene.rows);
  const fixtures = useAppSelector((state) => state.fixture.rows);
  const dataReady = tracks.length > 0 && scenes.length > 0 && fixtures.length > 0;
  const time_ms = useAppSelector((state) => state.playback.time_ms);
  const capacity = useAppSelector((state) => state.playback.universeCapacity);
  const dataVersion = useAppSelector((state) => state.playback.dataVersion);

  const dataSignature = useMemo(() => JSON.stringify({ tracks, scenes, fixtures }), [tracks, scenes, fixtures]);

  // 最新参数始终通过 ref 进入 worker，排队任务不拿旧闭包
  const latest = useRef({ dataSignature, time_ms, tracks, scenes, fixtures, capacity, dataVersion });
  latest.current = { dataSignature, time_ms, tracks, scenes, fixtures, capacity, dataVersion };

  const clientRef = useRef<ReconcileClient | null>(null);
  if (!clientRef.current) clientRef.current = new ReconcileClient();

  const lastSignature = useRef<string | null>(null);
  const processingRef = useRef(false);
  const scheduledJob = useRef<Job | null>(null);
  const skipDataLogRef = useRef(true);

  useEffect(() => () => clientRef.current?.dispose(), []);

  // 数据驱动（改动即重算，闸门）
  useEffect(() => {
    if (!dataReady) return;
    if (lastSignature.current === null) {
      lastSignature.current = dataSignature;
      enqueue({ reason: "time", version: latest.current.dataVersion });
      return;
    }
    if (lastSignature.current !== dataSignature) {
      lastSignature.current = dataSignature;
      const nextVersion = latest.current.dataVersion + 1;
      dispatch(beginRecompute(nextVersion));
      enqueue({ reason: "data", version: nextVersion });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSignature, dataReady]);

  // 时间驱动（播放/拖动游标，轻量重算）
  useEffect(() => {
    if (!dataReady || lastSignature.current === null) return;
    enqueue({ reason: "time", version: latest.current.dataVersion });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time_ms, dataReady]);

  async function enqueue(job: Job) {
    if (processingRef.current) {
      // 上一帧没算完：合并排队任务，数据任务优先且版本取最新
      if (!scheduledJob.current || job.reason === "data") scheduledJob.current = job;
      else if (scheduledJob.current.reason === "time") scheduledJob.current = job;
      return;
    }
    processingRef.current = true;
    try {
      const params = latest.current;
      const response = await clientRef.current!.compute({
        time_ms: params.time_ms,
        tracks: params.tracks,
        scenes: params.scenes,
        fixtures: params.fixtures,
        universeCapacity: params.capacity,
        heavy: job.reason === "data"
      });
      dispatch(
        finishRecompute({
          frame: response.frame,
          computeMs: response.compute_ms,
          dataVersion: job.version
        })
      );
      if (job.reason === "data" && !skipDataLogRef.current) {
        const overflowUniverses = response.frame.universes.filter((u) => u.overflow).length;
        writeLog("TimelineTrack", LOG_TEMPLATES.TimelineTrack[5], {
          time_ms: Math.round(response.compute_ms),
          overflow_universes: overflowUniverses
        });
      }
      skipDataLogRef.current = false;
    } finally {
      processingRef.current = false;
      const next = scheduledJob.current;
      scheduledJob.current = null;
      if (next) enqueue(next);
    }
  }

  return {};
}
