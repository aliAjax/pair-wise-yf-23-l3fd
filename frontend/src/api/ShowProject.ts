import { listShowProjectsService, saveShowProjectService } from "../services/ShowProjectService";
import { wrapServiceError } from "./errors";
import type { ShowProject } from "../types/ShowProject";

const endpoint = "/api/show-project";

export async function listShowProject(): Promise<ShowProject[]> {
  try {
    return await listShowProjectsService();
  } catch (error) {
    throw wrapServiceError(error);
  }
}

export async function saveShowProject(payload: ShowProject): Promise<ShowProject> {
  try {
    if (!payload.title) throw new Error(`${endpoint}: title 不能为空`);
    return await saveShowProjectService(payload);
  } catch (error) {
    throw wrapServiceError(error);
  }
}
