import type { CueScene } from "../types/CueScene";

export const createDefaultCueScene = (overrides: Partial<CueScene> = {}): CueScene => ({
  id: 1 as never,
  name: "name 1" as never,
  fixture_states: "fixture states 1" as never,
  fade_in_ms: "fade in ms 1" as never,
  hold_ms: "hold ms 1" as never,
  priority: "priority 1" as never,
  scene_status: "READY" as never,
  ...overrides
});

export const createCueSceneForm = createDefaultCueScene;
export const createCueSceneResponse = createDefaultCueScene;
