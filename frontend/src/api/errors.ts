import { ERROR_MESSAGES } from "../constants/errorMessages";

/**
 * Service-layer error carrying a stable code plus optional details
 * (e.g. the server track and field diffs for a save conflict).
 */
export class ApiError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Wrap an unknown failure at the service layer so every API throws a typed
 * ApiError instead of leaking a raw exception.
 */
export function wrapApiError(code: string, error: unknown, context: string): ApiError {
  if (error instanceof ApiError) return error;
  const fallback = ERROR_MESSAGES[code] ?? "操作失败，请稍后重试";
  const message = error instanceof Error ? error.message : fallback;
  return new ApiError(code, `[${context}] ${message}`, undefined);
}

/**
 * Controller-layer wrap used by stores: re-brand a service error with the
 * calling controller context without swallowing it.
 */
export function wrapControllerError(
  code: string,
  error: unknown,
  controller: string
): ApiError {
  if (error instanceof ApiError) {
    return new ApiError(error.code, `[${controller}] ${error.message}`, error.details);
  }
  const fallback = ERROR_MESSAGES[code] ?? "操作失败，请稍后重试";
  const message = error instanceof Error ? error.message : fallback;
  return new ApiError(code, `[${controller}] ${message}`, undefined);
}
