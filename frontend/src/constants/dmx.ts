/** DMX 容量与合成相关常量。 */

/** 标准 DMX 单宇宙通道上限 */
export const DMX_UNIVERSE_CAPACITY = 512;

/** 通道值范围 */
export const DMX_VALUE_MIN = 0;
export const DMX_VALUE_MAX = 255;

/**
 * 重算闸门的 worker 模拟耗时（ms）。
 * 轨道一改就重算，这期间舞台预览不允许继续播放；
 * 故意保留一段可感知耗时，方便评审核对“没算完不能接着播”。
 */
export const RECONCILE_GATE_DELAY_MS = Number(
  import.meta.env.VITE_RECONCILE_DELAY_MS ?? 350
);

/** 播放时时间游标推进的节流间隔（ms） */
export const PLAYBACK_TICK_MS = 100;
