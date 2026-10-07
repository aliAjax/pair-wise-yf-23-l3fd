import type { CueScene } from "../types/CueScene";
import type { Fixture } from "../types/Fixture";
import type { TimelineTrack } from "../types/TimelineTrack";
import type {
  ActiveContribution,
  ChannelName,
  FixtureChannelValues,
  MergedFixtureFrame,
  ReconciledFrame,
  UniverseUsage
} from "../types/timeline";
import { layerRank } from "../constants/TrackLayer";
import { CueStatus } from "../constants/CueStatus";
import { DMX_UNIVERSE_CAPACITY } from "../constants/dmx";

/** 不参与叠加的场景状态（停用/归档轨道视作不存在） */
const INACTIVE_STATUS = new Set<string>([CueStatus[2], CueStatus[3]]); // DISABLED / ARCHIVED

interface ActiveTrack {
  track: TimelineTrack;
  scene: CueScene;
}

/** 半开区间 [start, start+duration) 内且场景可用的轨道 */
export function selectActiveTracks(
  time_ms: number,
  tracks: TimelineTrack[],
  scenes: CueScene[]
): ActiveTrack[] {
  const sceneById = new Map(scenes.map((scene) => [scene.id, scene]));
  const active: ActiveTrack[] = [];
  for (const track of tracks) {
    if (time_ms < track.start_ms || time_ms >= track.start_ms + track.duration_ms) continue;
    const scene = sceneById.get(track.cue_scene_id);
    if (!scene || INACTIVE_STATUS.has(scene.scene_status)) continue;
    active.push({ track, scene });
  }
  return active;
}

/**
 * 裁决顺序：压层 rank 高者在前（追光>效果>基础），
 * 同层按场景 priority 高者在前，再用 track id 保证确定性。
 */
export function rankContributions(active: ActiveTrack[]): ActiveTrack[] {
  return [...active].sort((a, b) => {
    const layerGap = layerRank(b.track.layer) - layerRank(a.track.layer);
    if (layerGap !== 0) return layerGap;
    const priorityGap = b.scene.priority - a.scene.priority;
    if (priorityGap !== 0) return priorityGap;
    return a.track.id - b.track.id;
  });
}

/** 淡入进度 0-1（颜色/调光/频闪按比例淡入，pan/tilt 立即到位） */
function fadeProgress(time_ms: number, entry: ActiveTrack): number {
  const fade = Math.max(0, entry.scene.fade_in_ms);
  if (fade === 0) return 1;
  return Math.min(1, Math.max(0, (time_ms - entry.track.start_ms) / fade));
}

const SCALED_CHANNELS: ReadonlySet<ChannelName> = new Set<ChannelName>([
  "red",
  "green",
  "blue",
  "white",
  "dimmer",
  "strobe"
]);

function resolveChannels(
  raw: FixtureChannelValues,
  progress: number
): FixtureChannelValues {
  const out: FixtureChannelValues = {};
  (Object.keys(raw) as ChannelName[]).forEach((name) => {
    const value = raw[name];
    if (value === undefined) return;
    out[name] = SCALED_CHANNELS.has(name) ? Math.round(value * progress) : value;
  });
  return out;
}

/**
 * 灯具 footprint：按 DMX 起始地址归属唯一宇宙（真实补丁规则，
 * 灯具不会自动跨越宇宙边界）。
 * footprint 越过该宇宙末位时 overflowChannels>0，即“这个宇宙被顶破 512”。
 */
export interface FixtureFootprint {
  universe: number;
  /** 落在宇宙内的起始槽 */
  startSlot: number;
  /** 落在宇宙内的末槽（不超过 capacity） */
  endSlot: number;
  globalStart: number;
  globalEnd: number;
  /** 越过宇宙末位的通道数（= 溢出量） */
  overflowChannels: number;
}

export function footprintOf(
  fixture: Fixture,
  capacity = DMX_UNIVERSE_CAPACITY
): FixtureFootprint {
  const universe = Math.floor((fixture.dmx_address - 1) / capacity);
  const base = universe * capacity;
  const globalStart = fixture.dmx_address;
  const globalEnd = fixture.dmx_address + fixture.channel_count - 1;
  const universeEnd = base + capacity;
  return {
    universe,
    startSlot: globalStart - base,
    endSlot: Math.min(globalEnd, universeEnd) - base,
    globalStart,
    globalEnd,
    overflowChannels: Math.max(0, globalEnd - universeEnd)
  };
}

export interface ReconcileInput {
  time_ms: number;
  tracks: TimelineTrack[];
  scenes: CueScene[];
  fixtures: Fixture[];
  universeCapacity?: number;
}

/**
 * 时间轴叠加合成：
 * 1. 找出当前时刻激活的轨道，按压层/优先级排序；
 * 2. 高优先级先占用通道，低优先级只补未被占用的通道（FILL）；
 * 3. 汇总各宇宙 footprint，超过 512 标溢出并归因到具体轨道。
 */
