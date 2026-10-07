import type { LayerType } from "../types/Layer";

/**
 * 压层优先级：追光层在最上，效果层居中，基础层垫底。
 * 多轨道同时生效时，高层级轨道优先占用通道，低层级只补未被占用的通道。
 */
export const LAYER_PRIORITY: Record<LayerType, number> = {
  SPOT: 3,
  EFFECT: 2,
  BASE: 1
};

/** Display order, bottom layer first. */
export const LAYER_ORDER: LayerType[] = ["BASE", "EFFECT", "SPOT"];

export const LAYER_TEXT: Record<LayerType, string> = {
  BASE: "基础层",
  EFFECT: "效果层",
  SPOT: "追光层"
};

/** Layer lane accent colors used by the timeline UI. */
export const LAYER_COLOR: Record<LayerType, string> = {
  BASE: "#6b8f71",
  EFFECT: "#d39b46",
  SPOT: "#b0563d"
};
