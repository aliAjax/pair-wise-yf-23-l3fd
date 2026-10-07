/// <reference lib="webworker" />
import { computeTimeline } from "../utils/playbackEngine";
import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";

interface RecomputeRequest {
  type: "recompute";
  tracks: TimelineTrack[];
  scenes: CueScene[];
  fixtures: Fixture[];
  stepMs?: number;
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<RecomputeRequest>) => {
  const message = event.data;
  if (message?.type !== "recompute") return;
  try {
    const frames = computeTimeline(
      message.tracks,
      message.scenes,
      message.fixtures,
      message.stepMs ?? 100
    );
    ctx.postMessage({ type: "recompute-done", frames });
  } catch (error) {
    ctx.postMessage({
      type: "recompute-error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
