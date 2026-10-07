import { useMemo } from "react";
import type { Fixture } from "../types/Fixture";
import { DMX_UNIVERSE_SIZE, getUniverseOfAddress } from "../utils/playbackEngine";

export interface DmxWarning {
  type: "duplicate-address" | "universe-overflow";
  message: string;
  fixture_ids?: number[];
  universe?: number;
  used_channels?: number;
}

/**
 * Real DMX validation: flags duplicate channels within a universe and
 * universes whose distinct channel union exceeds 512.
 */
export function useDmxAddressCheck(fixtures: Fixture[] = []): DmxWarning[] {
  return useMemo(() => {
    const warnings: DmxWarning[] = [];
    const byUniverse = new Map<number, Map<number, number[]>>();

    for (const fixture of fixtures) {
      const universe = getUniverseOfAddress(fixture.dmx_address);
      const channelMap = byUniverse.get(universe) ?? new Map<number, number[]>();
      for (let i = 0; i < fixture.channel_count; i++) {
        const absolute = fixture.dmx_address + i;
        const channel = ((absolute - 1) % DMX_UNIVERSE_SIZE) + 1;
        const list = channelMap.get(channel) ?? [];
        list.push(fixture.id);
        channelMap.set(channel, list);
      }
      byUniverse.set(universe, channelMap);
    }

    for (const [universe, channelMap] of byUniverse) {
      for (const [channel, ids] of channelMap) {
        if (ids.length > 1) {
          warnings.push({
            type: "duplicate-address",
            universe,
            fixture_ids: ids,
            message: `宇宙 ${universe} 通道 ${channel} 被 ${ids.length} 个灯具重复占用`
          });
        }
      }
      const used = channelMap.size;
      if (used > DMX_UNIVERSE_SIZE) {
        warnings.push({
          type: "universe-overflow",
          universe,
          used_channels: used,
          message: `宇宙 ${universe} 已占用 ${used} 个通道，超过 ${DMX_UNIVERSE_SIZE}`
        });
      }
    }
    return warnings;
  }, [fixtures]);
}
