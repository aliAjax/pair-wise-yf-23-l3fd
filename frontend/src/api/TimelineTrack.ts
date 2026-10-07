import { mockData } from "../mocks/seedData";
import type { TimelineTrack } from "../types/TimelineTrack";
import { idbGet, idbSet } from "../utils/idb";
import { ApiError, wrapApiError } from "./errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { buildConflict } from "../utils/playbackEngine";

const IDB_KEY = "timeline-track";

/**
 * Server-side track store. Holds the authoritative version of every track;
 * saves compare the client version against this map so the first save wins
 * and late saves come back with a conflict + field diffs.
 */
let serverTracks: Map<number, TimelineTrack> | null = null;

async function ensureServer(): Promise<Map<number, TimelineTrack>> {
  if (serverTracks) return serverTracks;
  let rows: TimelineTrack[] | undefined;
  try {
    rows = await idbGet<TimelineTrack[]>(IDB_KEY);
  } catch {
    rows = undefined;
  }
  if (!rows || rows.length === 0) {
    rows = (mockData.timelineTrack as TimelineTrack[]).map((track) => ({ ...track }));
  }
  serverTracks = new Map(rows.map((track) => [track.id, { ...track }]));
  return serverTracks;
}

async function persist(): Promise<void> {
  if (!serverTracks) return;
  try {
    await idbSet(IDB_KEY, [...serverTracks.values()]);
  } catch {
    /* IndexedDB unavailable: memory-only persistence */
  }
}

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  try {
    const server = await ensureServer();
    return [...server.values()].map((track) => ({ ...track }));
  } catch (error) {
    throw wrapApiError(ERROR_CODES.VALIDATION_FAILED, error, "listTimelineTrack");
  }
}

export async function nextTrackId(): Promise<number> {
  const server = await ensureServer();
  const ids = [...server.keys()];
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

/**
 * Save a track with optimistic concurrency.
 * First save (matching version) wins and bumps the version; a late save
 * returns a CONCURRENT_SAVE_CONFLICT with the server track and field diffs.
 */
export async function saveTimelineTrack(payload: TimelineTrack): Promise<TimelineTrack> {
  try {
    if (payload.duration_ms <= 0) {
      throw new ApiError(
        ERROR_CODES.INVALID_TRACK_DURATION,
        ERROR_MESSAGES.INVALID_TRACK_DURATION
      );
    }
    const server = await ensureServer();
    const existing = server.get(payload.id);
    if (existing) {
      if (existing.version !== payload.version) {
        const conflict = buildConflict(existing, payload);
        console.warn(LOG_TEMPLATES.TimelineTrack[7], conflict);
        throw new ApiError(
          ERROR_CODES.CONCURRENT_SAVE_CONFLICT,
          ERROR_MESSAGES.CONCURRENT_SAVE_CONFLICT,
          conflict
        );
      }
      const saved: TimelineTrack = {
        ...payload,
        version: existing.version + 1,
        updated_at: Date.now()
      };
      server.set(saved.id, saved);
      await persist();
      console.info(LOG_TEMPLATES.TimelineTrack[1], { id: saved.id, version: saved.version });
      return { ...saved };
    }
    const saved: TimelineTrack = { ...payload, version: 1, updated_at: Date.now() };
    server.set(saved.id, saved);
    await persist();
    console.info(LOG_TEMPLATES.TimelineTrack[0], { id: saved.id });
    return { ...saved };
  } catch (error) {
    throw wrapApiError(ERROR_CODES.VALIDATION_FAILED, error, "saveTimelineTrack");
  }
}

/**
 * Simulate a second lighting designer saving the same track first:
 * the server version bumps, so the next local save loses the race.
 */
export async function simulateConcurrentEdit(
  trackId: number,
  patch: Partial<TimelineTrack>
): Promise<TimelineTrack> {
  try {
    const server = await ensureServer();
    const existing = server.get(trackId);
    if (!existing) {
      throw new ApiError(ERROR_CODES.VALIDATION_FAILED, `轨道 #${trackId} 不存在`);
    }
    const saved: TimelineTrack = {
      ...existing,
      ...patch,
      id: trackId,
      version: existing.version + 1,
      updated_by: "另一位灯光师",
      updated_at: Date.now()
    };
    server.set(trackId, saved);
    await persist();
    console.info(LOG_TEMPLATES.TimelineTrack[9], { trackId, patch, version: saved.version });
    return { ...saved };
  } catch (error) {
    throw wrapApiError(ERROR_CODES.VALIDATION_FAILED, error, "simulateConcurrentEdit");
  }
}
