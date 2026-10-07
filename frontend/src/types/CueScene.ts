/** Per-fixture channel values authored inside a cue scene (DMX 0-255). */
export interface FixtureChannelState {
  dimmer?: number;
  r?: number;
  g?: number;
  b?: number;
  w?: number;
  pan?: number;
  tilt?: number;
}

export interface CueScene {
  id: number;
  name: string;
  /** fixture id -> channel values the scene authors for that fixture */
  fixture_states: Record<number, FixtureChannelState>;
  fade_in_ms: number;
  hold_ms: number;
  /** Scene priority within the same layer; higher wins channel conflicts. */
  priority: number;
  scene_status: string;
}
