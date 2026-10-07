/**
 * IndexedDB 本地持久层（纯前端，无第三方 API）。
 * 四个核心实体各占一个 object store，首启时注入 mocks/seedData。
 */
import { mockData } from "../mocks/seedData";

const DB_NAME = (import.meta.env.VITE_DB_NAME as string | undefined) ?? "stage-light";
const DB_VERSION = 1;

export const DB_STORES = ["fixture", "cueScene", "timelineTrack", "showProject"] as const;
export type DbStore = (typeof DB_STORES)[number];

/** 轨道历史版本快照，key = `${trackId}#${version}`，供乐观锁冲突时比对差异 */
const REVISION_STORE = "trackRevision";
const ALL_STORES: readonly string[] = [...DB_STORES, REVISION_STORE];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of ALL_STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === REVISION_STORE ? "key" : "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx<T>(store: DbStore, mode: IDBTransactionMode, run: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(store, mode).objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function idbGetAll<T>(store: DbStore): Promise<T[]> {
  return tx<T[]>(store, "readonly", (s) => s.getAll() as IDBRequest<T[]>);
}

export async function idbPut<T extends { id: number }>(store: DbStore, row: T): Promise<T> {
  return tx(store, "readwrite", (s) => s.put(row)).then(() => row);
}

export async function idbBulkPut<T extends { id: number }>(store: DbStore, rows: T[]): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, "readwrite");
    const objectStore = transaction.objectStore(store);
    rows.forEach((row) => objectStore.put(row));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

interface RevisionRow {
  key: string;
  snapshot: unknown;
}

/** 保存轨道某版本的快照 */
export async function idbPutRevision(row: RevisionRow): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(REVISION_STORE, "readwrite");
    transaction.objectStore(REVISION_STORE).put(row);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function idbGetRevision<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(REVISION_STORE, "readonly").objectStore(REVISION_STORE).get(key) as IDBRequest<RevisionRow | undefined>;
    request.onsuccess = () => resolve(request.result?.snapshot as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

/** 首次打开时写入种子数据；之后一律以库内数据为准。 */
export async function ensureSeedData(): Promise<void> {
  const existing = await Promise.all(DB_STORES.map((store) => idbGetAll(store).then((rows) => [store, rows.length] as const)));
  const empty = existing.filter(([, count]) => count === 0).map(([store]) => store);
  await Promise.all(
    empty.map((store) => {
      const rows = mockData[store] as unknown as Array<{ id: number }>;
      return idbBulkPut(store, [...rows]);
    })
  );
}

/** 清空并恢复种子（排查“常见问题：重置本地数据”时使用） */
export async function resetSeedData(): Promise<void> {
  const db = await openDb();
  await Promise.all(
    DB_STORES.map(
      (store) =>
        new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(store, "readwrite");
          transaction.objectStore(store).clear();
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        })
    )
  );
  await ensureSeedData();
}
