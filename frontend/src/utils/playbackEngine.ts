import type { Fixture } from "../types/Fixture";
import type { CueScene } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import type { LayerType } from "../types/Layer";
import { LAYER_PRIORITY } from "../constants/layers";
import type {
  ChannelFrame,
  ChannelWinner,
  FixtureFrame,
  FrameSnapshot,
  SaveConflict,
  TrackContribution,
  TrackFieldDiff,
  UniverseOverflow
} from "../types/Playback";

/** DMX universe size: each universe carries exactly 512 channels. */
export const DMX_UNIVERSE_SIZE = 512;

/** Channel keys authored per color mode. */
export const CHANNEL_KEYS: Record<string, string[]> = {
  DIMMER_ONLY: ["dimmer"],
  RGB: ["dimmer", "r", "g", "b"],
  RGBW: ["dimmer", "r", "g", "b", "w"],
  MOVING_HEAD: ["dimmer", "pan", "tilt"]
};

export function getFixtureChannels(fixture: Fixture): string[] {
  return CHANNEL_KEYS[fixture.color_mode] ?? ["dimmer"];
}

/** 1-based universe number for a DMX start address. */
export function getUniverseOfAddress(dmxAddress: number): number {
  return Math.floor((dmxAddress - 1) / DMX_UNIVERSE_SIZE) + 1;
}

/** Absolute 1-based channel indices a fixture occupies, split by universe. */
export function getFixtureUniverseChannels(fixture: Fixture): Record<number, number[]> {
  const result: Record<number, number[]> = {};
  for (let i = 0; i < fixture.channel_count; i++) {
    const address = fixture.dmx_address + i;
    const universe = getUniverseOfAddress(address);
    (result[universe] ??= []).push(address);
  }
  return result;
}

export function activeTracksAt(tracks: TimelineTrack[], timeMs: number): TimelineTrack[] {
  return tracks.filter(
    (track) => timeMs >= track.start_ms && timeMs < track.start_ms + track.duration_ms
  );
}

export function getSceneForTrack(
  track: TimelineTrack,
  scenes: CueScene[]
): CueScene | undefined {
  return scenes.find((scene) => scene.id === track.cue_scene_id);
}

/** Fade factor 0..1 for a track at time t (fade in / hold / fade out). */
export function fadeFactor(track: TimelineTrack, scene: CueScene, timeMs: number): number {
  const elapsed = timeMs - track.start_ms;
  const duration = track.duration_ms;
  const fadeIn = Math.max(0, scene.fade_in_ms);
  if (fadeIn <= 0) return 1;
  if (elapsed < fadeIn) return Math.max(0, Math.min(1, elapsed / fadeIn));
  const fadeOutStart = duration - fadeIn;
  if (elapsed > fadeOutStart) {
    return Math.max(0, Math.min(1, (duration - elapsed) / fadeIn));
  }
  return 1;
}

interface PriorityEntry {
  track: TimelineTrack;
  scene: CueScene;
  layerRank: number;
  sceneRank: number;
}

/** Sort: layer priority desc, scene priority desc, track id asc (stable tiebreak). */
export function rankTracks(tracks: TimelineTrack[], scenes: CueScene[]): PriorityEntry[] {
  return tracks
    .map((track) => {
      const scene = getSceneForTrack(track, scenes);
      if (!scene) return null;
      return {
        track,
        scene,
        layerRank: LAYER_PRIORITY[track.layer as LayerType] ?? 0,
        sceneRank: scene.priority
      };
    })
    .filter((entry): entry is PriorityEntry => entry !== null)
    .sort((a, b) => {
      if (b.layerRank !== a.layerRank) return b.layerRank - a.layerRank;
      if (b.sceneRank !== a.sceneRank) return b.sceneRank - a.sceneRank;
      return a.track.id - b.track.id;
    });
}

interface AuthoredChannel {
  fixtureId: number;
  channel: string;
  value: number;
}

/**
 * Compute the final channel values for every fixture at timeMs.
 *
 * 压层规则：多层叠加时，先按压层优先级（追光 > 效果 > 基础）、同层按场景优先级
 * 排序，依次占用通道；高优先级轨道已占用的通道，低优先级轨道不再覆盖，只补空通道。
 */
