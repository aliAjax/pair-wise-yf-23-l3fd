import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { FrameSnapshot } from "../types/Playback";
import { computeTimeline } from "../utils/playbackEngine";
import { ERROR_CODES } from "../constants/errorCodes";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { wrapApiError } from "./errors";

/** Simulated compute latency so the "not done yet, can't play" state is observable. */
const RECOMPUTE_LATENCY_MS = 450;
const WORKER_TIMEOUT_MS = 15000;

function runInWorker(
  tracks: TimelineTrack[],
  scenes: CueScene[],
  fixtures: Fixture[],
  stepMs: number
): Promise<FrameSnapshot[]> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("../workers/playbackWorker.ts", import.meta.url), {
        type: "module"
      });
    } catch (error) {
      reject(error);
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("recompute timeout"));
    }, WORKER_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as { type?: string; frames?: FrameSnapshot[]; message?: string };
      clearTimeout(timer);
      worker.terminate();
      if (message.type === "recompute-done" && message.frames) {
        resolve(message.frames);
      } else {
        reject(new Error(message.message ?? "worker recompute failed"));
      }
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      reject(new Error(event.message));
    };
    worker.postMessage({ type: "recompute", tracks, scenes, fixtures, stepMs });
  });
}

/**
 * Recompute the whole preview timeline in a worker.
 * The promise resolves only after the new frames are ready; the UI keeps
 * playback locked until then.
 */
export async function recomputePreview(
  tracks: TimelineTrack[],
  scenes: CueScene[],
  fixtures: Fixture[],
  stepMs = 100
): Promise<FrameSnapshot[]> {
  try {
    console.info(LOG_TEMPLATES.TimelineTrack[8], {
      tracks: tracks.length,
      scenes: scenes.length,
      fixtures: fixtures.length
    });
    const [frames] = await Promise.all([
      runInWorker(tracks, scenes, fixtures, stepMs),
      new Promise((resolve) => setTimeout(resolve, RECOMPUTE_LATENCY_MS))
    ]);
    return frames;
  } catch (error) {
    try {
      await new Promise((resolve) => setTimeout(resolve, RECOMPUTE_LATENCY_MS));
      return computeTimeline(tracks, scenes, fixtures, stepMs);
    } catch {
      throw wrapApiError(ERROR_CODES.PREVIEW_WORKER_FAILED, error, "recomputePreview");
    }
  }
}
