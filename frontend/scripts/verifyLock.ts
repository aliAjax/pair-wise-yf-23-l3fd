/**
 * 乐观锁并发保存验证（Node 环境，注入最小内存版 indexedDB）：
 * 阿玲与阿杰同时基于 v2 修改轨道 3 的时长；
 * 先保存的阿玲生效（v3），晚到的阿杰被拒并拿到逐字段差异；
 * 阿杰核对后强制覆盖 -> v4 生效；锁定轨道改时长应被拒。
 */
import assert from "node:assert";

// ---- 最小内存 indexedDB 桩（仅覆盖 localDb 用到的 API）----
type Listener = () => void;
function asyncRequest<T>(getResult: () => T) {
  return {
    result: undefined as unknown as T,
    onsuccess: null as Listener | null,
    onerror: null as Listener | null,
    error: null as Error | null,
    _fire(this: any) {
      this.result = getResult();
      queueMicrotask(() => this.onsuccess?.());
    }
  } as any;
}

class MemStore {
  rows = new Map<unknown, unknown>();
  constructor(public keyPath: string) {}
  request(method: () => unknown) {
    const req = asyncRequest(method);
    queueMicrotask(() => req._fire());
    return req;
  }
  put(value: any) {
    return this.request(() => {
      this.rows.set(value[this.keyPath], structuredClone(value));
      return structuredClone(value);
    });
  }
  get(key: unknown) {
    return this.request(() => structuredClone(this.rows.get(key)));
  }
  getAll() {
    return this.request(() => [...this.rows.values()].map((v) => structuredClone(v)));
  }
  clear(tx?: any) {
    return this.request(() => {
      this.rows.clear();
      if (tx) queueMicrotask(() => tx.oncomplete?.());
    });
  }
}

const stores = new Map<string, MemStore>(
  ["fixture", "cueScene", "timelineTrack", "showProject"].map((n) => [n, new MemStore("id")])
);
stores.set("trackRevision", new MemStore("key"));

function objectStore(name: string, tx: any) {
  const store = stores.get(name)!;
  return {
    put: (row: any) => store.put(row),
    get: (key: unknown) => store.get(key),
    getAll: () => store.getAll(),
    clear: () => store.clear(tx)
  };
}

(globalThis as any).indexedDB = {
  open() {
    const req = {
      result: {
        objectStoreNames: { contains: (n: string) => stores.has(n) },
        createObjectStore: (n: string, opts: any) => stores.set(n, new MemStore(opts.keyPath)),
        transaction: (names: string | string[], mode: string) => {
          const tx: any = { oncomplete: null, onerror: null, error: null };
          tx.objectStore = (n: string) => objectStore(n, tx);
          if (mode === "readwrite") queueMicrotask(() => tx.oncomplete?.());
          return tx;
        }
      },
      onupgradeneeded: null as Listener | null,
      onsuccess: null as Listener | null,
      onerror: null as Listener | null,
      error: null
    };
    queueMicrotask(() => {
      req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  }
};

// ---- 测试 ----
const { idbBulkPut } = await import("../src/api/localDb");
const { applyTrackEditService } = await import("../src/services/TimelineTrackService");
const { mockData } = await import("../src/mocks/seedData");

await idbBulkPut("timelineTrack", mockData.timelineTrack.map((t) => ({ ...t })));

const PERSON_A = "灯光师-阿玲";
const PERSON_B = "灯光师-阿杰";

// 阿玲先保存：基于 v2 改时长 5000 -> v3 生效
const saved = await applyTrackEditService({
  id: 3,
  duration_ms: 5000,
  base_version: 2,
  editor: PERSON_A
});
assert.strictEqual(saved.version, 3);
assert.strictEqual(saved.duration_ms, 5000);
assert.strictEqual(saved.updated_by, PERSON_A);

// 阿杰晚到，仍拿着 base_version=2 改时长为 6000 -> 被拒并带差异
try {
  await applyTrackEditService({ id: 3, duration_ms: 6000, base_version: 2, editor: PERSON_B });
  assert.fail("晚到保存必须被拒绝");
} catch (error: any) {
  assert.strictEqual(error.code, "TRACK_VERSION_CONFLICT");
  assert.strictEqual(error.current.version, 3);
  const durationDiff = error.diff.find((d: any) => d.field === "duration_ms");
  assert.ok(durationDiff.conflict);
  assert.strictEqual(durationDiff.baseValue, 4000);
  assert.strictEqual(durationDiff.savedValue, 5000);
  assert.strictEqual(durationDiff.attemptedValue, 6000);
}

// 阿杰核对差异后强制覆盖 -> v4
const forced = await applyTrackEditService(
  { id: 3, duration_ms: 6000, base_version: 3, editor: PERSON_B },
  { force: true }
);
assert.strictEqual(forced.version, 4);
assert.strictEqual(forced.duration_ms, 6000);
assert.strictEqual(forced.updated_by, PERSON_B);

// 锁定轨道（种子轨道 4）改时长 -> TRACK_LOCKED
try {
  await applyTrackEditService({ id: 4, duration_ms: 9999, base_version: 1, editor: PERSON_B });
  assert.fail("锁定轨道改时长必须被拒");
} catch (error: any) {
  assert.strictEqual(error.code, "TRACK_LOCKED");
}

console.log("optimistic-lock: all assertions passed");
