import { useEffect, useState } from "react";
import { idbGet, idbSet } from "../utils/idb";

/**
 * Persistent state backed by IndexedDB with a seed fallback.
 * Used for local UI state (e.g. selected track) that should survive reloads.
 */
export function useIndexedDbStore<T>(key: string, seedValue: T) {
  const [value, setValue] = useState<T>(seedValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    idbGet<T>(key)
      .then((stored) => {
        if (alive && stored !== undefined) setValue(stored);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      alive = false;
    };
  }, [key]);

  const persist = (next: T) => {
    setValue(next);
    void idbSet(key, next).catch(() => {
      /* IndexedDB unavailable: keep session-only state */
    });
  };

  return { value, setValue: persist, loaded };
}
