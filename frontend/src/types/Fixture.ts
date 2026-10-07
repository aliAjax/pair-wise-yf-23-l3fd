export interface Fixture {
  id: number;
  fixture_code: string;
  fixture_type: string;
  position_x: number;
  position_y: number;
  /** 1-based DMX start channel within its universe. */
  dmx_address: number;
  channel_count: number;
  color_mode: string;
}