export function reconcileFrame(input: ReconcileInput): ReconciledFrame {
  const capacity = input.universeCapacity ?? DMX_UNIVERSE_CAPACITY;
  const fixtureById = new Map(input.fixtures.map((fixture) => [fixture.id, fixture]));
  const ordered = rankContributions(selectActiveTracks(input.time_ms, input.tracks, input.scenes));

  const frames = new Map<number, MergedFixtureFrame>();
  const contributions: ActiveContribution[] = [];
  /** 每台灯具被最高排名轨道占用的记录：决定该贡献是占用还是补位 */
  const topTrackByFixture = new Map<number, number>();
  for (const entry of ordered) {
    for (const fid of Object.keys(entry.scene.fixture_states)) {
      if (!topTrackByFixture.has(Number(fid))) topTrackByFixture.set(Number(fid), entry.track.id);
    }
  }

  for (const entry of ordered) {
    const progress = fadeProgress(input.time_ms, entry);
    const footprints: ActiveContribution["fixtureFootprints"] = [];
    let peakAddress = 0;

    for (const [fixtureId, rawValues] of Object.entries(entry.scene.fixture_states)) {
      const fid = Number(fixtureId);
      const fixture = fixtureById.get(fid);
      if (!fixture) continue;

      let frame = frames.get(fid);
      if (!frame) {
        frame = { fixtureId: fid, values: {}, ownership: {} };
        frames.set(fid, frame);
      }

      const resolved = resolveChannels(rawValues, progress);
      (Object.keys(resolved) as ChannelName[]).forEach((name) => {
        if (resolved[name] === undefined) return;
        if (frame!.values[name] === undefined) {
          // 该通道尚未被更高优先级占用：高排名轨道占用，其余只补未占用通道
          frame!.values[name] = resolved[name];
          frame!.ownership[name] = {
            trackId: entry.track.id,
            sceneId: entry.scene.id,
            layer: entry.track.layer,
            mode: topTrackByFixture.get(fid) === entry.track.id ? "OCCUPY" : "FILL"
          };
        }
        // 已被占用：低优先级直接放弃该通道
      });

      const end = fixture.dmx_address + fixture.channel_count - 1;
      footprints.push({ fixtureId: fid, start: fixture.dmx_address, end });
      peakAddress = Math.max(peakAddress, end);
    }

    if (footprints.length > 0) {
      contributions.push({
        trackId: entry.track.id,
        sceneId: entry.scene.id,
        layer: entry.track.layer,
        scenePriority: entry.scene.priority,
        fixtureFootprints: footprints,
        peakAddress
      });
    }
  }

  const universes = summarizeUniverses(ordered, input.fixtures, contributions, capacity);
  return {
    time_ms: input.time_ms,
    fixtures: [...frames.values()].sort((a, b) => a.fixtureId - b.fixtureId),
    activeTrackIds: ordered.map((entry) => entry.track.id),
    universes,
    hasOverflow: universes.some((usage) => usage.overflow)
  };
}

/** 汇总各宇宙占用，检测溢出并按峰值地址排出“把容量顶上去”的轨道 */
function summarizeUniverses(
  ordered: ActiveTrack[],
  fixtures: Fixture[],
  contributions: ActiveContribution[],
  capacity: number
): UniverseUsage[] {
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const slots = new Map<number, Set<number>>();
  /** 每条轨道在每个宇宙把 footprint 顶到的最高绝对地址 */
  const trackUniversePeak = new Map<string, number>();
  /** 每个宇宙内所有激活灯具 footprint 顶到的最高绝对地址 */
  const universePeak = new Map<number, number>();
  const touchedUniverses = new Set<number>();

  for (const entry of ordered) {
    for (const fid of Object.keys(entry.scene.fixture_states)) {
      const fixture = fixtureById.get(Number(fid));
      if (!fixture) continue;
      const fp = footprintOf(fixture, capacity);
      touchedUniverses.add(fp.universe);
      let set = slots.get(fp.universe);
      if (!set) {
        set = new Set<number>();
        slots.set(fp.universe, set);
      }
      for (let slot = fp.startSlot; slot <= fp.endSlot; slot++) set.add(slot);
      const key = `${entry.track.id}@${fp.universe}`;
      trackUniversePeak.set(key, Math.max(trackUniversePeak.get(key) ?? 0, fp.globalEnd));
      universePeak.set(fp.universe, Math.max(universePeak.get(fp.universe) ?? 0, fp.globalEnd));
    }
  }

  return [...touchedUniverses].sort((a, b) => a - b).map((universe) => {
    const usedChannels = slots.get(universe)?.size ?? 0;
    const highestAddress = universePeak.get(universe) ?? 0;
    const universeEnd = (universe + 1) * capacity;
    const overflowBy = Math.max(0, highestAddress - universeEnd);
    const ranked = contributions
      .filter((c) => trackUniversePeak.has(`${c.trackId}@${universe}`))
      .map((c) => ({ ...c, peakAddress: trackUniversePeak.get(`${c.trackId}@${universe}`)! }))
      .sort((a, b) => b.peakAddress - a.peakAddress || a.trackId - b.trackId);
    return {
      universe,
      usedChannels,
      capacity,
      highestAddress,
      overflow: overflowBy > 0,
      overflowBy,
      contributors: ranked
    };
  });
}

export function frameHasOverflow(frame: ReconciledFrame): boolean {
  return frame.universes.some((u) => u.overflow);
}
