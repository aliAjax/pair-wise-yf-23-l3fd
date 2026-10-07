import { listCueScenesService, saveCueSceneService } from "../services/CueSceneService";
import { wrapServiceError } from "./errors";
import type { CueScene } from "../types/CueScene";

const endpoint = "/api/cue-scene";

export async function listCueScene(): Promise<CueScene[]> {
  try {
    return await listCueScenesService();
  } catch (error) {
    throw wrapServiceError(error);
  }
}

export async function saveCueScene(payload: CueScene): Promise<CueScene> {
  try {
    if (!payload.name) throw new Error(`${endpoint}: name 不能为空`);
    return await saveCueSceneService(payload);
  } catch (error) {
    throw wrapServiceError(error);
  }
}
