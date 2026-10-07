import { useMemo } from "react";
import type { Fixture } from "../types/Fixture";
import { DMX_UNIVERSE_CAPACITY } from "../constants/dmx";

export interface DmxAddressIssue {
  fixtureId: number;
  fixture_code: string;
  type: "OUT_OF_RANGE" | "OVERLAP" | "EXCEEDS_UNIVERSE";
  message: string;
  other?: Fixture;
}

/**
 * DMX 地址核对（灯具布置页与编排页共用）：
 * - 起始地址越界（<1 或 >512）；
 * - footprint 跨过宇宙末位；
 * - 两台灯具通道区间重叠。
 */
export function useDmxAddressCheck(
  fixtures: Fixture[],
  capacity: number = DMX_UNIVERSE_CAPACITY
): { issues: DmxAddressIssue[]; valid: boolean } {
  return useMemo(() => {
    const issues: DmxAddressIssue[] = [];
    for (const fixture of fixtures) {
      if (fixture.dmx_address < 1 || fixture.dmx_address > capacity) {
        issues.push({
          fixtureId: fixture.id,
          fixture_code: fixture.fixture_code,
          type: "OUT_OF_RANGE",
          message: `${fixture.fixture_code} 起始地址 ${fixture.dmx_address} 超出 1-${capacity}`
        });
        continue;
      }
      if (fixture.dmx_address + fixture.channel_count - 1 > capacity) {
        issues.push({
          fixtureId: fixture.id,
          fixture_code: fixture.fixture_code,
          type: "EXCEEDS_UNIVERSE",
          message: `${fixture.fixture_code} 占用到 ${fixture.dmx_address + fixture.channel_count - 1}，越过宇宙末位 ${capacity}`
        });
      }
    }
    for (let i = 0; i < fixtures.length; i++) {
      for (let j = i + 1; j < fixtures.length; j++) {
        const a = fixtures[i];
        const b = fixtures[j];
        const aEnd = a.dmx_address + a.channel_count - 1;
        const bEnd = b.dmx_address + b.channel_count - 1;
        if (a.dmx_address <= bEnd && b.dmx_address <= aEnd) {
          issues.push({
            fixtureId: a.id,
            fixture_code: a.fixture_code,
            type: "OVERLAP",
            message: `${a.fixture_code}(${a.dmx_address}-${aEnd}) 与 ${b.fixture_code}(${b.dmx_address}-${bEnd}) 通道重叠`,
            other: b
          });
        }
      }
    }
    return { issues, valid: issues.length === 0 };
  }, [fixtures, capacity]);
}
