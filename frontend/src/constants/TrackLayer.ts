/**
 * 压层（Layer）：同一时刻多条轨道叠加时的裁决顺序。
 * 数值越大优先级越高：追光层 > 效果层 > 基础层。
 * 同层之间再按场景 priority（CueScene.priority）裁决。
 */
export const TrackLayer = ["BASE", "EFFECT", "FOLLOW_SPOT"] as const;
export type TrackLayer = (typeof TrackLayer)[number];

export const LAYER_RANK: Record<TrackLayer, number> = {
  BASE: 1,
  EFFECT: 2,
  FOLLOW_SPOT: 3
};

export const TrackLayerText: Record<TrackLayer, string> = {
  BASE: "基础层",
  EFFECT: "效果层",
  FOLLOW_SPOT: "追光层"
};

/** 合并时的排序键：先按压层，再按场景优先级 */
export function layerRank(layer: string): number {
  return LAYER_RANK[layer as TrackLayer] ?? 0;
}
