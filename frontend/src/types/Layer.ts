export const LAYER_TYPES = ["BASE", "EFFECT", "SPOT"] as const;
export type LayerType = (typeof LAYER_TYPES)[number];
