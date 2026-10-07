/**
 * 时间轴叠加合成相关的数据结构。
 *
 * 基础层 / 效果层 / 追光层在同一时间段叠放时，由 services/timelineMerge
 * 按压层和场景优先级合成最终通道值：优先级高的先占用通道，
 * 优先级低的只补没有被占用的通道。
 */

/** 单台灯具的逻辑通道输出，取值 0-255（缺省通道视为未输出/被补位） */
export interface FixtureChannelValues {
  red?: number;
  green?: number;
  blue?: number;
  white?: number;
  dimmer?: number;
  strobe?: number;
  pan?: number;
  tilt?: number;
}

/** 逻辑通道名（与 ColorChannelSlider、StageCanvas 共用） */
export type ChannelName = keyof FixtureChannelValues;

/** 某个通道最终由哪条轨道占用 */
export interface ChannelOwnership {
  trackId: number;
  sceneId: number;
  layer: string;
  /** OCCUPY：高优先级占用；FILL：低优先级补位未占用通道 */
  mode: "OCCUPY" | "FILL";
}

export interface MergedFixtureFrame {
  fixtureId: number;
  values: FixtureChannelValues;
  /** 每个有值通道的归属，用于在编排页核对“这条通道谁说了算” */
  ownership: Partial<Record<ChannelName, ChannelOwnership>>;
}

export interface ActiveContribution {
  trackId: number;
  sceneId: number;
  layer: string;
  scenePriority: number;
  /** 该轨道此刻激活的灯具 footprint（起始地址..结束地址）集合 */
  fixtureFootprints: Array<{ fixtureId: number; start: number; end: number }>;
  /** 该轨道把容量顶到的最高绝对地址（按 footprint 计） */
  peakAddress: number;
}

/** 单个宇宙的容量核对结果 */
export interface UniverseUsage {
  universe: number;
  /** 实际被占用/补位的通道数（按灯具 footprint 合并后） */
  usedChannels: number;
  capacity: number;
  /** 使用到的最高绝对地址 */
  highestAddress: number;
  overflow: boolean;
  /** 超容量的通道数（0 表示未溢出） */
  overflowBy: number;
  /** 把容量顶到 512 以上的轨道（按顶到的最高地址倒序） */
  contributors: ActiveContribution[];
}

/** 时间轴在某一时刻合成出的整帧结果 */
export interface ReconciledFrame {
  time_ms: number;
  fixtures: MergedFixtureFrame[];
  activeTrackIds: number[];
  universes: UniverseUsage[];
  hasOverflow: boolean;
}

export interface ReconcileRequest {
  time_ms: number;
  tracks: unknown;
  scenes: unknown;
  fixtures: unknown;
  /** 配置：每宇宙通道容量（标准 DMX 为 512） */
  universeCapacity?: number;
}

export interface ReconcileResponse {
  frame: ReconciledFrame;
  /** worker 侧实际计算耗时（ms），配合闸门状态展示“没算完不能播” */
  compute_ms: number;
}
