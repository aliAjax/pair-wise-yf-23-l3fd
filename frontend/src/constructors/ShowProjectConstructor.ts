import type { ShowProject } from "../types/ShowProject";

let seq = 1000;

export function createDefaultShowProject(overrides: Partial<ShowProject> = {}): ShowProject {
  return {
    id: --seq,
    title: "未命名演出",
    venue_name: "",
    fixture_ids: [],
    track_ids: [],
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

export const createShowProjectForm = createDefaultShowProject;
export const createShowProjectResponse = createDefaultShowProject;
