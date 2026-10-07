import type {
  FrameSnapshot,
  TrackContribution,
  UniverseOverflow
} from "../types/Playback";

export const createDefaultTrackContribution = (
  overrides: Partial<TrackContribution> = {}
): TrackContribution => ({
  track_id: 0,
  layer: "BASE",
  scene_id: 0,
  scene_name: "",
  channel_count: 0,
  channels: [],
  controls: 0,
  blocked: 0,
  pushes_over_512: false,
  ...overrides
});

export const createDefaultUniverseOverflow = (
  overrides: Partial<UniverseOverflow> = {}
): UniverseOverflow => ({
  universe: 1,
  used_channels: 0,
  overflow_channels: 0,
  overflow: false,
  contributors: [],
  ...overrides
});

export const createDefaultFrameSnapshot = (
  overrides: Partial<FrameSnapshot> = {}
): FrameSnapshot => ({
  time_ms: 0,
  fixtures: {},
  universes: {},
  active_track_ids: [],
  ...overrides
});
