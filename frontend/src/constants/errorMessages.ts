export const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  CONCURRENT_SAVE_CONFLICT: "该轨道已被另一位灯光师先保存，先保存的版本已生效，你的修改未被应用",
  UNIVERSE_OVERFLOW: "DMX 宇宙通道数超过 512，请核对溢出轨道",
  PREVIEW_RECOMPUTING: "舞台预览正在重算，完成后才能播放",
  TRACK_LOCKED: "轨道已锁定，解锁后才能修改时长",
  INVALID_TRACK_DURATION: "轨道时长必须大于 0",
  PREVIEW_WORKER_FAILED: "预览重算线程异常，请稍后重试"
};
