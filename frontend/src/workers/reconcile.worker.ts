/// <reference lib="webworker" />
import { reconcileFrame } from "../services/timelineMerge";
import { RECONCILE_GATE_DELAY_MS } from "../constants/dmx";
import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { ReconciledFrame } from "../types/timeline";

/**
 * 叠加重算 Web Worker：
 * 时间轴轨道一改动，舞台预览立刻把本时刻的合并帧丢到这里重算。
 * worker 内串行处理消息，天然保证“上一版没算完，不会开始下一版”。
 */
export interface ReconcileWorkerRequest {
  requestId: number;
  time_ms: number;
  tracks: TimelineTrack[];
  scenes: CueScene[];
  fixtures: Fixture[];
  universeCapacity: number;
  /**
   * heavy=true：由轨道/场景/灯具改动触发，施加可感知的闸门延迟，
   * 配合页面“重算中，暂不能播放”状态核对需求；
   * 播放游标移动为 heavy=false，只做即时合成。
   */
  heavy: boolean;
}

export interface ReconcileWorkerResponse {
  requestId: number;
  frame: ReconciledFrame;
  compute_ms: number;
  heavy: boolean;
}

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<ReconcileWorkerRequest>) => {
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const req = event.data;
  const frame = reconcileFrame({
    time_ms: req.time_ms,
    tracks: req.tracks,
    scenes: req.scenes,
    fixtures: req.fixtures,
    universeCapacity: req.universeCapacity
  });
  const elapsed =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) -
    started;
  const wait = req.heavy ? Math.max(0, RECONCILE_GATE_DELAY_MS - elapsed) : 0;
  setTimeout(() => {
    const response: ReconcileWorkerResponse = {
      requestId: req.requestId,
      frame,
      compute_ms:
        (typeof performance !== "undefined" ? performance.now() : Date.now()) -
        started,
      heavy: req.heavy
    };
    scope.postMessage(response);
  }, wait);
};

export {};
