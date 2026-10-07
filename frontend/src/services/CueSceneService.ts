import { idbGetAll, idbPut } from "../api/localDb";
import type { CueScene } from "../types/CueScene";
import { writeLog } from "../utils/logger";
import { LOG_TEMPLATES } from "../constants/logTemplates";

const STORE = "cueScene" as const;

export function listCueScenesService(): Promise<CueScene[]> {
  return idbGetAll<CueScene>(STORE);
}

export async function saveCueSceneService(payload: CueScene): Promise<CueScene> {
  await idbPut(STORE, payload);
  writeLog("CueScene", LOG_TEMPLATES.CueScene[1], { id: payload.id, name: payload.name });
  return payload;
}