export function computeFrame(
  tracks: TimelineTrack[],
  scenes: CueScene[],
  fixtures: Fixture[],
  timeMs: number
): FrameSnapshot {
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const active = activeTracksAt(tracks, timeMs);
  const ranked = rankTracks(active, scenes);

  // Start every fixture channel at 0 with no winner.
  const fixtureFrames: Record<number, FixtureFrame> = {};
  for (const fixture of fixtures) {
    const channels: Record<string, ChannelFrame> = {};
    for (const key of getFixtureChannels(fixture)) {
      channels[key] = { value: 0, winner: null };
    }
    fixtureFrames[fixture.id] = { fixture_id: fixture.id, channels };
  }

  const occupied = new Set<string>();
  const controlsByTrack = new Map<number, number>();
  const blockedByTrack = new Map<number, number>();
  const trackUniverses = new Map<number, Set<number>>();

  for (const { track, scene } of ranked) {
    const factor = fadeFactor(track, scene, timeMs);
    const authored: AuthoredChannel[] = [];
    const universeSet = new Set<number>();

    for (const [fixtureIdText, state] of Object.entries(scene.fixture_states)) {
      const fixtureId = Number(fixtureIdText);
      const fixture = fixtureById.get(fixtureId);
      if (!fixture) continue;
      const keys = getFixtureChannels(fixture);
      for (const key of keys) {
        const raw = (state as Record<string, number | undefined>)[key];
        if (typeof raw !== "number") continue; // channel not authored -> lower tracks may fill it
        authored.push({ fixtureId, channel: key, value: Math.round(raw * factor) });
      }
      for (const universe of Object.keys(getFixtureUniverseChannels(fixture))) {
        universeSet.add(Number(universe));
      }
    }
    trackUniverses.set(track.id, universeSet);

    for (const { fixtureId, channel, value } of authored) {
      const key = `${fixtureId}:${channel}`;
      const frame = fixtureFrames[fixtureId]?.channels[channel];
      if (!frame) continue;
      if (occupied.has(key)) {
        blockedByTrack.set(track.id, (blockedByTrack.get(track.id) ?? 0) + 1);
        const winner = frame.winner;
        if (winner) frame.blocked_by = winner;
        continue;
      }
      occupied.add(key);
      frame.value = value;
      frame.winner = {
        track_id: track.id,
        layer: track.layer,
        scene_id: scene.id,
        scene_name: scene.name,
        scene_priority: scene.priority
      };
      controlsByTrack.set(track.id, (controlsByTrack.get(track.id) ?? 0) + 1);
    }
  }

  // Universe capacity: DMX load = sum of channel counts of the distinct fixtures
  // the active tracks assign to each universe (the standard "universe full" count).
  const universeLoad = new Map<number, number>();
  const universeFixtures = new Map<number, Set<number>>();
  for (const track of active) {
    const scene = getSceneForTrack(track, scenes);
    if (!scene) continue;
    for (const fixtureIdText of Object.keys(scene.fixture_states)) {
      const fixture = fixtureById.get(Number(fixtureIdText));
      if (!fixture) continue;
      for (const [universeText, channels] of Object.entries(getFixtureUniverseChannels(fixture))) {
        const universe = Number(universeText);
        const set = universeFixtures.get(universe) ?? new Set<number>();
        if (!set.has(fixture.id)) {
          set.add(fixture.id);
          universeLoad.set(universe, (universeLoad.get(universe) ?? 0) + channels.length);
        }
        universeFixtures.set(universe, set);
      }
    }
  }

  const universes: Record<number, UniverseOverflow> = {};
  for (const [universeText, load] of universeLoad) {
    const universe = Number(universeText);
    const overflowChannels = Math.max(0, load - DMX_UNIVERSE_SIZE);
    const contributors: TrackContribution[] = [];
    let cumulative = 0;
    for (const { track, scene } of ranked) {
      if (!trackUniverses.get(track.id)?.has(universe)) continue;
      const channels: number[] = [];
      for (const fixtureIdText of Object.keys(scene.fixture_states)) {
        const fixture = fixtureById.get(Number(fixtureIdText));
        if (!fixture) continue;
        channels.push(...(getFixtureUniverseChannels(fixture)[universe] ?? []));
      }
      const channelCount = channels.length;
      const before = cumulative;
      cumulative += channelCount;
      // The track that takes the cumulative load past 512 is the one that "顶过 512".
      const pushesOver512 = before <= DMX_UNIVERSE_SIZE && cumulative > DMX_UNIVERSE_SIZE;
      contributors.push({
        track_id: track.id,
        layer: track.layer,
        scene_id: scene.id,
        scene_name: scene.name,
        channel_count: channelCount,
        channels: channels.sort((a, b) => a - b),
        controls: controlsByTrack.get(track.id) ?? 0,
        blocked: blockedByTrack.get(track.id) ?? 0,
        pushes_over_512: pushesOver512
      });
    }
    universes[universe] = {
      universe,
      used_channels: load,
      overflow_channels: overflowChannels,
      overflow: overflowChannels > 0,
      contributors
    };
  }

  return {
    time_ms: timeMs,
    fixtures: fixtureFrames,
    universes,
    active_track_ids: active.map((track) => track.id)
  };
}

