/**
 * 全局应用配置：构建期环境变量经 Vite 注入到这里，
 * worker/闸门/IndexedDB 都只读这一层。新增配置要同步 .env.example、README。
 */
export const appConfig = {
  dbName: import.meta.env.VITE_DB_NAME ?? "stage-light",
  reconcileGateDelayMs: Number(import.meta.env.VITE_RECONCILE_DELAY_MS ?? 350),
  appName: "stage-light"
} as const;
