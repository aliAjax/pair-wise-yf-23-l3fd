import type { ShowProject } from "../types/ShowProject";

export const createDefaultShowProject = (overrides: Partial<ShowProject> = {}): ShowProject => ({
  id: 1 as never,
  title: "title 1" as never,
  venue_name: "venue name 1" as never,
  fixture_ids: [1,2] as number[],
  track_ids: [1,2] as number[],
  updated_at: "2026-06-11T09:00:00Z" as never,
  ...overrides
});

export const createShowProjectForm = createDefaultShowProject;
export const createShowProjectResponse = createDefaultShowProject;
