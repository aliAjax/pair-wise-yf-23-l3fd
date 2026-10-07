import type { Fixture } from "../types/Fixture";
import type { CueScene, FixtureChannelState } from "../types/CueScene";
import type { TimelineTrack } from "../types/TimelineTrack";
import { createDefaultFixture } from "../constructors/FixtureConstructor";
import { createDefaultCueScene } from "../constructors/CueSceneConstructor";
import { createDefaultTimelineTrack } from "../constructors/TimelineTrackConstructor";
import { createDefaultShowProject } from "../constructors/ShowProjectConstructor";

const FIXTURE_COUNT = 130;
const FIXTURE_TYPE_CYCLE = ["PAR", "WASH", "SPOT", "BEAM"] as const;
const COLOR_MODE_CYCLE = ["RGB", "RGBW", "MOVING_HEAD", "RGBW"] as const;

const fixtures: Fixture[] = Array.from({ length: FIXTURE_COUNT }, (_, index) => {
  const id = index + 1;
  const column = index % 13;
  const row = Math.floor(index / 13);
  return createDefaultFixture({
    id,
    fixture_code: `FIX-${String(id).padStart(3, "0")}`,
    fixture_type: FIXTURE_TYPE_CYCLE[index % FIXTURE_TYPE_CYCLE.length],
    position_x: 70 + column * 55,
    position_y: 70 + row * 90,
    dmx_address: (index % 128) * 4 + 1,
    channel_count: 4,
    color_mode: COLOR_MODE_CYCLE[index % COLOR_MODE_CYCLE.length]
  });
});

function rangeIds(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function statesFor(
  ids: number[],
  build: (fixture: Fixture) => FixtureChannelState
): Record<number, FixtureChannelState> {
  return Object.fromEntries(
    ids.map((id) => {
      const fixture = fixtures[id - 1];
      return [id, build(fixture)];
    })
  );
}

const cueScenes: CueScene[] = [
  createDefaultCueScene({
    id: 1,
    name: "开场基础光",
    fixture_states: statesFor(rangeIds(1, 40), (fixture) => ({
      dimmer: 170,
      r: 210,
      g: 160,
      b: 90,
      w: 120,
      ...(fixture.color_mode === "MOVING_HEAD" ? { pan: 96, tilt: 96 } : {})
    })),
    fade_in_ms: 500,
    hold_ms: 2000,
    priority: 10,
    scene_status: "READY"
  }),
  createDefaultCueScene({
    id: 2,
    name: "满场基础",
    fixture_states: statesFor(rangeIds(1, 130), (fixture) => ({
      dimmer: 130,
      r: 110,
      g: 140,
      b: 210,
      w: 60,
      ...(fixture.color_mode === "MOVING_HEAD" ? { pan: 64, tilt: 64 } : {})
    })),
    fade_in_ms: 800,
    hold_ms: 1500,
    priority: 1,
    scene_status: "READY"
  }),
  createDefaultCueScene({
    id: 3,
    name: "追光",
    fixture_states: statesFor(rangeIds(1, 10), (fixture) => ({
      dimmer: 255,
      r: 255,
      g: 245,
      b: 225,
      w: 200,
      ...(fixture.color_mode === "MOVING_HEAD" ? { pan: 128, tilt: 128 } : {})
    })),
    fade_in_ms: 300,
    hold_ms: 3000,
    priority: 8,
    scene_status: "READY"
  }),
  createDefaultCueScene({
    id: 4,
    name: "效果扫描",
    fixture_states: statesFor(rangeIds(20, 80), (fixture) => ({
      dimmer: 200,
      r: 190,
      g: 90,
      b: 230,
      w: 0,
      ...(fixture.color_mode === "MOVING_HEAD" ? { pan: 100, tilt: 150 } : {})
    })),
    fade_in_ms: 600,
    hold_ms: 1000,
    priority: 5,
    scene_status: "READY"
  })
];

const SEED_TIMESTAMP = Date.UTC(2026, 9, 1, 9, 0, 0);

const timelineTracks: TimelineTrack[] = [
  createDefaultTimelineTrack({
    id: 1,
    cue_scene_id: 1,
    start_ms: 0,
    duration_ms: 20000,
    layer: "BASE",
    version: 1,
    updated_by: "seed",
    updated_at: SEED_TIMESTAMP
  }),
  createDefaultTimelineTrack({
    id: 2,
    cue_scene_id: 3,
    start_ms: 2000,
    duration_ms: 10000,
    layer: "SPOT",
    version: 1,
    updated_by: "seed",
    updated_at: SEED_TIMESTAMP
  }),
  createDefaultTimelineTrack({
    id: 3,
    cue_scene_id: 4,
    start_ms: 5000,
    duration_ms: 13000,
    layer: "EFFECT",
    version: 1,
    updated_by: "seed",
    updated_at: SEED_TIMESTAMP
  }),
  createDefaultTimelineTrack({
    id: 4,
    cue_scene_id: 2,
    start_ms: 12000,
    duration_ms: 14000,
    layer: "BASE",
    version: 1,
    updated_by: "seed",
    updated_at: SEED_TIMESTAMP
  }),
  createDefaultTimelineTrack({
    id: 5,
    cue_scene_id: 3,
    start_ms: 15000,
    duration_ms: 10000,
    layer: "SPOT",
    version: 1,
    updated_by: "seed",
    updated_at: SEED_TIMESTAMP
  })
];

const showProjects = [
  createDefaultShowProject({
    id: 1,
    title: "秋季演出",
    venue_name: "主舞台",
    fixture_ids: fixtures.map((fixture) => fixture.id),
    track_ids: timelineTracks.map((track) => track.id),
    updated_at: "2026-10-01T09:00:00Z"
  })
];

export const mockData = {
  fixture: fixtures,
  cueScene: cueScenes,
  timelineTrack: timelineTracks,
  showProject: showProjects
} as const;
