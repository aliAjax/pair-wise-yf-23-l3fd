/**
 * 日志模板集中存放。每个实体至少 4 条；字段变更时必须同步修改模板和调用处。
 * TimelineTrack 的写操作额外覆盖了本次叠加/并发需求相关事件。
 */
export const LOG_TEMPLATES = {
  Fixture: ["灯具创建", "灯具更新", "灯具状态变更", "灯具导出"],
  CueScene: ["灯光场景创建", "灯光场景更新", "灯光场景状态变更", "灯光场景导出"],
  TimelineTrack: [
    "时间轴轨道创建",
    "时间轴轨道更新",
    "时间轴轨道状态变更",
    "时间轴轨道导出",
    "时间轴轨道保存冲突（版本 {version} 已过期，先保存者：{winner}）",
    "时间轴叠加重算完成（{time_ms}ms，溢出宇宙 {overflow_universes} 个）"
  ],
  ShowProject: ["演出方案创建", "演出方案更新", "演出方案状态变更", "演出方案导出"]
} as const;

export type LogEntity = keyof typeof LOG_TEMPLATES;
