import type { CueScene } from "../types/CueScene";

let seq = 1000;

/** 新建场景的默认对象（表单初始值） */
export function createDefaultCueScene(overrides: Partial<CueScene> = {}): CueScene {
  return {
    id: --seq,
    name: "未命名场景",
    fixture_states: {},
    fade_in_ms: 500,
    hold_ms: 4000,
    priority: 50,
    scene_status: "DRAFT",
    ...overrides
  };
}

export const createCueSceneForm = createDefaultCueScene;
export const createCueSceneResponse = createDefaultCueScene;
