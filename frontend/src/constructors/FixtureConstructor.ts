import type { Fixture } from "../types/Fixture";
import type { FixtureType } from "../constants/FixtureType";
import type { ChannelMode } from "../constants/ChannelMode";

let seq = 1000;

/** 新建灯具的默认对象（表单初始值） */
export function createDefaultFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: --seq,
    fixture_code: "NEW-FIX",
    fixture_type: "PAR" as FixtureType,
    position_x: 50,
    position_y: 50,
    dmx_address: 1,
    channel_count: 3,
    color_mode: "RGB" as ChannelMode,
    ...overrides
  };
}

export const createFixtureForm = createDefaultFixture;
export const createFixtureResponse = createDefaultFixture;
