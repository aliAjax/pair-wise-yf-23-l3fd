import { idbGetAll, idbPut } from "../api/localDb";
import type { Fixture } from "../types/Fixture";
import { writeLog } from "../utils/logger";
import { LOG_TEMPLATES } from "../constants/logTemplates";

const STORE = "fixture" as const;

export function listFixturesService(): Promise<Fixture[]> {
  return idbGetAll<Fixture>(STORE);
}

export async function saveFixtureService(payload: Fixture): Promise<Fixture> {
  await idbPut(STORE, payload);
  writeLog("Fixture", LOG_TEMPLATES.Fixture[1], { id: payload.id, address: payload.dmx_address });
  return payload;
}
