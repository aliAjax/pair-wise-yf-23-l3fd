/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** IndexedDB 库名（经 config/构建期环境变量注入） */
  readonly VITE_DB_NAME?: string;
  /** 叠加重算闸门的可感知耗时（ms），用于演示“没算完不能播” */
  readonly VITE_RECONCILE_DELAY_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
