import { idbGetAll, idbPut } from "../api/localDb";
import type { ShowProject } from "../types/ShowProject";
import { writeLog } from "../utils/logger";
import { LOG_TEMPLATES } from "../constants/logTemplates";

const STORE = "showProject" as const;

export function listShowProjectsService(): Promise<ShowProject[]> {
  return idbGetAll<ShowProject>(STORE);
}

export async function saveShowProjectService(payload: ShowProject): Promise<ShowProject> {
  const next = { ...payload, updated_at: new Date().toISOString() };
  await idbPut(STORE, next);
  writeLog("ShowProject", LOG_TEMPLATES.ShowProject[1], { id: next.id, title: next.title });
  return next;
}
