import { mockData } from "../mocks/seedData";
import type { CueScene } from "../types/CueScene";

const endpoint = "/api/cue-scene";

export async function listCueScene(): Promise<CueScene[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return [...(mockData.cueScene as unknown as CueScene[])];
}

export async function saveCueScene(payload: CueScene) {
  console.info("save CueScene", payload);
  return payload;
}
