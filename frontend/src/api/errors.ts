import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/**
 * controller/api 层统一异常：
 * service 层抛出的 TrackConflictError 等业务异常到这里再包一层，
 * 禁止只在一个全局位置吞掉全部异常。
 */
export class ApiRequestError extends Error {
  readonly code: ErrorCode;
  readonly detail?: unknown;

  constructor(code: ErrorCode, detail?: unknown, message?: string) {
    super(message ?? ERROR_MESSAGES[code] ?? "请求失败");
    this.name = "ApiRequestError";
    this.code = code;
    this.detail = detail;
  }
}

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

/** 已知业务异常按 code 透传，未知异常包成 VALIDATION_FAILED */
export function wrapServiceError(error: unknown): ApiRequestError {
  if (isApiError(error)) return error;
  const code = (error as { code?: ErrorCode })?.code;
  if (code && code in ERROR_CODES) {
    return new ApiRequestError(code, error, (error as Error).message);
  }
  return new ApiRequestError("VALIDATION_FAILED", error, (error as Error)?.message);
}
