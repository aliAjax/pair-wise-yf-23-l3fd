import type { CueStatus } from "../constants/CueStatus";
import type { FixtureChannelValues } from "./timeline";

export interface CueScene {
  id: number;
  name: string;
  /** key 为 fixture id，value 为该场景下的通道输出 */
  fixture_states: Record<number, FixtureChannelValues>;
  fade_in_ms: number;
  hold_ms: number;
  /** 同层内的场景优先级，数值越大越优先占用通道 */
  priority: number;
  scene_status: CueStatus;
}
