import type { LayerType } from "./Layer";

/** Single fixture channel value at a playback instant (DMX 0-255). */
export interface ChannelFrame {
  /** Final effective value after layer/scene arbitration, 0-255. */
  value: number;
  /** Which track won this channel. null means no active track controls it. */
  winner: ChannelWinner | null;
  /** Which higher-priority track blocked a lower-priority track on this channel (inspector only). */
  blocked_by?: ChannelWinner;
}

export interface ChannelWinner {
  track_id: number;
  layer: LayerType;
  scene_id: number;
  scene_name: string;
  scene_priority: number;
}

export interface FixtureFrame {
  fixture_id: number;
  /** channel key -> final frame, e.g. dimmer / r / g / b / pan / tilt */
  channels: Record<string, ChannelFrame>;
}

/** What one active track brings to one DMX universe at a playback instant. */
export interface TrackContribution {
  track_id: number;
  layer: LayerType;
  scene_id: number;
  scene_name: string;
  /** Number of channels this track physically brings into the universe. */
  channel_count: number;
  /** Absolute 1-based DMX channel indices this track occupies in the universe. */
  channels: number[];
  /** Channels this track actually wins (not blocked by higher priority tracks). */
  controls: number;
  /** Channels this track wanted but lost to a higher priority track. */
  blocked: number;
  /** True when this track directly pushes channels past the 512 boundary. */
  pushes_over_512: boolean;
}

export interface UniverseOverflow {
  universe: number;
  /** Distinct channels occupied across all active tracks (union, not sum). */
  used_channels: number;
  /** Channels beyond 512 (0 when not overflowing). */
  overflow_channels: number;
  overflow: boolean;
  contributors: TrackContribution[];
}

export interface FrameSnapshot {
  time_ms: number;
  /** fixture id -> channel frames */
  fixtures: Record<number, FixtureFrame>;
  /** universe number -> overflow report */
  universes: Record<number, UniverseOverflow>;
  active_track_ids: number[];
}

/** A field-level diff between the server version and a late designer's edit. */
export interface TrackFieldDiff {
  field: string;
  label: string;
  yours: unknown;
  server: unknown;
}

/** Thrown (as ApiError details) when a save loses the optimistic-concurrency race. */
export interface SaveConflict {
  track_id: number;
  your_version: number;
  server_version: number;
  server_track: import("./TimelineTrack").TimelineTrack;
  diffs: TrackFieldDiff[];
}
