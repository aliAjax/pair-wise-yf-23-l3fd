import { reconcileFrame } from "../services/timelineMerge";
import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { ReconciledFrame } from "../types/timeline";
import type {
  ReconcileWorkerRequest,
  ReconcileWorkerResponse
} from "../workers/reconcile.worker";

/**
 * 重算客户端：
 * - 有 Web Worker 时把合成丢到 worker，UI 不被阻塞，请求严格串行；
 * - 每个请求带递增 requestId，由调用方按版本丢弃过期结果；
 * - 不支持 Worker 时回退主线程同步计算（闸门语义不变）。
 */
export interface ComputeParams {
  time_ms: number;
  tracks: TimelineTrack[];
  scenes: CueScene[];
  fixtures: Fixture[];
  universeCapacity: number;
  heavy: boolean;
}

export class ReconcileClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, (response: ReconcileWorkerResponse) => void>();

  constructor() {
    if (typeof Worker !== "undefined") {
      try {
        this.worker = new Worker(
          new URL("../workers/reconcile.worker.ts", import.meta.url),
          { type: "module" }
        );
        this.worker.onmessage = (event: MessageEvent<ReconcileWorkerResponse>) => {
          const resolve = this.pending.get(event.data.requestId);
          if (resolve) {
            this.pending.delete(event.data.requestId);
            resolve(event.data);
          }
        };
      } catch {
        this.worker = null;
      }
    }
  }

  compute(params: ComputeParams): Promise<ReconcileWorkerResponse> {
    const requestId = ++this.seq;
    const request: ReconcileWorkerRequest = { requestId, ...params };

    if (this.worker) {
      return new Promise((resolve) => {
        this.pending.set(requestId, resolve);
        this.worker!.postMessage(request);
      });
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const started =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        const frame = reconcileFrame(params);
        resolve({
          requestId,
          frame,
          compute_ms:
            (typeof performance !== "undefined" ? performance.now() : Date.now()) -
            started,
          heavy: params.heavy
        });
      }, params.heavy ? 120 : 0);
    });
  }

  /** 作废所有在途结果（轨道连续改动时，旧结果不再允许落帧） */
  invalidate(): void {
    this.pending.clear();
  }

  dispose(): void {
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
  }
}
