import { mockData } from "../mocks/seedData";
import type { TimelineTrack } from "../types/TimelineTrack";

const endpoint = "/api/timeline-track";

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && false) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return [...(mockData.timelineTrack as unknown as TimelineTrack[])];
}

export async function saveTimelineTrack(payload: TimelineTrack) {
  console.info("save TimelineTrack", payload);
  return payload;
}
