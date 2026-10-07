import type { ChannelMode } from "../constants/ChannelMode";
import type { FixtureType } from "../constants/FixtureType";

export interface Fixture {
  id: number;
  fixture_code: string;
  fixture_type: FixtureType;
  position_x: number;
  position_y: number;
  /** DMX 起始地址，1-512（同一宇宙内） */
  dmx_address: number;
  channel_count: number;
  color_mode: ChannelMode;
}
