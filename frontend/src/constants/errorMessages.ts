import type { ERROR_CODES } from "./errorCodes";

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  TRACK_VERSION_CONFLICT:
    "该轨道已被另一位灯光师先保存，你这版未生效；请核对下列差异后决定重读或强制覆盖。",
  TRACK_LOCKED: "轨道已锁定，无法修改时长，请先解锁。",
  ENTITY_NOT_FOUND: "引用的数据不存在，请刷新后重试。",
  DMX_UNIVERSE_OVERFLOW: "叠加后宇宙通道占用超过 512，存在溢出，请删减同时段轨道。"
};

/** service 层异常包装（api/controller 层会再包一层，禁止全局吞异常） */
export class TrackConflictError extends Error {
  readonly code = "TRACK_VERSION_CONFLICT" as const;
  constructor(
    /** 当前库里的最新版本 */
    readonly current: Record<string, unknown>,
    /** 晚到者试图写入的版本 */
    readonly attempted: Record<string, unknown>,
    /** 逐字段差异 */
    readonly diff: FieldDiff[]
  ) {
    super(ERROR_MESSAGES.TRACK_VERSION_CONFLICT);
    this.name = "TrackConflictError";
  }
}

export interface FieldDiff {
  field: string;
  /** 先保存一版的值 */
  savedValue: unknown;
  /** 晚到一版的值 */
  attemptedValue: unknown;
  /** 晚到者保存时所基于的旧值 */
  baseValue: unknown;
  conflict: boolean;
}

export class TrackLockedError extends Error {
  readonly code = "TRACK_LOCKED" as const;
  constructor(readonly trackId: number) {
    super(ERROR_MESSAGES.TRACK_LOCKED);
    this.name = "TrackLockedError";
  }
}

export class EntityNotFoundError extends Error {
  readonly code = "ENTITY_NOT_FOUND" as const;
  constructor(readonly entity: string, readonly id: number) {
    super(`${entity}#${id} 不存在`);
    this.name = "EntityNotFoundError";
  }
}
