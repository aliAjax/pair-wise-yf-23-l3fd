/** 统一写操作日志记录器（所有 service 写操作都经过这里）。 */
export function writeLog(entity: string, template: string, fields: Record<string, unknown> = {}): void {
  const message = template.replace(/\{(\w+)\}/g, (_, key: string) =>
    fields[key] === undefined ? `{${key}}` : String(fields[key])
  );
  // 纯前端本地工具：控制台输出，同时保留最近 200 条便于页面审计
  const entry = { at: new Date().toISOString(), entity, message };
  history.push(entry);
  if (history.length > 200) history.shift();
  // eslint-disable-next-line no-console
  console.info(`[${entity}]`, message, fields);
}

export interface LogEntry {
  at: string;
  entity: string;
  message: string;
}

export const history: LogEntry[] = [];

export function readLogs(): readonly LogEntry[] {
  return history;
}