/** Precompute frames for the whole timeline at a fixed step (worker-friendly). */
export function computeTimeline(
  tracks: TimelineTrack[],
  scenes: CueScene[],
  fixtures: Fixture[],
  stepMs = 100
): FrameSnapshot[] {
  if (tracks.length === 0) return [];
  const totalMs = Math.max(...tracks.map((track) => track.start_ms + track.duration_ms));
  const frames: FrameSnapshot[] = [];
  for (let timeMs = 0; timeMs <= totalMs; timeMs += stepMs) {
    frames.push(computeFrame(tracks, scenes, fixtures, timeMs));
  }
  if (frames.length === 0 || frames[frames.length - 1].time_ms !== totalMs) {
    frames.push(computeFrame(tracks, scenes, fixtures, totalMs));
  }
  return frames;
}

export interface OverflowWindow {
  universe: number;
  start_ms: number;
  end_ms: number;
  max_overflow_channels: number;
  contributor_track_ids: number[];
}

/** Collapse overflowing frames into time windows for the overflow panel. */
export function summarizeOverflow(frames: FrameSnapshot[]): OverflowWindow[] {
  const windows: OverflowWindow[] = [];
  const open = new Map<number, OverflowWindow>();
  for (const frame of frames) {
    const current = new Set<number>();
    for (const universeReport of Object.values(frame.universes)) {
      if (!universeReport.overflow) continue;
      current.add(universeReport.universe);
      const existing = open.get(universeReport.universe);
      if (existing) {
        existing.end_ms = frame.time_ms;
        existing.max_overflow_channels = Math.max(
          existing.max_overflow_channels,
          universeReport.overflow_channels
        );
        for (const contributor of universeReport.contributors) {
          if (!existing.contributor_track_ids.includes(contributor.track_id)) {
            existing.contributor_track_ids.push(contributor.track_id);
          }
        }
      } else {
        open.set(universeReport.universe, {
          universe: universeReport.universe,
          start_ms: frame.time_ms,
          end_ms: frame.time_ms,
          max_overflow_channels: universeReport.overflow_channels,
          contributor_track_ids: universeReport.contributors.map((c) => c.track_id)
        });
      }
    }
    for (const [universe, window] of open) {
      if (!current.has(universe)) {
        windows.push(window);
        open.delete(universe);
      }
    }
  }
  windows.push(...open.values());
  return windows.sort((a, b) => a.universe - b.universe || a.start_ms - b.start_ms);
}

/** Field-level diff for the late save in an optimistic-concurrency conflict. */
export function diffTracks(server: TimelineTrack, yours: TimelineTrack): TrackFieldDiff[] {
  const fields: Array<{ field: keyof TimelineTrack; label: string }> = [
    { field: "start_ms", label: "起始时间" },
    { field: "duration_ms", label: "时长" },
    { field: "layer", label: "层级" },
    { field: "cue_scene_id", label: "场景" },
    { field: "locked", label: "锁定状态" }
  ];
  const diffs: TrackFieldDiff[] = [];
  for (const { field, label } of fields) {
    if (server[field] !== yours[field]) {
      diffs.push({ field: String(field), label, yours: yours[field], server: server[field] });
    }
  }
  return diffs;
}

export function describeWinner(winner: ChannelWinner | null): string {
  if (!winner) return "未占用";
  return `轨道 #${winner.track_id} · ${winner.scene_name}（场景优先级 ${winner.scene_priority}）`;
}

export function buildConflict(
  serverTrack: TimelineTrack,
  yourTrack: TimelineTrack
): SaveConflict {
  return {
    track_id: serverTrack.id,
    your_version: yourTrack.version,
    server_version: serverTrack.version,
    server_track: serverTrack,
    diffs: diffTracks(serverTrack, yourTrack)
  };
}
