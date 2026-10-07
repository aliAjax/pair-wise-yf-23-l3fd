export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  RBAC_DENIED: "RBAC_DENIED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  /** 轨道乐观锁冲突：两位灯光师同时改同一轨道，晚到的一版被拒 */
  TRACK_VERSION_CONFLICT: "TRACK_VERSION_CONFLICT",
  /** 轨道被锁定，禁止改时长 */
  TRACK_LOCKED: "TRACK_LOCKED",
  /** 引用的实体不存在（如轨道关联了已删除的场景） */
  ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
  /** DMX 宇宙通道超过 512 */
  DMX_UNIVERSE_OVERFLOW: "DMX_UNIVERSE_OVERFLOW"
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
